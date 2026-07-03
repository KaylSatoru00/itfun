// prompt.service.js
function buildPrompt({ lessonContent, quizType, questionCount = 15 }) {
  // Clean the lesson content to ensure it's properly formatted
  const cleanLessonContent = lessonContent.trim();

  const typeInstructions = {
    multiple: `Generate EXACTLY ${questionCount} multiple-choice questions.
      - Each question MUST have 4 options labeled A, B, C, D.
      - Only ONE option can be correct.
      - The other 3 options must be plausible wrong answers based on the lesson content.
      - Keep ALL questions BASIC and beginner-friendly — these are for 1st year students. NO trick questions, NO advanced application/analysis questions.`,

    'true-false': `Generate EXACTLY ${questionCount} true or false questions.
      - Each question MUST be a clear statement that is either true or false based on the lesson.
      - Avoid ambiguous statements.
      - Keep ALL questions BASIC and beginner-friendly — these are for 1st year students. NO trick questions.
      - About 50% should be true and 50% false.`,

    identification: `Generate EXACTLY ${questionCount} identification questions.
      - Each question MUST ask for a specific term, name, or concept from the lesson.
      - The answer MUST be SHORT: STRICTLY 1 to 3 words maximum. NEVER a full sentence or a long phrase.
      - AVOID using acronyms/abbreviations as the answer when the lesson uses (or a common, popular audience would recognize) a full spelled-out form — prefer the FULL term. Examples: "Central Processing Unit" over "CPU", "Universal Serial Bus" over "USB", "Random Access Memory" over "RAM".
      - ✅ SPECIAL EXEMPTION (Identification ONLY): if a term has BOTH a common acronym AND a common full spelled-out form (e.g. CPU / Central Processing Unit, USB / Universal Serial Bus, RAM / Random Access Memory), you MAY write the correctAnswer as "ACRONYM / Full Spelled-Out Form" (e.g. "CPU / Central Processing Unit") so that EITHER form counts as correct. This is the ONLY case where combining terms with "/" is allowed for Identification. Only use this format for genuine acronym+full-form pairs of the SAME single term — never use "/" to join two different/unrelated valid answers.
      - NEVER ask a question with multiple possible valid answers (e.g. avoid "Give one example of X" when the lesson lists several examples of X). Only ask questions where exactly ONE answer is correct.
      - Other than the acronym/full-form exemption above, the answer must be a SINGLE term — NEVER combine multiple different valid names/terms into one answer using "/", "or", "and", or similar (e.g. "Memory/Storage Unit" is WRONG because it's really two different valid answers joined together — pick only ONE of them and phrase the question so that one specific term is clearly correct).
      - Keep ALL questions BASIC and beginner-friendly — these are for 1st year students. Ask for simple, directly-stated terms/names/concepts from the lesson. NO trick questions, NO advanced application/analysis questions.`,

    'fill-in-blank': `Generate EXACTLY ${questionCount} fill-in-the-blank questions.
      - Each question MUST have a blank represented by "_____" that tests a key concept.
      - The answer MUST be EXACTLY 1 word. NEVER a phrase, NEVER multiple words, NEVER a full sentence.
      - AVOID using acronyms/abbreviations as the answer when the lesson uses (or a common, popular audience would recognize) a full spelled-out form — write out the FULL term instead. Examples: use "Central Processing Unit" NOT "CPU", "Universal Serial Bus" NOT "USB", "Random Access Memory" NOT "RAM". Only use an acronym as the answer if the lesson never spells out the full term, or if the acronym itself IS the commonly-known name (e.g. no need to expand something with no common full form in casual use). NOTE: if the correct full term would require more than 1 word, prefer phrasing the question so the answer is naturally just 1 word (e.g. ask for a single-word term from the lesson) rather than forcing a multi-word full form into this type.
      - NEVER ask a question with multiple possible valid answers (e.g. avoid "One example of an output device is _____" when the lesson lists several output devices). Only ask questions where exactly ONE answer is correct.
      - Keep ALL questions BASIC and beginner-friendly — these are for 1st year students. NO trick questions, NO advanced application/analysis questions.`,

    mixed: `Generate EXACTLY ${questionCount} questions combining different types:
      - ${Math.floor(questionCount * 0.4)} multiple-choice questions
      - ${Math.floor(questionCount * 0.2)} true-false questions
      - ${Math.floor(questionCount * 0.2)} identification questions (answer STRICTLY 1-3 words)
      - ${Math.ceil(questionCount * 0.2)} fill-in-the-blank questions (answer STRICTLY exactly 1 word)
      - Keep ALL questions BASIC and beginner-friendly — these are for 1st year students. NO trick questions, NO advanced application/analysis questions.
      - Distribute questions to cover different topics from the lesson.`
  };

  const formatInstructions = {
    multiple: `Each question MUST follow this EXACT format:
      {
        "question": "Clear, basic question text based on the lesson",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "correctAnswer": "Option A", // Must exactly match one of the options
        "type": "multiple"
      }`,

    'true-false': `Each question MUST follow this EXACT format:
      {
        "question": "Clear, basic statement based on the lesson",
        "correctAnswer": "True", // or "False" - must be exactly these words
        "type": "true-false"
      }`,

    identification: `Each question MUST follow this EXACT format:
      {
        "question": "Clear, basic question asking for a specific term/concept",
        "correctAnswer": "1 to 3 words ONLY, written in FULL (not an acronym) when a common full form exists. EXCEPTION: if the term has both a common acronym AND full form, you may write it as 'ACRONYM / Full Form' (e.g. 'CPU / Central Processing Unit') so either is accepted.",
        "type": "identification"
      }`,

    'fill-in-blank': `Each question MUST follow this EXACT format:
      {
        "question": "Basic question with a blank represented by _____ that tests a key concept",
        "correctAnswer": "EXACTLY 1 word that fills the blank, written in FULL (not an acronym) when a common full form exists",
        "type": "fill-in-blank"
      }`,

    mixed: `Each question MUST follow the appropriate format based on its type:
      - For multiple-choice: include "options" array with 4 choices
      - For true-false: include "correctAnswer": "True" or "False"
      - For identification: include "correctAnswer" as 1-3 words ONLY
      - For fill-in-blank: include "question" with a blank (_____) and "correctAnswer" as EXACTLY 1 word
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
7. ALL questions must be BASIC and beginner-level. These questions are for 1ST YEAR / beginner students who are just learning the topic for the first time.
   - Stick to direct recall and simple understanding of facts, definitions, and terms explicitly stated in the lesson.
   - DO NOT create "hard" or advanced questions that require deep analysis, multi-step reasoning, or connecting multiple distant concepts.
   - DO NOT create trick questions, ambiguous wording, or overly technical phrasing beyond what the lesson itself uses.
   - It is OK for questions to vary slightly in simple vs. slightly-less-simple recall, but NONE should be genuinely difficult or advanced.
8. NEVER write a question that has more than one possible valid answer. Since answers are graded by exact match, avoid phrasing like "Give ONE example of X", "Name AN example of X", or "What is A type of X" whenever the lesson lists multiple valid examples/types (e.g., if the lesson lists Word, Excel, and PowerPoint as application software, do NOT ask "Give one example of application software" — instead ask something with exactly one correct answer, like "What type of software helps users perform tasks like word processing?" with answer "Application software"). Every question's correct answer must be the ONLY correct answer the lesson supports. For the SAME reason, NEVER combine multiple valid terms into a single answer using "/", "or", "and" (e.g. "Memory/Storage Unit" is WRONG — it silently packs two different valid answers into one string). Every correctAnswer must be ONE single term.
9. STRICT ANSWER LENGTH LIMITS (applies to ALL quiz types, including "mixed"):
   - Identification: correctAnswer MUST be 1 to 3 words. NEVER more.
   - Fill-in-the-blank: correctAnswer MUST be EXACTLY 1 word. NEVER more.

📚 LESSON CONTENT (USE ONLY THIS):
${cleanLessonContent}

🎯 QUIZ TYPE: ${quizType.toUpperCase()}
${typeInstructions[quizType] || typeInstructions.multiple}

📝 FORMAT REQUIREMENTS:
${formatInstructions[quizType] || formatInstructions.multiple}

📋 ADDITIONAL GUIDELINES:
- For multiple-choice questions: Create 4 distinct options. The correct answer must be clearly correct. Wrong answers should be plausible but incorrect based on the lesson.
- For true-false questions: Make statements that are clearly true or false. Avoid trick questions or statements that are partially true.
- For identification questions: Ask for specific terms, names, dates, or concepts. The answer must be unambiguous, STRICTLY 1-3 words, and written in FULL rather than as an acronym/abbreviation when a common full form exists (e.g. "Central Processing Unit" not "CPU").
- For fill-in-the-blank: Place the blank at a key term or concept. The answer must be unambiguous, STRICTLY EXACTLY 1 word, and written in FULL rather than as an acronym/abbreviation when a common full form exists (e.g. "Mouse" not an acronym). The blank should test knowledge, not grammar.
- For mixed type: Distribute questions across all topics in the lesson. Ensure variety, but keep every question basic regardless of type.
- Remember at all times: the target audience is 1st year / beginner students. Simplicity and clarity always come first.

🚫 WHAT NOT TO DO:
- DO NOT add extra text, explanations, or commentary.
- DO NOT use markdown, code fences, or any formatting.
- DO NOT include questions about topics not covered in the lesson.
- DO NOT generate less than ${questionCount} questions or more than ${questionCount} questions.
- DO NOT include example questions - generate actual questions from the lesson.
- DO NOT create advanced, tricky, or multi-concept questions — keep everything basic and beginner-level.
- DO NOT let identification answers exceed 3 words.
- DO NOT let fill-in-the-blank answers be more than 1 word.

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

Generate ${questionCount} questions now. Remember: ONLY from the lesson content above, and keep every question BASIC and beginner-friendly for 1st year students.`;
}

export { buildPrompt };