// backend/services/gemini.service.js

// Hindi laging sinusunod ng LLM yung eksakto na type string na hiniling
// natin sa prompt.service.js (hal. "fill-in-blank"). Minsan nagbabalik ito
// ng "Fill in the Blank", "fillInBlank", "FILL_IN_BLANK", atbp. —
// magkaparehong klase ng tanong pero magkaibang casing/format. Kung hindi
// ito ma-normalize dito sa source, palagi itong magiging case-sensitive na
// === comparison ang masisira sa buong app (quiz.engine.js hindi
// makikita yung 'fill-in-blank' kaya hindi gagana yung correctAnswer
// hiding/blankPattern, at sa quiz_arena.jsx hindi lalabas yung reveal UI).
function normalizeQuestionType(rawType) {
  const s = String(rawType || '').toLowerCase().trim();

  if (s.includes('true') && s.includes('false')) return 'true-false';
  if (s.includes('fill')) return 'fill-in-blank';
  if (s.includes('ident')) return 'identification';
  if (s.includes('multi') || s.includes('choice') || s.includes('mcq')) return 'multiple';

  // Fallback: kung wala sa mga alam nating pattern, ibalik na lang yung
  // dating value nang naka-lowercase/naka-dash — mas maganda pa rin kaysa
  // sa random casing, pero hindi natin ito palalabasin bilang error dito.
  return s.replace(/[\s_]+/g, '-') || 'multiple';
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// How long to wait for a single NaraRouter response before giving up on
// that attempt. Kept short (not the old 25s) on purpose: mistral-large has
// shown latencies from ~39s up to 91.5s on the status page, and failing
// fast here means getting to the fallback model sooner instead of sitting
// through a long hang.
const REQUEST_TIMEOUT_MS = 8000;

// Models to try, in order. Primary is the fast pick (~0.9s p50 on
// NaraRouter's status page). Fallback is mistral-large — NOTE: this model
// has historically been very slow (38.8s-91.5s observed), so with an 8s
// timeout it will often NOT finish in time.
const MODEL_CHAIN = ['glm-5.2-alibaba', 'mistral-large'];

// How many attempts (including retries) to give a single model before
// moving on. Kept at 1 — with a short timeout, a second attempt on the
// same slow model rarely helps; better to spend that time on the next
// model instead.
const PER_MODEL_MAX_ATTEMPTS = 1;

// HTTP statuses that mean "try again shortly" rather than "this request is
// broken" — transient upstream/model outages, rate limits, gateway hiccups.
const RETRYABLE_STATUS = new Set([408, 425, 429, 500, 502, 503, 504, 529]);

// Some providers return 200/4xx with a JSON error body whose `type` signals a
// transient condition (this is exactly what NaraRouter's "service_unavailable"
// / "The model service is temporarily unavailable" looks like).
function isTransient(status, data) {
  if (RETRYABLE_STATUS.has(status)) return true;
  const type = String(data?.error?.type || '').toLowerCase();
  const msg = String(data?.error?.message || '').toLowerCase();
  return /unavailable|overloaded|temporarily|rate.?limit|timeout|capacity/.test(
    `${type} ${msg}`
  );
}

function isTransientNetworkError(error) {
  // AbortController firing (our own REQUEST_TIMEOUT_MS) surfaces as
  // AbortError with a generic message — treat it as transient explicitly
  // rather than relying on the message text matching below.
  if (error?.name === 'AbortError') return true;
  // A thrown fetch (no HTTP response at all) — DNS, reset, abort, etc.
  return /fetch failed|network|econn|etimedout|socket hang up|timeout|und_err/i.test(
    String(error?.message || '')
  );
}

function getGeminiService() {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set in your .env file.');
  }

  console.log('✅ NaraRouter API key loaded, length:', apiKey.length);

  // Runs one model through its own retry loop. Returns parsed + normalized
  // questions on success, or throws (message tagged with the model name)
  // so the caller can decide whether to fall through to the next model.
  async function attemptModel(model, prompt) {
    let lastError;

    for (let attempt = 1; attempt <= PER_MODEL_MAX_ATTEMPTS; attempt++) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

      try {
        console.log(`📤 [${model}] Sending prompt to NaraRouter (attempt ${attempt}/${PER_MODEL_MAX_ATTEMPTS})...`);

        const response = await fetch(
          'https://router.bynara.id/v1/chat/completions',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              model,
              messages: [
                { role: 'user', content: prompt }
              ],
              temperature: 0.7,
              max_tokens: 8192,
            }),
            signal: controller.signal,
          }
        );

        clearTimeout(timeoutId);

        const data = await response.json();

        if (!response.ok) {
          if (isTransient(response.status, data) && attempt < PER_MODEL_MAX_ATTEMPTS) {
            const wait = Math.round(700 * 2 ** (attempt - 1) + Math.random() * 400);
            console.warn(`⚠️ [${model}] transient error ${response.status} — retrying in ${wait}ms`);
            lastError = new Error(JSON.stringify(data));
            await sleep(wait);
            continue;
          }
          throw new Error(JSON.stringify(data));
        }

        // Guard: response was HTTP 200 but the body doesn't actually have
        // the `choices` shape we expect (this is the exact crash we hit
        // with mistral-large — a 200 with a malformed/empty body). Treat
        // this the same as a transient error and retry, instead of
        // letting `data.choices[0]` throw an unhandled TypeError.
        const content = data?.choices?.[0]?.message?.content;
        if (!content) {
          const bodyPreview = JSON.stringify(data).slice(0, 500);
          console.warn(`⚠️ [${model}] returned 200 but no usable choices — raw body: ${bodyPreview}`);
          lastError = new Error(`Malformed response body: ${bodyPreview}`);
          if (attempt < PER_MODEL_MAX_ATTEMPTS) {
            const wait = Math.round(700 * 2 ** (attempt - 1) + Math.random() * 400);
            await sleep(wait);
            continue;
          }
          break;
        }

        console.log(`📥 [${model}] Raw response (first 300 chars):`, content.substring(0, 300));

        let cleanedContent = content.trim();
        if (cleanedContent.startsWith('```json')) {
          cleanedContent = cleanedContent.replace(/```json/g, '').replace(/```/g, '').trim();
        } else if (cleanedContent.startsWith('```')) {
          cleanedContent = cleanedContent.replace(/```/g, '').trim();
        }

        const questions = JSON.parse(cleanedContent);

        // I-normalize agad dito ang type ng bawat tanong — ito na yung
        // magiging pinal na klase na makikita ng buong app pababa (quiz
        // engine, sanitization, frontend rendering).
        const normalizedQuestions = questions.map((q) => ({
          ...q,
          type: normalizeQuestionType(q.type),
        }));

        console.log(`✅ [${model}] Parsed ${normalizedQuestions.length} questions`);
        return normalizedQuestions;

      } catch (error) {
        clearTimeout(timeoutId);
        lastError = error;
        // A thrown fetch (no response), our own timeout abort, or a bad
        // JSON.parse on the model's output all land here. Network-ish
        // errors get retried on the same model (if attempts remain);
        // anything else falls straight through to the outer loop, which
        // will try the next model in the chain instead of hammering this
        // one.
        if (isTransientNetworkError(error) && attempt < PER_MODEL_MAX_ATTEMPTS) {
          const wait = Math.round(700 * 2 ** (attempt - 1) + Math.random() * 400);
          console.warn(`⚠️ [${model}] network error — retrying in ${wait}ms: ${error.message}`);
          await sleep(wait);
          continue;
        }
        break;
      }
    }

    throw new Error(`[${model}] failed after ${PER_MODEL_MAX_ATTEMPTS} attempt(s): ${lastError?.message || 'unknown error'}`);
  }

  return {
    async generateQuestions(prompt) {
      let lastError;

      for (const model of MODEL_CHAIN) {
        try {
          return await attemptModel(model, prompt);
        } catch (error) {
          lastError = error;
          console.warn(`⚠️ Falling through to next model in chain: ${error.message}`);
        }
      }

      // Full technical detail goes to the server logs only — model slugs,
      // chain order, and the raw failure reason are useful for debugging
      // but should never reach the player's screen. select_type.jsx (and
      // wherever else) displays error.message directly in the UI, so the
      // thrown message here IS what the player sees, verbatim.
      console.error(
        `❌ NaraRouter service error — every model in the chain failed [${MODEL_CHAIN.join(', ')}]:`,
        lastError?.message
      );
      throw new Error('We couldn\'t generate quiz questions right now. Please try again in a moment.');
    },
  };
}

export { getGeminiService };