const axios = require('axios');

const AI_PROVIDER = process.env.AI_PROVIDER || 'groq';
const AI_API_KEY = process.env.AI_API_KEY || '';
const AI_MODEL = process.env.AI_MODEL || 'llama-3.1-8b-instant';
const AI_URL = process.env.AI_URL || 'https://api.groq.com/openai/v1/chat/completions';

const extractJsonFromResponse = (text) => {
  let cleaned = text.trim();

  const codeBlockMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    cleaned = codeBlockMatch[1].trim();
  }

  const jsonMatch = cleaned.match(/\[[\s\S]*\]/);
  if (jsonMatch) {
    cleaned = jsonMatch[0];
  }

  cleaned = cleaned.replace(/\n/g, ' ');

  return JSON.parse(cleaned);
};

const generateQuestions = async ({ content, questionCount = 10, questionTypes = ['multiple_choice'], difficulty = 'medium', subject }) => {
  try {
    if (!content || content.trim().length < 50) {
      throw new Error('Material content is too short or empty. Upload materials with more text content first.');
    }

    const truncatedContent = content.slice(0, 5000);

    const prompt = `You are an expert teacher creating exam questions for Rwandan schools. Based on the following educational content, generate exactly ${questionCount} ${questionTypes.join(' and ')} questions.

CONTENT:
${truncatedContent}

Generate questions at ${difficulty} difficulty level${subject ? ` for subject: ${subject}` : ''}.

Return ONLY a valid JSON array with this exact structure, no markdown formatting, no backticks, no explanation:
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

For multiple_choice questions, include exactly 4 options and the correctAnswer must match one of the options exactly.
For short_answer questions, options should be an empty array and correctAnswer should be the expected answer text.
Rules:
- Do not repeat questions
- Questions should test understanding, not just recall
- Use clear, simple English
- For multiple choice, make wrong answers plausible
- Return ONLY the JSON array, nothing else, no markdown, no backticks`;

    if (AI_PROVIDER === 'groq') {
      if (!AI_API_KEY) {
        throw new Error('AI_API_KEY is not set. Get a free key at https://console.groq.com and add it to .env');
      }

      console.log('Groq AI: Sending request with model:', AI_MODEL);
      console.log('Groq AI: Content length:', truncatedContent.length, 'chars');

      const response = await axios.post(AI_URL, {
        model: AI_MODEL,
        messages: [
          { role: 'system', content: 'You are an expert teacher. Return ONLY a raw JSON array, no markdown, no backticks, no explanation.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 2000,
        response_format: { type: 'json_object' }
      }, {
        headers: {
          'Authorization': `Bearer ${AI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 120000
      });

      console.log('Groq AI: Response received, tokens used:', response.data.usage?.total_tokens);

      let rawText = response.data.choices[0].message.content.trim();
      console.log('Groq AI: Raw response length:', rawText.length);

      const questions = extractJsonFromResponse(rawText);

      if (!Array.isArray(questions) || questions.length === 0) {
        throw new Error('AI returned invalid format: expected a JSON array of questions');
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
    } else {
      const response = await axios.post(`${AI_URL}/api/generate`, {
        model: AI_MODEL,
        prompt,
        stream: false,
        options: {
          temperature: 0.7,
          num_predict: 4000
        }
      }, {
        timeout: 120000
      });

      const questions = extractJsonFromResponse(response.data.response.trim());

      if (!Array.isArray(questions) || questions.length === 0) {
        throw new Error('AI returned invalid format');
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
    }
  } catch (err) {
    if (err.response) {
      const status = err.response.status;
      const body = err.response.data;
      console.error('Groq API error:', status, JSON.stringify(body));
      if (status === 401) throw new Error('Invalid Groq API key. Check your .env file.');
      if (status === 429) throw new Error('Groq rate limit exceeded. Wait a moment and try again.');
      if (status === 400) throw new Error(`Groq bad request: ${body?.error?.message || 'Invalid request'}`);
      throw new Error(`AI service error: ${body?.error?.message || err.message}`);
    }
    throw new Error(`AI generation failed: ${err.message}`);
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
