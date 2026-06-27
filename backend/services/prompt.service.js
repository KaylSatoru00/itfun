// prompt.service.js
function buildPrompt({ lessonContent, quizType, questionCount = 15 }) {
  // Clean the lesson content to ensure it's properly formatted
  const cleanLessonContent = lessonContent.trim();
  
  const typeInstructions = {
    multiple: `Generate EXACTLY ${questionCount} multiple-choice questions.
      - Each question MUST have 4 options labeled A, B, C, D.
      - Only ONE option can be correct.
      - The other 3 options must be plausible wrong answers based on the lesson content.
      - Include a mix of easy, medium, and hard difficulty questions.`,

    'true-false': `Generate EXACTLY ${questionCount} true or false questions.
      - Each question MUST be a clear statement that is either true or false based on the lesson.
      - Avoid ambiguous statements.
      - Include a mix of easy, medium, and hard difficulty questions.
      - About 50% should be true and 50% false.`,

    identification: `Generate EXACTLY ${questionCount} identification questions.
      - Each question MUST ask for a specific term, name, or concept from the lesson.
      - The answer should be a short word or phrase (1-5 words).
      - Include a mix of easy, medium, and hard difficulty questions.`,

    'fill-in-blank': `Generate EXACTLY ${questionCount} fill-in-the-blank questions.
      - Each question MUST have a blank represented by "_____" that tests a key concept.
      - The answer should be a single word or short phrase (1-3 words).
      - Include a mix of easy, medium, and hard difficulty questions.`,

    mixed: `Generate EXACTLY ${questionCount} questions combining different types:
      - ${Math.floor(questionCount * 0.4)} multiple-choice questions
      - ${Math.floor(questionCount * 0.2)} true-false questions
      - ${Math.floor(questionCount * 0.2)} identification questions
      - ${Math.ceil(questionCount * 0.2)} fill-in-the-blank questions
      - Include a mix of easy, medium, and hard difficulty questions.
      - Distribute questions to cover different topics from the lesson.`
  };

  const formatInstructions = {
    multiple: `Each question MUST follow this EXACT format:
      {
        "question": "Clear question text based on the lesson",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "correctAnswer": "Option A", // Must exactly match one of the options
        "type": "multiple"
      }`,

    'true-false': `Each question MUST follow this EXACT format:
      {
        "question": "Clear statement based on the lesson",
        "correctAnswer": "True", // or "False" - must be exactly these words
        "type": "true-false"
      }`,

    identification: `Each question MUST follow this EXACT format:
      {
        "question": "Clear question asking for a specific term/concept",
        "correctAnswer": "Short answer from the lesson",
        "type": "identification"
      }`,

    'fill-in-blank': `Each question MUST follow this EXACT format:
      {
        "question": "Question with a blank represented by _____ that tests a key concept",
        "correctAnswer": "The word/phrase that fills the blank",
        "type": "fill-in-blank"
      }`,

    mixed: `Each question MUST follow the appropriate format based on its type:
      - For multiple-choice: include "options" array with 4 choices
      - For true-false: include "correctAnswer": "True" or "False"
      - For identification: include "correctAnswer" as a short phrase
      - For fill-in-blank: include "question" with a blank (_____) and a short "correctAnswer"
      - All questions must have "type" field`
  };

  return `You are a strict educational quiz generator. Your task is to create a quiz based ONLY on the provided lesson content.

⚠️ CRITICAL RULES ⚠️
1. Generate EXACTLY ${questionCount} questions. Never generate fewer or more.
2. ONLY use information from the lesson content provided below.
3. NEVER invent facts, concepts, or examples not explicitly stated in the lesson.
4. NEVER use outside knowledge or prior training data.
5. NEVER repeat the same question.
6. Questions MUST test different concepts from the lesson.
7. Include a NATURAL mix of easy, medium, and hard questions:
   - Easy: Direct recall of facts (e.g., "What is X?")
   - Medium: Understanding concepts (e.g., "Which statement about X is correct?")
   - Hard: Applying or connecting concepts (e.g., "What is the relationship between X and Y?")
8. DO NOT make all questions too easy or too difficult.

📚 LESSON CONTENT (USE ONLY THIS):
${cleanLessonContent}

🎯 QUIZ TYPE: ${quizType.toUpperCase()}
${typeInstructions[quizType] || typeInstructions.multiple}

📝 FORMAT REQUIREMENTS:
${formatInstructions[quizType] || formatInstructions.multiple}

📋 ADDITIONAL GUIDELINES:
- For multiple-choice questions: Create 4 distinct options. The correct answer must be clearly correct. Wrong answers should be plausible but incorrect based on the lesson.
- For true-false questions: Make statements that are clearly true or false. Avoid trick questions or statements that are partially true.
- For identification questions: Ask for specific terms, names, dates, or concepts. The answer should be unambiguous.
- For fill-in-the-blank: Place the blank at a key term or concept. The blank should test knowledge, not grammar.
- For mixed type: Distribute questions across all topics in the lesson. Ensure variety.

🚫 WHAT NOT TO DO:
- DO NOT add extra text, explanations, or commentary.
- DO NOT use markdown, code fences, or any formatting.
- DO NOT include questions about topics not covered in the lesson.
- DO NOT generate less than ${questionCount} questions or more than ${questionCount} questions.
- DO NOT include example questions - generate actual questions from the lesson.

✅ OUTPUT FORMAT:
Return ONLY valid JSON. The response must be a JSON array with exactly ${questionCount} objects.
No markdown. No explanations. No code fences. No extra text.

Example:
[
  {
    "question": "What is the binary number system?",
    "options": ["Base 2", "Base 8", "Base 10", "Base 16"],
    "correctAnswer": "Base 2",
    "type": "multiple"
  }
]

Generate ${questionCount} questions now. Remember: ONLY from the lesson content above.`;
}

export { buildPrompt };