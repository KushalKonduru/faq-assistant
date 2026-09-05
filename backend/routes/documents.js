import express from 'express';
import multer from 'multer';
import { createClient } from '@supabase/supabase-js';
import { extractText } from '../utils/fileParser.js';
import { chunkText } from '../utils/chunking.js';
import { generateEmbedding } from '../utils/embedding.js';

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
