// backend/services/gemini.service.js

// Hindi laging sinusunod ng LLM (ngayon: NaraRouter/mistral-large) nang
// eksakto yung type string na hiniling natin sa prompt.service.js (hal.
// "fill-in-blank"). Minsan nagbabalik ito ng "Fill in the Blank",
// "fillInBlank", "FILL_IN_BLANK", atbp. — magkaparehong klase ng tanong
// pero magkaibang casing/format. Kung hindi ito ma-normalize dito sa
// source, palagi itong magiging case-sensitive na === comparison ang
// masisira sa buong app (quiz.engine.js hindi makikita yung
// 'fill-in-blank' kaya hindi gagana yung correctAnswer hiding/blankPattern,
// at sa quiz_arena.jsx hindi lalabas yung reveal UI).
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

  return {
    async generateQuestions(prompt) {
      // Retry transient failures (the "model service temporarily unavailable"
      // 500s) with exponential backoff + jitter, so a brief upstream blip
      // doesn't fail the whole generation. Non-transient errors (bad JSON,
      // auth) fail fast — retrying them just wastes tokens.
      const MAX_ATTEMPTS = 4;
      let lastError;

      for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        try {
          console.log(`📤 Sending prompt to NaraRouter (attempt ${attempt}/${MAX_ATTEMPTS})...`);

          const response = await fetch(
            'https://router.bynara.id/v1/chat/completions',
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
              },
              body: JSON.stringify({
                model: 'deepseek-v4-flash-free',
                messages: [
                  { role: 'user', content: prompt }
                ],
                temperature: 0.7,
                max_tokens: 8192,
              }),
            }
          );

          const data = await response.json();

          if (!response.ok) {
            if (isTransient(response.status, data) && attempt < MAX_ATTEMPTS) {
              const wait = Math.round(700 * 2 ** (attempt - 1) + Math.random() * 400);
              console.warn(`⚠️ NaraRouter transient error ${response.status} — retrying in ${wait}ms`);
              lastError = new Error(JSON.stringify(data));
              await sleep(wait);
              continue;
            }
            throw new Error(JSON.stringify(data));
          }

          const text = data.choices[0].message.content;
          console.log('📥 Raw response (first 300 chars):', text.substring(0, 300));

          let cleanedContent = text.trim();
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

          console.log(`✅ Parsed ${normalizedQuestions.length} questions`);
          return normalizedQuestions;

        } catch (error) {
          lastError = error;
          // A thrown fetch (no response) can also be a transient blip — retry.
          if (isTransientNetworkError(error) && attempt < MAX_ATTEMPTS) {
            const wait = Math.round(700 * 2 ** (attempt - 1) + Math.random() * 400);
            console.warn(`⚠️ NaraRouter network error — retrying in ${wait}ms: ${error.message}`);
            await sleep(wait);
            continue;
          }
          // Non-transient (bad JSON, auth, etc.) or out of attempts → give up.
          break;
        }
      }

      console.error('❌ NaraRouter service error:', lastError?.message);
      throw new Error(`NaraRouter failed: ${lastError?.message}`);
    },
  };
}

export { getGeminiService };