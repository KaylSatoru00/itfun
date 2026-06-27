// backend/services/gemini.service.js
import { GoogleGenAI } from '@google/genai';

function getGeminiService() {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set in your .env file.');
  }

  console.log('✅ Gemini API key loaded, length:', apiKey.length);

  const ai = new GoogleGenAI({ apiKey });

  return {
    async generateQuestions(prompt) {
      try {
        console.log('📤 Sending prompt to Gemini...');

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
        });

        const text = response.text;
        console.log('📥 Raw Gemini response (first 300 chars):', text.substring(0, 300));

        let cleanedContent = text.trim();
        if (cleanedContent.startsWith('```json')) {
          cleanedContent = cleanedContent.replace(/```json/g, '').replace(/```/g, '').trim();
        } else if (cleanedContent.startsWith('```')) {
          cleanedContent = cleanedContent.replace(/```/g, '').trim();
        }

        const questions = JSON.parse(cleanedContent);
        console.log(`✅ Parsed ${questions.length} questions from Gemini`);
        return questions;

      } catch (error) {
        console.error('❌ Gemini service error:', error.message);
        throw new Error(`Gemini failed: ${error.message}`);
      }
    },
  };
}

export { getGeminiService };