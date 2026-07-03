// backend/services/gemini.service.js

// Hindi laging sinusunod ng LLM (Groq) nang eksakto yung type string na
// hiniling natin sa prompt.service.js (hal. "fill-in-blank"). Minsan
// nagbabalik ito ng "Fill in the Blank", "fillInBlank", "FILL_IN_BLANK",
// atbp. — magkaparehong klase ng tanong pero magkaibang casing/format.
// Kung hindi ito ma-normalize dito sa source, palagi itong magiging
// case-sensitive na === comparison ang masisira sa buong app (quiz.engine.js
// hindi makikita yung 'fill-in-blank' kaya hindi gagana yung correctAnswer
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

function getGeminiService() {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set in your .env file.');
  }

  console.log('✅ Groq API key loaded, length:', apiKey.length);

  return {
    async generateQuestions(prompt) {
      try {
        console.log('📤 Sending prompt to Groq...');

        const response = await fetch(
          'https://api.groq.com/openai/v1/chat/completions',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              model: 'llama-3.3-70b-versatile',
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
        console.error('❌ Groq service error:', error.message);
        throw new Error(`Groq failed: ${error.message}`);
      }
    },
  };
}

export { getGeminiService };