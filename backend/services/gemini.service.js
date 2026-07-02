// backend/services/gemini.service.js

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
        console.log(`✅ Parsed ${questions.length} questions`);
        return questions;

      } catch (error) {
        console.error('❌ Groq service error:', error.message);
        throw new Error(`Groq failed: ${error.message}`);
      }
    },
  };
}

export { getGeminiService };