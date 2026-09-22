import { GoogleGenerativeAI } from '@google/generative-ai';

const CANDIDATE_MODELS = [
  process.env.GEMINI_MODEL,
  'gemini-3.5-flash-lite',
  'gemini-3.1-flash-lite',
  'gemini-flash-lite-latest',
  'gemini-3.6-flash',
  'gemini-3.5-flash',
  'gemini-flash-latest',
].filter(Boolean);

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
- If the information is not in the documents, simply state: "I don't have enough information in the uploaded documents to answer this."
- At the very end of your response, provide 2 to 3 natural, relevant follow-up questions that the user might want to explore next based on the document context.
Format the follow-up questions strictly at the end of your response as:
---FOLLOW_UP_QUESTIONS---
["Follow-up question 1?", "Follow-up question 2?", "Follow-up question 3?"]`;

  const userMessage = `Context from documents:

${context}

User question: ${question}

Please provide a clean, direct, and well-structured answer followed by the follow-up questions.`;

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

      // Extract follow-up questions if present
      let followUpQuestions = [];
      let answerBody = rawText;
      const delimiter = '---FOLLOW_UP_QUESTIONS---';

      if (rawText.includes(delimiter)) {
        const parts = rawText.split(delimiter);
        answerBody = parts[0].trim();
        const followUpRaw = parts.slice(1).join(delimiter).trim();
        try {
          const jsonMatch = followUpRaw.match(/\[[\s\S]*?\]/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            if (Array.isArray(parsed)) {
              followUpQuestions = parsed
                .filter((q) => typeof q === 'string' && q.trim().length > 0)
                .map((q) => q.trim());
            }
          }
        } catch {
          const lines = followUpRaw
            .split('\n')
            .map((l) => l.replace(/^[#*•\-\d\."\s]+/, '').replace(/["\]]+$/, '').trim());
          followUpQuestions = lines.filter((l) => l.endsWith('?') && l.length >= 10);
        }
      }

      // Clean out distracting bracket citations and redundant source tags
      const cleanAnswer = answerBody
        .replace(/\[(?:Document|Doc)\s*\d+(?:\s*,\s*(?:Document|Doc)?\s*\d+)*\]/gi, '')
        .replace(/\(?\s*(?:Source|Source\s*Document|Ref):\s*[^)\n]+\)?/gi, '')
        .replace(/[ \t]{2,}/g, ' ')
        .replace(/\n{3,}/g, '\n\n')
        .trim();

      return {
        answer: cleanAnswer,
        followUpQuestions,
      };
    } catch (error) {
      console.warn(`⚠️ Model "${modelName}" failed (${error.message.slice(0, 80)}). Trying fallback...`);
      lastError = error;
    }
  }

  console.error('❌ All Gemini candidate models failed:', lastError?.message);
  throw new Error(`Gemini API error: ${lastError?.message}`);
}

/**
 * Fallback heuristic to extract specific questions from document chunks if LLM fails
 * @param {string} text - Raw concatenated text from chunks
 * @returns {string[]} - Array of 5-6 document-specific questions
 */
function extractQuestionsFromChunkText(text) {
  const lines = text
    .split('\n')
    .map((l) => l.replace(/^[#*•\-\d\.]+\s*/, '').trim())
    .filter((l) => l.length >= 10 && l.length <= 90 && !l.includes('http') && !l.includes('{') && !l.includes('}'));

  const questions = [];
  for (const line of lines) {
    if (line.endsWith('?')) {
      questions.push(line);
    } else if (/^[A-Z][a-zA-Z0-9\s,\-_]+$/.test(line)) {
      questions.push(`What does the document explain about ${line.toLowerCase().trim()}?`);
    }
    if (questions.length >= 6) break;
  }

  return questions.slice(0, 6);
}

/**
 * Generate 5-6 relevant suggested questions from document chunks using Gemini with automatic fallback
 * @param {string[]|string} chunks - Array of chunk strings or concatenated text
 * @returns {Promise<string[]>} - Array of 5-6 questions derived from document chunks
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

  const prompt = `You are analyzing the following document excerpts.
Generate 5 to 6 specific, natural questions that directly explore the content in these excerpts so a user can ask them in an AI assistant chat.

Document excerpts:
${sampleText}

Guidelines:
- Produce 5 to 6 questions.
- Every question MUST be specific to the concepts, terminology, workflows, tools, or rules described in the excerpts.
- DO NOT produce generic starter questions like "What is this document about?", "Can you summarize?", or "What are the key findings?".
- Each question must be answerable using facts from the excerpts.
- Format strictly as a JSON array of strings:
["Specific question 1?", "Specific question 2?", "Specific question 3?", "Specific question 4?", "Specific question 5?", "Specific question 6?"]
- Return ONLY the JSON array, no other text or code blocks.`;

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

      let parsed = JSON.parse(cleanJson);
      if (!Array.isArray(parsed) && parsed && typeof parsed === 'object') {
        parsed = parsed.questions || parsed.prompts || Object.values(parsed);
      }

      if (Array.isArray(parsed)) {
        const questions = parsed
          .map((item) => {
            if (typeof item === 'string') return item.trim();
            if (item && typeof item === 'object') {
              return (item.question || item.text || item.prompt || item.q || '').trim();
            }
            return '';
          })
          .map((q) => q.replace(/^\d+[\.\)]\s*/, '').trim())
          .filter((q) => q.length > 8 && (q.endsWith('?') || q.length > 15));

        if (questions.length >= 3) {
          return questions.slice(0, 6);
        }
      }
    } catch (err) {
      console.warn(`⚠️ Prompt generation failed on "${modelName}": ${err.message.slice(0, 80)}. Trying fallback...`);
    }
  }

  // Fallback: extract specific questions from the actual chunk text instead of preset dummy questions
  console.warn('⚠️ Falling back to chunk-based question extraction.');
  const chunkDerivedQuestions = extractQuestionsFromChunkText(sampleText);
  if (chunkDerivedQuestions.length > 0) {
    return chunkDerivedQuestions;
  }

  return [];
}


