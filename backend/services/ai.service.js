// backend/services/ai.service.js
import { getGeminiService } from './gemini.service.js';
import { buildPrompt } from './prompt.service.js';

/* ══════════════════════════════════════════════════════════════════════
   QUESTION VALIDATION / SANITIZATION LAYER
   ----------------------------------------------------------------------
   Even with strict prompt rules, the model sometimes returns questions
   that are ambiguous or structurally broken in ways that make correct
   students get marked WRONG (answers are graded by exact/typed match).
   This layer runs after generation and, per question:
     • FIXES what is safely fixable (trim, normalize True/False, snap a
       multiple-choice correctAnswer to the exact option string), and
     • DROPS what is broken or ambiguous (then we backfill to keep count).
   Only structural / clearly-detectable problems are handled here — purely
   semantic issues (e.g. two options that are both truly correct, a
   half-true true/false statement) can only be mitigated by the prompt.
   ══════════════════════════════════════════════════════════════════════ */

// Wording that signals an open-ended (typed) question has MORE THAN ONE
// valid answer — e.g. "The _____ is an example of an output device."
// (monitor / printer / speaker are all correct). Conservative on purpose so
// we don't drop legitimate single-answer questions.
const AMBIGUOUS_PATTERNS = [
  /\bexamples?\s+of\b/i,   // "an example of", "examples of"
  /\bsuch\s+as\b/i,        // "... such as _____"
  /\bone\s+of\s+the\b/i,   // "one of the output devices is _____"
  /\bgive\s+(an|one)\b/i,  // "give one ...", "give an ..."
  /\bname\s+(an|one)\b/i,  // "name an ...", "name one ..."
];

function cleanStr(s) {
  return String(s ?? '').replace(/\s+/g, ' ').trim();
}

function wordCount(s) {
  return cleanStr(s).split(' ').filter(Boolean).length;
}

// Fisher-Yates shuffle → returns a new array. Used to randomize the position
// of a multiple-choice question's options so the correct answer doesn't keep
// landing in the same slot (e.g. always "A") across a whole round.
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function looksMultiAnswer(questionText) {
  return AMBIGUOUS_PATTERNS.some((re) => re.test(questionText));
}

// Returns a cleaned/fixed question object, or null if it must be dropped.
function validateAndFixQuestion(raw) {
  if (!raw || typeof raw !== 'object') return null;

  const type = String(raw.type || '');
  const question = cleanStr(raw.question);
  let correctAnswer = cleanStr(raw.correctAnswer);
  if (!question) return null;

  // ── Multiple choice ──
  if (type === 'multiple') {
    const options = Array.isArray(raw.options)
      ? raw.options.map(cleanStr).filter(Boolean)
      : [];
    // Need exactly 4 distinct options.
    const distinct = new Set(options.map((o) => o.toLowerCase()));
    if (options.length !== 4 || distinct.size !== 4) return null;
    // correctAnswer MUST correspond to exactly one option. Snap it to that
    // option's exact string so the frontend's button click compares equal.
    const match = options.find((o) => o.toLowerCase() === correctAnswer.toLowerCase());
    if (!match) return null; // paraphrased answer that matches no option → drop
    // Randomize the correct answer's slot PER QUESTION. The model tends to
    // place the correct option first, so without this a whole round can come
    // out all "A". Grading is by exact string match (not index), so shuffling
    // the option order is safe — `match` is still the correct string.
    return { ...raw, question, options: shuffle(options), correctAnswer: match, type };
  }

  // ── True / False ──
  if (type === 'true-false') {
    const v = correctAnswer.toLowerCase();
    let norm = null;
    if (['true', 't', 'yes'].includes(v)) norm = 'True';
    else if (['false', 'f', 'no'].includes(v)) norm = 'False';
    if (!norm) return null; // can't tell what the answer is → drop
    return { ...raw, question, correctAnswer: norm, type };
  }

  // ── Fill-in-the-blank ──
  if (type === 'fill-in-blank') {
    if (!correctAnswer) return null;
    if (!/_{2,}/.test(question)) return null;       // must actually contain a blank
    if (looksMultiAnswer(question)) return null;    // multiple valid answers
    return { ...raw, question, correctAnswer, type };
  }

  // ── Identification ──
  if (type === 'identification') {
    if (!correctAnswer) return null;
    if (looksMultiAnswer(question)) return null;    // multiple valid answers
    // Guard against sentence-length answers. Allow up to 4 words per
    // "/"-separated form (covers "CPU / Central Processing Unit").
    const parts = correctAnswer.split('/').map((p) => p.trim()).filter(Boolean);
    if (parts.length === 0) return null;
    if (parts.some((p) => wordCount(p) > 4)) return null;
    return { ...raw, question, correctAnswer, type };
  }

  // Unknown type — keep only if it has the basics.
  if (!correctAnswer) return null;
  return { ...raw, question, correctAnswer, type };
}

function questionKey(q) {
  return cleanStr(q?.question).toLowerCase();
}

// Validate + de-duplicate a raw batch, appending survivors into `keep`.
// Returns how many were dropped.
function collectValid(rawQuestions, keep, seen, limit) {
  let dropped = 0;
  for (const raw of rawQuestions) {
    if (keep.length >= limit) break;
    const fixed = validateAndFixQuestion(raw);
    if (!fixed) { dropped++; continue; }
    const key = questionKey(fixed);
    if (!key || seen.has(key)) { dropped++; continue; }
    seen.add(key);
    keep.push(fixed);
  }
  return dropped;
}

async function generateQuiz({ lessonContent, quizType, questionCount = 15 }) {
  console.log(`📝 Generating ${questionCount} questions using Gemini...`);

  const service = getGeminiService();
  const runOnce = async (count) => {
    const prompt = buildPrompt({ lessonContent, quizType, questionCount: count });
    return await service.generateQuestions(prompt);
  };

  const keep = [];
  const seen = new Set();

  // First pass.
  const first = await runOnce(questionCount);
  const droppedFirst = collectValid(first, keep, seen, questionCount);
  if (droppedFirst > 0) {
    console.log(`🧹 Dropped ${droppedFirst} invalid/ambiguous/duplicate question(s); backfilling to reach ${questionCount}.`);
  }

  // Backfill until we reach the requested count (best-effort — fewer is
  // non-fatal since the app uses questions.length).
  let attempts = 0;
  const MAX_BACKFILL_ATTEMPTS = 3;
  while (keep.length < questionCount && attempts < MAX_BACKFILL_ATTEMPTS) {
    attempts++;
    const shortfall = questionCount - keep.length;
    try {
      const refill = await runOnce(shortfall);
      collectValid(refill, keep, seen, questionCount);
    } catch (err) {
      console.warn(`⚠️ Backfill attempt ${attempts} failed: ${err.message}`);
      break;
    }
  }

  console.log(`✅ Returning ${keep.length} validated question(s).`);
  return keep;
}

export { generateQuiz };
