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
 * GET /api/documents
 * List all unique documents stored in Supabase with chunk counts and timestamps
 */
router.get('/', async (req, res, next) => {
  try {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from('documents')
      .select('id, title, created_at')
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

    console.log(`📋 Retrieved ${documents.length} unique documents from Supabase`);
    return res.json({ documents });
  } catch (error) {
    next(error);
  }
});

/**
 * DELETE /api/documents/:title
 * Delete all chunks associated with a specific document title
 */
router.delete('/:title', async (req, res, next) => {
  try {
    const rawTitle = req.params.title;
    if (!rawTitle) {
      return res.status(400).json({ error: 'Document title parameter is required' });
    }

    const title = decodeURIComponent(rawTitle);
    console.log(`🗑️ Received delete request for document: "${title}"`);

    const supabase = getSupabaseClient();

    const { count, error } = await supabase
      .from('documents')
      .delete({ count: 'exact' })
      .eq('title', title);

    if (error) {
      console.error(`❌ Supabase error deleting document "${title}":`, error.message);
      throw new Error(`Database error: ${error.message}`);
    }

    if (count === 0) {
      console.warn(`⚠️ No document chunks found matching title: "${title}"`);
      return res.status(404).json({
        error: `No document found with title "${title}"`,
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
    console.log(`🤖 Generating suggested prompts for document: "${cleanTitle}"`);

    const supabase = getSupabaseClient();

    // Retrieve chunks for this document
    const { data: chunks, error } = await supabase
      .from('documents')
      .select('content')
      .eq('title', cleanTitle)
      .limit(10);

    if (error) {
      console.error(`❌ Supabase error fetching chunks for "${cleanTitle}":`, error.message);
      throw new Error(`Database error: ${error.message}`);
    }

    if (!chunks || chunks.length === 0) {
      return res.status(404).json({
        error: `No document chunks found for "${cleanTitle}"`,
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
 * Upload and process a document (PDF, TXT, MD)
 */
router.post('/upload', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded. Please provide a valid file field.' });
    }

    console.log(
      `📄 Received file upload: ${req.file.originalname} (${req.file.mimetype}, ${req.file.size} bytes)`
    );

    // Step 1: Extract text from file
    const text = await extractText(req.file);

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: 'Uploaded file is empty or contains no readable text' });
    }

    console.log(`📝 Extracted ${text.length} characters from ${req.file.originalname}`);

    // Step 2: Chunk the extracted text
    const chunks = chunkText(text, 500, 50);

    if (chunks.length === 0) {
      return res.status(400).json({ error: 'Could not generate chunks from the uploaded file' });
    }

    console.log(`✂️ Created ${chunks.length} chunks`);

    // Step 3: Initialize Supabase client
    const supabase = getSupabaseClient();

    // Step 4: Generate embeddings and insert into Supabase
    let successCount = 0;
    const errors = [];

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];

      try {
        const embedding = await generateEmbedding(chunk);

        const { error: insertError } = await supabase
          .from('documents')
          .insert([
            {
              title: req.file.originalname,
              content: chunk,
              embedding: embedding,
            },
          ]);

        if (insertError) {
          console.error(`❌ Error inserting chunk ${i + 1}/${chunks.length}:`, insertError.message);
          errors.push(`Chunk ${i + 1}: ${insertError.message}`);
        } else {
          successCount++;
        }

        if ((i + 1) % 10 === 0 || i + 1 === chunks.length) {
          console.log(`⏳ Progress: ${i + 1}/${chunks.length} chunks processed`);
        }
      } catch (chunkError) {
        console.error(`❌ Error processing chunk ${i + 1}:`, chunkError.message);
        errors.push(`Chunk ${i + 1}: ${chunkError.message}`);
      }
    }

    if (successCount === 0) {
      return res.status(500).json({
        error: 'Failed to store document chunks in database',
        details: errors,
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
