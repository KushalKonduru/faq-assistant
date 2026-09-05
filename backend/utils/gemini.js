import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Generate answer using Gemini API based on retrieved context
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

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL || 'gemini-3.6-flash',
    });

    const systemPrompt = `You are a helpful assistant that answers questions based on provided documents.
- Answer only based on the provided context
- If the answer is not in the context, say "I don't have this information in the documents"
- Be clear and concise
- Cite the document when relevant`;

    const userMessage = `Context from documents:

${context}

User question: ${question}

Please answer based only on the provided context.`;

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: userMessage }] }],
      systemInstruction: systemPrompt,
    });

    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('❌ Gemini API Error:', error.message);
    throw new Error(`Gemini API error: ${error.message}`);
  }
}
