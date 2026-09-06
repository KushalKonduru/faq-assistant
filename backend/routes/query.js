import express from 'express';
import { createClient } from '@supabase/supabase-js';
import { generateEmbedding } from '../utils/embedding.js';
import { generateAnswerWithGemini } from '../utils/gemini.js';

const router = express.Router();

/**
 * Helper to get initialized Supabase client
 */
function getSupabaseClient() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_KEY;

  if (
    !supabaseUrl ||
    !supabaseKey ||
    supabaseUrl.includes('your-project') ||
    supabaseKey === 'your_anon_public_key'
  ) {
    throw new Error(
      'Supabase credentials are not configured. Please set SUPABASE_URL and SUPABASE_KEY in backend/.env'
    );
  }

  return createClient(supabaseUrl, supabaseKey);
}

/**
 * POST /api/query
 * Answer a question using RAG
 */
router.post('/', async (req, res, next) => {
  try {
    const { question } = req.body;

    // Validate question
    if (!question || typeof question !== 'string' || question.trim().length === 0) {
      return res.status(400).json({ error: 'Question is required and cannot be empty' });
    }

    const sessionId = req.headers['x-session-id'] || req.body.session_id || null;
    const cleanQuestion = question.trim();
    console.log(`🔍 Received user query: "${cleanQuestion}" (Session: ${sessionId?.slice(0, 12)}...)`);

    // Step 1: Generate embedding for question
    console.log('⚡ Generating vector embedding for query...');
    const questionEmbedding = await generateEmbedding(cleanQuestion);

    // Step 2: Retrieve similar document chunks from Supabase
    console.log('🔎 Querying Supabase match_documents function...');
    const supabase = getSupabaseClient();

    const matchThreshold =
      req.body.match_threshold !== undefined ? req.body.match_threshold : 0.3;
    const matchCount = req.body.match_count || 5;

    const { data: results, error: queryError } = await supabase.rpc(
      'match_documents',
      {
        query_embedding: questionEmbedding,
        match_threshold: matchThreshold,
        match_count: matchCount,
        filter_session_id: sessionId,
      }
    );

    if (queryError) {
      console.error('❌ Supabase RPC match_documents error:', queryError);
      throw new Error(`Database error: ${queryError.message}`);
    }

    // Step 3: Check if relevant documents were found
    if (!results || results.length === 0) {
      console.log('ℹ️ No matching document chunks found above threshold (0.5)');
      return res.json({
        answer:
          "I don't have relevant information in the documents to answer this question. Please try a different question or upload more relevant documents.",
        sources: [],
        similarity_scores: [],
      });
    }

    console.log(`📚 Found ${results.length} relevant chunks for query`);

    // Step 4: Build formatted context from results
    const context = results
      .map((doc) => `--- Excerpt from "${doc.title}" ---\n${doc.content}`)
      .join('\n\n');

    // Step 5: Generate answer using Gemini LLM
    console.log('🤖 Synthesizing answer with Google Gemini...');
    const answer = await generateAnswerWithGemini(context, cleanQuestion);

    // Step 6: Extract unique source names and similarity scores
    const uniqueSources = [...new Set(results.map((r) => r.title))];
    const similarityScores = results.map((r) => r.similarity);

    console.log(`✅ Successfully answered query. Sources: [${uniqueSources.join(', ')}]`);

    return res.json({
      answer,
      sources: uniqueSources,
      similarity_scores: similarityScores,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
