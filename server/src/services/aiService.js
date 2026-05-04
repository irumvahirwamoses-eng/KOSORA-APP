const axios = require('axios');

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3';

const generateQuestions = async ({ content, questionCount = 10, questionTypes = ['multiple_choice'], difficulty = 'medium', subject }) => {
  try {
    const truncatedContent = content.slice(0, 12000);

    const prompt = `You are an expert teacher creating exam questions for Rwandan schools. Based on the following educational content, generate ${questionCount} ${questionTypes.join(' and ')} questions.

CONTENT:
${truncatedContent}

Generate questions at ${difficulty} difficulty level${subject ? ` for subject: ${subject}` : ''}.

Return ONLY a valid JSON array with this exact structure (no markdown, no explanation):
[
  {
    "questionText": "The question text here?",
    "type": "multiple_choice",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": "Option A",
    "marks": 1,
    "difficulty": "medium",
    "topic": "Topic name"
  }
]

For multiple_choice questions, include exactly 4 options (A, B, C, D) and the correctAnswer must match one of the options exactly.
For short_answer questions, options should be an empty array and correctAnswer should be the expected answer.
Rules:
- Do not repeat questions
- Questions should test understanding, not just recall
- Use clear, simple English
- For multiple choice, make wrong answers plausible
- Return ONLY the JSON array, nothing else`;

    const response = await axios.post(`${OLLAMA_URL}/api/generate`, {
      model: OLLAMA_MODEL,
      prompt,
      stream: false,
      options: {
        temperature: 0.7,
        num_predict: 4000
      }
    }, {
      timeout: 120000
    });

    let generatedText = response.data.response.trim();

    if (generatedText.startsWith('```')) {
      const jsonMatch = generatedText.match(/```(?:json)?\n?([\s\S]*?)```/);
      generatedText = jsonMatch ? jsonMatch[1].trim() : generatedText.replace(/```/g, '').trim();
    }

    const questions = JSON.parse(generatedText);

    if (!Array.isArray(questions)) {
      throw new Error('Invalid response format from AI');
    }

    return questions.map(q => ({
      questionText: q.questionText || q.question_text || '',
      type: q.type || 'multiple_choice',
      options: q.options || [],
      correctAnswer: q.correctAnswer || q.correct_answer || '',
      marks: q.marks || 1,
      topic: q.topic || '',
      difficulty: q.difficulty || difficulty
    }));
  } catch (err) {
    if (err.code === 'ECONNREFUSED') {
      throw new Error('Ollama service is not running. Make sure Ollama is installed and running on port 11434.');
    }
    if (err.response) {
      throw new Error(`AI generation failed: ${err.response.data?.error || err.message}`);
    }
    throw new Error(`Failed to parse AI response. Ensure Ollama is running and the model "${OLLAMA_MODEL}" is pulled.`);
  }
};

const generateShortAnswerQuestions = async ({ content, questionCount = 5, difficulty = 'medium', subject }) => {
  return generateQuestions({
    content,
    questionCount,
    questionTypes: ['short_answer'],
    difficulty,
    subject
  });
};

module.exports = { generateQuestions, generateShortAnswerQuestions };
