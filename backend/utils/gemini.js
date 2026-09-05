import { GoogleGenerativeAI } from '@google/generative-ai';

const CANDIDATE_MODELS = [
  process.env.GEMINI_MODEL || 'gemini-3.5-flash',
  'gemini-3.6-flash',
  'gemini-flash-latest',
];

/**
 * Generate answer using Gemini API based on retrieved context with automatic fallback
 * @param {string} context - Retrieved document context
 * @param {string} question - User question
 * @returns {Promise<string>} - AI-generated answer
 */
export async function generateAnswerWithGemini(context, question) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === 'your_key') {
    throw new Error(
      'GEMINI_API_KEY is not configured. Please set your valid Gemini API key in backend/.env'
    );
  }

  const genAI = new GoogleGenerativeAI(apiKey);

  const systemPrompt = `You are an expert AI assistant that provides clear, well-structured, and highly readable answers based strictly on the provided documents.

Guidelines:
- Answer directly and professionally using only facts from the context.
- Use clean Markdown formatting: short paragraphs, bold lead-ins for key terms, and bullet points where helpful.
- DO NOT write citation brackets like "[Document 1]", "[Document 2]", or "(Source: ...)" inside your answer. The UI automatically displays sources separately.
- Never repeat introductory phrases like "Based on the provided documents...". Jump straight to the answer.
- If the information is not in the documents, simply state: "I don't have enough information in the uploaded documents to answer this."`;

  const userMessage = `Context from documents:

${context}

User question: ${question}

Please provide a clean, direct, and well-structured answer.`;

  let lastError = null;

  for (const modelName of CANDIDATE_MODELS) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: userMessage }] }],
        systemInstruction: systemPrompt,
      });

      const response = await result.response;
      const rawText = response.text().trim();

      // Clean out distracting bracket citations and redundant source tags
      const cleanAnswer = rawText
        .replace(/\[(?:Document|Doc)\s*\d+(?:\s*,\s*(?:Document|Doc)?\s*\d+)*\]/gi, '')
        .replace(/\(?\s*(?:Source|Source\s*Document|Ref):\s*[^)\n]+\)?/gi, '')
        .replace(/[ \t]{2,}/g, ' ')
        .replace(/\n{3,}/g, '\n\n')
        .trim();

      return cleanAnswer;
    } catch (error) {
      console.warn(`⚠️ Model "${modelName}" failed (${error.message.slice(0, 80)}). Trying fallback...`);
      lastError = error;
    }
  }

  console.error('❌ All Gemini candidate models failed:', lastError?.message);
  throw new Error(`Gemini API error: ${lastError?.message}`);
}

/**
 * Generate 4-5 relevant suggested questions from document chunks using Gemini with automatic fallback
 * @param {string[]|string} chunks - Array of chunk strings or concatenated text
 * @returns {Promise<string[]>} - Array of 4-5 questions
 */
export async function generatePromptsFromDocument(chunks) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === 'your_key') {
    throw new Error(
      'GEMINI_API_KEY is not configured. Please set your valid Gemini API key in backend/.env'
    );
  }

  const chunksText = Array.isArray(chunks) ? chunks.join('\n\n') : String(chunks);
  const sampleText = chunksText.slice(0, 12000);

  const prompt = `Based on this document, generate 4-5 specific, natural questions a user might ask.

Document content:
${sampleText}

Requirements:
- Questions should be specific to the document content
- Each question should be answerable from the document
- Questions should cover different aspects/topics
- Keep questions natural and concise (under 10 words each)
- Format as JSON array: ["question1", "question2", ...]
- Return ONLY the JSON array, no other text

Generate the questions:`;

  const genAI = new GoogleGenerativeAI(apiKey);

  for (const modelName of CANDIDATE_MODELS) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          responseMimeType: 'application/json',
        },
      });

      const result = await model.generateContent(prompt);
      const responseText = (await result.response).text().trim();

      const cleanJson = responseText
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/```\s*$/, '')
        .trim();

      const parsed = JSON.parse(cleanJson);

      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed
          .filter((q) => typeof q === 'string' && q.trim().length > 0)
          .slice(0, 5);
      }
    } catch (err) {
      console.warn(`⚠️ Prompt generation failed on "${modelName}": ${err.message.slice(0, 80)}. Trying fallback...`);
    }
  }

  return ['What is this document about?'];
}

