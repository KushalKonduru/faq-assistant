import express from 'express';
import multer from 'multer';
import { createClient } from '@supabase/supabase-js';
import { extractText } from '../utils/fileParser.js';
import { chunkText } from '../utils/chunking.js';
import { generateEmbedding } from '../utils/embedding.js';
import { generatePromptsFromDocument } from '../utils/gemini.js';

const router = express.Router();

// Configure multer memory storage with 50MB file size limit
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    const isAllowed =
      file.mimetype === 'application/pdf' ||
      file.mimetype === 'text/plain' ||
      file.mimetype === 'text/markdown' ||
      file.originalname.match(/\.(pdf|txt|md)$/i);

    if (isAllowed) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type: ${file.mimetype}. Allowed types: PDF, TXT, MD`), false);
    }
  },
});

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
 * Helper to get session ID from request
 */
function getSessionId(req) {
  return (
    req.headers['x-session-id'] ||
    req.body?.session_id ||
    req.query?.session_id ||
    null
  );
}

/**
 * GET /api/documents
 * List all unique documents for the active session
 */
router.get('/', async (req, res, next) => {
  try {
    const sessionId = getSessionId(req);

    if (!sessionId) {
      // If no session provided, return empty list to protect privacy
      return res.json({ documents: [] });
    }

    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from('documents')
      .select('id, title, created_at')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Supabase error fetching documents:', error.message);
      throw new Error(`Database error: ${error.message}`);
    }

    // Group rows by document title
    const documentsMap = new Map();

    for (const row of data || []) {
      const title = row.title;
      if (!documentsMap.has(title)) {
        documentsMap.set(title, {
          title,
          chunks_count: 0,
          created_at: row.created_at,
        });
      }
      documentsMap.get(title).chunks_count++;
    }

    const documents = Array.from(documentsMap.values());

    console.log(`📋 Retrieved ${documents.length} private documents for session: ${sessionId.slice(0, 12)}...`);
    return res.json({ documents });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/documents/:title
 * Delete all chunks for a document belonging to the active session
 */
router.delete('/:title', async (req, res, next) => {
  try {
    const rawTitle = req.params.title;
    if (!rawTitle) {
      return res.status(400).json({ error: 'Document title parameter is required' });
    }

    const sessionId = getSessionId(req);
    const title = decodeURIComponent(rawTitle);
    console.log(`🗑️ Received delete request for document: "${title}" (Session: ${sessionId?.slice(0, 12)}...)`);

    const supabase = getSupabaseClient();

    let query = supabase
      .from('documents')
      .delete({ count: 'exact' })
      .eq('title', title);

    if (sessionId) {
      query = query.eq('session_id', sessionId);
    }

    const { count, error } = await query;

    if (error) {
      console.error(`❌ Supabase error deleting document "${title}":`, error.message);
      throw new Error(`Database error: ${error.message}`);
    }

    if (count === 0) {
      console.warn(`⚠️ No document chunks found matching title: "${title}" in session`);
      return res.status(404).json({
        error: `No document found with title "${title}" in your session`,
      });
    }

    console.log(`✅ Successfully deleted ${count} chunks for document "${title}"`);

    return res.json({
      success: true,
      message: `Successfully deleted document "${title}" and its ${count} chunk(s)`,
      deletedChunks: count,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/documents/generate-prompts
 * Generate 4-5 dynamic suggested prompts based on document content
 */
router.post('/generate-prompts', async (req, res, next) => {
  try {
    const { title } = req.body;

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return res.status(400).json({ error: 'Document title is required' });
    }

    const cleanTitle = title.trim();
    const sessionId = getSessionId(req);
    console.log(`🤖 Generating suggested prompts for document: "${cleanTitle}" (Session: ${sessionId?.slice(0, 12)}...)`);

    const supabase = getSupabaseClient();

    // Retrieve chunks for this document filtered by session
    let chunkQuery = supabase
      .from('documents')
      .select('content')
      .eq('title', cleanTitle)
      .limit(10);

    if (sessionId) {
      chunkQuery = chunkQuery.eq('session_id', sessionId);
    }

    const { data: chunks, error } = await chunkQuery;

    if (error) {
      console.error(`❌ Supabase error fetching chunks for "${cleanTitle}":`, error.message);
      throw new Error(`Database error: ${error.message}`);
    }

    if (!chunks || chunks.length === 0) {
      return res.status(404).json({
        error: `No document chunks found for "${cleanTitle}" in your session`,
      });
    }

    // Extract text from chunks
    const chunkTexts = chunks.map((c) => c.content);

    // Generate prompts with Gemini
    const prompts = await generatePromptsFromDocument(chunkTexts);
    console.log(`✨ Generated ${prompts.length} dynamic prompts for "${cleanTitle}":`, prompts);

    return res.json({ prompts });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/documents/upload
 * Upload and process a document (PDF, TXT, MD) tagged to active session
 */
router.post('/upload', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded. Please provide a valid file field.' });
    }

    const sessionId = getSessionId(req) || 'sess_anonymous';

    console.log(
      `📄 Received file upload: ${req.file.originalname} (${req.file.mimetype}, ${req.file.size} bytes) for Session: ${sessionId.slice(0, 12)}...`
    );

    // Step 1: Extract text from file
    const text = await extractText(req.file);

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: 'Uploaded file is empty or contains no readable text' });
    }

    console.log(`📝 Extracted ${text.length} characters from ${req.file.originalname}`);

    // Step 2: Chunk the extracted text (800 chars with 100 overlap for rich context & speed)
    const chunks = chunkText(text, 800, 100);

    if (chunks.length === 0) {
      return res.status(400).json({ error: 'Could not generate chunks from the uploaded file' });
    }

    console.log(`✂️ Created ${chunks.length} chunks`);

    // Step 3: Initialize Supabase client
    const supabase = getSupabaseClient();

    // Step 4: Generate embeddings concurrently in batches of 5
    const rowsToInsert = [];
    const EMBEDDING_BATCH_SIZE = 5;

    for (let i = 0; i < chunks.length; i += EMBEDDING_BATCH_SIZE) {
      const batchChunks = chunks.slice(i, i + EMBEDDING_BATCH_SIZE);
      const embeddings = await Promise.all(
        batchChunks.map((chunk) => generateEmbedding(chunk))
      );

      for (let j = 0; j < batchChunks.length; j++) {
        rowsToInsert.push({
          title: req.file.originalname,
          content: batchChunks[j],
          embedding: embeddings[j],
          session_id: sessionId,
        });
      }

      console.log(
        `⏳ Embedded ${Math.min(i + EMBEDDING_BATCH_SIZE, chunks.length)}/${chunks.length} chunks`
      );
    }

    // Step 5: Bulk insert into Supabase in batches of 25
    let successCount = 0;
    const DB_BATCH_SIZE = 25;

    for (let i = 0; i < rowsToInsert.length; i += DB_BATCH_SIZE) {
      const dbBatch = rowsToInsert.slice(i, i + DB_BATCH_SIZE);
      const { error: insertError } = await supabase.from('documents').insert(dbBatch);

      if (insertError) {
        console.error(`❌ Error inserting database batch at ${i}:`, insertError.message);
      } else {
        successCount += dbBatch.length;
      }
    }

    if (successCount === 0) {
      return res.status(500).json({
        error: 'Failed to store document chunks in database',
      });
    }

    console.log(`✅ Successfully stored ${successCount}/${chunks.length} chunks in Supabase`);

    return res.json({
      success: true,
      fileName: req.file.originalname,
      fileType: req.file.mimetype,
      totalCharacters: text.length,
      chunksCreated: successCount,
      message: `Processed ${successCount} chunks from ${chunks.length} created`,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
