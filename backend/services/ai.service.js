// backend/services/ai.service.js
import { getGeminiService } from './gemini.service.js';
import { buildPrompt } from './prompt.service.js';

// ── Backstop filter for "multiple valid answers" questions ──
// Even with strict prompt rules, the model sometimes still generates
// open-ended questions that accept several correct words (e.g.
// "The _____ is an example of an output device." — monitor / printer /
// speaker are all correct). Since Identification & Fill-in-the-Blank are
// graded by exact text match, these mark correct students WRONG, so we
// drop them here as a safety net.
//
// Only Identification & Fill-in-the-Blank are checked — Multiple Choice and
// True/False are fine, because "an example of an output device" there has a
// fixed set of options / a single true-false verdict.
//
// The patterns below are intentionally conservative (only the clearest
// "member of a category" signals) so we don't drop legitimate single-answer
// questions like "What type of number system uses only 0 and 1?" → "Binary".
const AMBIGUOUS_PATTERNS = [
  /\bexamples?\s+of\b/i,      // "an example of", "examples of"
  /\bsuch\s+as\b/i,          // "... such as _____"
  /\bone\s+of\s+the\b/i,     // "one of the output devices is _____"
  /\bgive\s+(an|one)\b/i,    // "give one ...", "give an ..."
  /\bname\s+(an|one)\b/i,    // "name an ...", "name one ..."
];

function isMultiAnswerQuestion(q) {
  const type = String(q?.type || '');
  // Only open, exact-match-graded types are at risk.
  if (type !== 'identification' && type !== 'fill-in-blank') return false;
  const text = String(q?.question || '');
  return AMBIGUOUS_PATTERNS.some((re) => re.test(text));
}

function normalizeQuestionKey(q) {
  return String(q?.question || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

async function generateQuiz({ lessonContent, quizType, questionCount = 15 }) {
  console.log(`📝 Generating ${questionCount} questions using Gemini...`);

  const service = getGeminiService();

  const runOnce = async (count) => {
    const prompt = buildPrompt({ lessonContent, quizType, questionCount: count });
    return await service.generateQuestions(prompt);
  };

  // First pass.
  let questions = await runOnce(questionCount);

  // Drop any question that could have multiple valid answers, de-duplicating
  // by question text at the same time.
  const seen = new Set();
  const keep = [];
  let dropped = 0;
  for (const q of questions) {
    const key = normalizeQuestionKey(q);
    if (isMultiAnswerQuestion(q)) { dropped++; continue; }
    if (seen.has(key)) { dropped++; continue; }
    seen.add(key);
    keep.push(q);
  }
  if (dropped > 0) {
    console.log(`🧹 Dropped ${dropped} ambiguous/duplicate question(s); backfilling to reach ${questionCount}.`);
  }

  // Backfill: ask the model for more questions until we hit the requested
  // count (or run out of attempts). Fewer than requested is non-fatal — the
  // app just uses questions.length — so this is a best-effort top-up.
  let attempts = 0;
  const MAX_BACKFILL_ATTEMPTS = 3;
  while (keep.length < questionCount && attempts < MAX_BACKFILL_ATTEMPTS) {
    attempts++;
    const shortfall = questionCount - keep.length;
    let refill = [];
    try {
      refill = await runOnce(shortfall);
    } catch (err) {
      console.warn(`⚠️ Backfill attempt ${attempts} failed: ${err.message}`);
      break;
    }
    for (const q of refill) {
      if (keep.length >= questionCount) break;
      const key = normalizeQuestionKey(q);
      if (isMultiAnswerQuestion(q)) continue;
      if (seen.has(key)) continue;
      seen.add(key);
      keep.push(q);
    }
  }

  console.log(`✅ Returning ${keep.length} question(s) after single-answer filtering.`);
  return keep;
}

export { generateQuiz };
