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
      - The answer MUST be a short, exact term or name — NOT a full sentence.
      - AVOID using acronyms/abbreviations as the answer when the lesson uses (or a common, popular audience would recognize) a full spelled-out form — write out the FULL term instead. Examples: use "Central Processing Unit" NOT "CPU", "Universal Serial Bus" NOT "USB", "Random Access Memory" NOT "RAM". Only use an acronym as the answer if the lesson never spells out the full term, or if the acronym itself IS the commonly-known name (e.g. no need to expand something with no common full form in casual use).
      - NEVER ask a question with multiple possible valid answers (e.g. avoid "Give one example of X" when the lesson lists several examples of X). Only ask questions where exactly ONE answer is correct.
      - The answer must be a SINGLE term — NEVER combine multiple valid names/terms into one answer using "/", "or", "and", or similar (e.g. "Memory/Storage Unit" is WRONG because it's really two different valid answers joined together — pick only ONE of them and phrase the question so that one specific term is clearly correct).
      - Include a mix of easy, medium, and hard difficulty questions.`,

    'fill-in-blank': `Generate EXACTLY ${questionCount} fill-in-the-blank questions.
      - Each question MUST have a blank represented by "_____" that tests a key concept.
      - The answer MUST be a short, exact term or name — NOT a full sentence.
      - AVOID using acronyms/abbreviations as the answer when the lesson uses (or a common, popular audience would recognize) a full spelled-out form — write out the FULL term instead. Examples: use "Central Processing Unit" NOT "CPU", "Universal Serial Bus" NOT "USB", "Random Access Memory" NOT "RAM". Only use an acronym as the answer if the lesson never spells out the full term, or if the acronym itself IS the commonly-known name (e.g. no need to expand something with no common full form in casual use).
      - NEVER ask a question with multiple possible valid answers (e.g. avoid "One example of an output device is _____" when the lesson lists several output devices). Only ask questions where exactly ONE answer is correct.
      - The answer must be a SINGLE term — NEVER combine multiple valid names/terms into one answer using "/", "or", "and", or similar (e.g. "Memory/Storage Unit" is WRONG because it's really two different valid answers joined together — pick only ONE of them and phrase the question so that one specific term is clearly correct).
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
        "correctAnswer": "Exact term from the lesson, written in FULL (not an acronym) when a common full form exists",
        "type": "identification"
      }`,

    'fill-in-blank': `Each question MUST follow this EXACT format:
      {
        "question": "Question with a blank represented by _____ that tests a key concept",
        "correctAnswer": "The word/phrase that fills the blank, written in FULL (not an acronym) when a common full form exists",
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
9. NEVER write a question that has more than one possible valid answer. Since answers are graded by exact match, avoid phrasing like "Give ONE example of X", "Name AN example of X", or "What is A type of X" whenever the lesson lists multiple valid examples/types (e.g., if the lesson lists Word, Excel, and PowerPoint as application software, do NOT ask "Give one example of application software" — instead ask something with exactly one correct answer, like "What type of software helps users perform tasks like word processing?" with answer "Application software"). Every question's correct answer must be the ONLY correct answer the lesson supports. For the SAME reason, NEVER combine multiple valid terms into a single answer using "/", "or", "and" (e.g. "Memory/Storage Unit" is WRONG — it silently packs two different valid answers into one string). Every correctAnswer must be ONE single term.

📚 LESSON CONTENT (USE ONLY THIS):
${cleanLessonContent}

🎯 QUIZ TYPE: ${quizType.toUpperCase()}
${typeInstructions[quizType] || typeInstructions.multiple}

📝 FORMAT REQUIREMENTS:
${formatInstructions[quizType] || formatInstructions.multiple}

📋 ADDITIONAL GUIDELINES:
- For multiple-choice questions: Create 4 distinct options. The correct answer must be clearly correct. Wrong answers should be plausible but incorrect based on the lesson.
- For true-false questions: Make statements that are clearly true or false. Avoid trick questions or statements that are partially true.
- For identification questions: Ask for specific terms, names, dates, or concepts. The answer must be unambiguous, and written in FULL rather than as an acronym/abbreviation when a common full form exists (e.g. "Central Processing Unit" not "CPU").
- For fill-in-the-blank: Place the blank at a key term or concept. The answer must be unambiguous, and written in FULL rather than as an acronym/abbreviation when a common full form exists (e.g. "Universal Serial Bus" not "USB"). The blank should test knowledge, not grammar.
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