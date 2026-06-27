// backend/services/ai.service.js
import { getGeminiService } from './gemini.service.js';
import { buildPrompt } from './prompt.service.js';

async function generateQuiz({ lessonContent, quizType, questionCount = 15 }) {
  console.log(`📝 Generating ${questionCount} questions using Gemini...`);

  const prompt = buildPrompt({
    lessonContent,
    quizType,
    questionCount,
  });

  const service = getGeminiService();
  return await service.generateQuestions(prompt);
}

export { generateQuiz };