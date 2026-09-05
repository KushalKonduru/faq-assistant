# AI FAQ Assistant with RAG - Project Phases

**Timeline:** 1-2 Weeks  
**Goal:** Build a production-ready RAG system for document Q&A  
**Target Audience:** Established companies (solid full-stack engineering)

---

## 📋 Project Overview

A full-stack web application that allows users to:
1. Upload documents (PDF, TXT, Markdown)
2. Ask questions about the documents
3. Receive AI-generated answers with citations

**Tech Stack:**
- Frontend: React + Tailwind CSS (Vercel)
- Backend: Node.js + Express (Render)
- Database & Vector DB: Supabase (pgvector + Auth) - FREE
- Embeddings: Xenova/transformers (local, free)
- LLM: Google Gemini 2.0 Flash (free tier - 60 requests/minute)

---

## 🎯 Phase 1: Project Setup & Infrastructure (Days 1-2)

### Goals
- Set up development environment
- Configure all free-tier services
- Create project structure
- Establish Git repository

### Tasks

#### 1.1 Local Development Setup - STEP BY STEP

**Prerequisites Check:**
- [ ] Have Node.js installed? Check: `node --version` (should be 16+)
- [ ] Have npm installed? Check: `npm --version`
- [ ] If not, download from [nodejs.org](https://nodejs.org)

**Step 1: Create Project Directory**
- [ ] Open terminal/command prompt
- [ ] Run:
  ```bash
  mkdir faq-assistant
  cd faq-assistant
  ```
- [ ] Verify you're in the right folder: `pwd` (Mac/Linux) or `cd` (Windows)

**Step 2: Create Folder Structure**
- [ ] Run these commands:
  ```bash
  mkdir frontend
  mkdir backend
  touch README.md
  ```
- [ ] Verify: `ls -la` (Mac/Linux) or `dir` (Windows)
- [ ] You should see folders: `frontend/`, `backend/`, file: `README.md`

**Step 3: Create `.env` Files**
- [ ] Create `backend/.env` (this is WHERE you'll put secrets)
  ```bash
  cd backend
  touch .env
  cd ..
  ```
- [ ] **IMPORTANT:** `.env` should be created but EMPTY for now
- [ ] You'll fill it in after setting up services

**Step 4: Create `.gitignore` File**
- [ ] In project root, create `.gitignore`:
  ```bash
  touch .gitignore
  ```
- [ ] Open in text editor and add (we'll do complete version in Step 1.5):
  ```
  .env
  .env.local
  node_modules/
  ```

**Step 5: Verify Structure**
- [ ] Run: `tree` or `find . -maxdepth 2` (to see folder structure)
- [ ] Should look like:
  ```
  faq-assistant/
  ├── frontend/
  ├── backend/
  │   └── .env (empty for now)
  ├── README.md
  └── .gitignore
  ```

**You're ready for next steps!** ✅

#### 1.2 Supabase Setup (Vector Database) - DETAILED STEPS

**Step 1: Sign Up**
- [ ] Go to [supabase.com](https://supabase.com)
- [ ] Click "Start your project" or "Sign In"
- [ ] Sign up with GitHub, Google, or email
- [ ] Verify email if needed

**Step 2: Create Project**
- [ ] Click "New Project" or "Create a new project"
- [ ] Fill in:
  - [ ] **Project name:** `faq-assistant` (or any name)
  - [ ] **Database password:** Create strong password (save it!)
  - [ ] **Region:** Choose closest to you (e.g., us-east-1)
- [ ] Click "Create new project"
- [ ] Wait 2-3 minutes for project to initialize (you'll see spinning loader)

**Step 3: Get Connection Credentials**
- [ ] After project loads, go to **Settings** → **Database**
- [ ] Scroll to "Connection string" section
- [ ] Find:
  - [ ] **Connection URL (psql):** Copy this
  - [ ] **Password:** Use the one you set above
- [ ] Also go to **Settings** → **API**
- [ ] Copy:
  - [ ] **Project URL:** (under "API")
  - [ ] **anon public:** (under "API keys")
  - [ ] **service_role secret:** (under "API keys" - KEEP SECRET!)

**Step 4: Enable pgvector Extension**
- [ ] Click on **SQL Editor** in left sidebar
- [ ] Click "New Query"
- [ ] Paste and run:
  ```sql
  CREATE EXTENSION IF NOT EXISTS vector;
  ```
- [ ] Click "Run" (or Ctrl+Enter)
- [ ] You should see success message

**Step 5: Create Documents Table**
- [ ] Still in SQL Editor, click "New Query"
- [ ] Paste this entire code:
  ```sql
  CREATE TABLE documents (
    id BIGSERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    embedding VECTOR(1536),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
  );

  CREATE INDEX ON documents USING IVFFLAT (embedding VECTOR_COSINE_OPS);
  ```
- [ ] Click "Run"
- [ ] You should see success message (table created)

**Step 6: Create Search Function**
- [ ] Click "New Query" again
- [ ] Paste this:
  ```sql
  CREATE OR REPLACE FUNCTION match_documents(
    query_embedding VECTOR,
    match_threshold FLOAT,
    match_count INT
  )
  RETURNS TABLE (
    id BIGINT,
    title TEXT,
    content TEXT,
    similarity FLOAT
  ) AS $$
  BEGIN
    RETURN QUERY
    SELECT
      documents.id,
      documents.title,
      documents.content,
      1 - (documents.embedding <=> query_embedding) as similarity
    FROM documents
    WHERE 1 - (documents.embedding <=> query_embedding) > match_threshold
    ORDER BY documents.embedding <=> query_embedding
    LIMIT match_count;
  END;
  $$ LANGUAGE plpgsql;
  ```
- [ ] Click "Run"
- [ ] Success message should appear

**Step 7: Verify Everything Works**
- [ ] Go to **Table Editor** (left sidebar)
- [ ] You should see `documents` table listed
- [ ] Click on it to see the columns (id, title, content, embedding, created_at, updated_at)
- [ ] Table is ready! ✅

**Step 8: Save Credentials to `.env`**
- [ ] Create file `backend/.env`
- [ ] Add these (replace with YOUR actual values):
  ```env
  # Supabase Configuration
  SUPABASE_URL=https://your-project-id.supabase.co
  SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  
  # Gemini API
  GEMINI_API_KEY=AIzaSy_your_actual_key_here
  ```
- [ ] **Find SUPABASE_URL:**
  - [ ] Go to **Settings** → **API** in Supabase
  - [ ] Copy "Project URL" value
- [ ] **Find SUPABASE_KEY:**
  - [ ] Go to **Settings** → **API**
  - [ ] Copy "anon public" under "API keys"
- [ ] **Find GEMINI_API_KEY:**
  - [ ] Go to [aistudio.google.com/app/apikeys](https://aistudio.google.com/app/apikeys)
  - [ ] Click "Create API Key"
  - [ ] Copy immediately
  
**IMPORTANT:** Don't commit `.env` to GitHub! Add to `.gitignore`

#### 1.3 LLM API Setup - Choose ONE

**OPTION A: Google Gemini (RECOMMENDED - Most Generous Free Tier)**

**Step 1: Get API Key**
- [ ] Go to [aistudio.google.com/app/apikeys](https://aistudio.google.com/app/apikeys)
- [ ] Sign in with Google account (create if needed)
- [ ] Click "Create API Key"
- [ ] Select "Create API key in new project" or existing project
- [ ] Copy the API key immediately (won't show again!)
- [ ] Keep it safe - this is like a password

**Step 2: Add to `.env`**
- [ ] Open `backend/.env`
- [ ] Add:
  ```env
  GEMINI_API_KEY=AIzaSy_your_actual_key_here_very_long_string
  ```

**Step 3: Test It Works**
- [ ] Keep this for later (Phase 2)

**Free tier limits:** 60 requests/minute (plenty for MVP!)

---

**OPTION B: Google Gemini API (If you prefer)**

**Step 1: Sign Up**
- [ ] Go to [console.anthropic.com](https://console.anthropic.com)
- [ ] Click "Sign Up"
- [ ] Create account with email
- [ ] Verify email

**Step 2: Get Free Credits**
- [ ] Go to billing page
- [ ] You should see "$5.00 free credits" available
- [ ] (If not, you might need to verify payment method, but you won't be charged)

**Step 3: Create API Key**
- [ ] Click on profile icon (top right)
- [ ] Go to "API Keys"
- [ ] Click "Create New API Key"
- [ ] Copy immediately and save securely

**Step 4: Add to `.env`**
- [ ] Open `backend/.env`
- [ ] Add:
  ```env
  GEMINI_API_KEY=sk-ant-v0-your_very_long_key_string_here
  ```

**Free tier limits:** $5 in free credits (approximately 1-2 million tokens)

---

**OPTION C: Groq (Fastest Option)**

**Step 1: Sign Up**
- [ ] Go to [console.groq.com](https://console.groq.com)
- [ ] Click "Sign Up"
- [ ] Create account

**Step 2: Get API Key**
- [ ] Go to API Keys section
- [ ] Click "Create New API Key"
- [ ] Copy it immediately

**Step 3: Add to `.env`**
- [ ] Open `backend/.env`
- [ ] Add:
  ```env
  GROQ_API_KEY=gsk_your_key_here
  ```

**Free tier:** Generous limits (check dashboard)

---

**WHICH ONE TO CHOOSE?**
- ✅ **Gemini (RECOMMENDED)** = Most generous free tier, 60 requests/min, least setup, very good quality
- 👍 **Claude** = Best quality responses, $5 free credits
- 👍 **Groq** = Fastest responses, good free tier

**My strong recommendation:** Use **Gemini** throughout this entire project
- ✅ 60 requests/minute (plenty for MVP testing)
- ✅ No rate limiting for development
- ✅ Fastest setup (2 minutes)
- ✅ No credit card needed
- ✅ Quality is excellent for FAQ use case

#### 1.4 Supabase Auth Setup (Optional for MVP)

**Note:** Supabase includes both database AND authentication. For this MVP, we're using Supabase for:
- Document storage (already set up in 1.2)
- Vector embeddings (already set up in 1.2)
- **Optional:** User authentication (add later if needed)

**FOR THIS MVP:** Auth setup is optional. Skip to 1.5 to continue with Git setup.

**If you want to add auth later:**
- Supabase Auth is already available in your project from Step 1.2
- No additional setup needed - just enable it in code when ready
- Guide: [supabase.com/docs/guides/auth](https://supabase.com/docs/guides/auth)

#### 1.5 Git & GitHub Setup

**Step 1: Create `.gitignore` File**
- [ ] In project root, create file `backend/.gitignore`
- [ ] Paste:
  ```
  # Environment variables (NEVER commit these!)
  .env
  .env.local
  .env.*.local
  
  # Dependencies
  node_modules/
  
  # Logs
  *.log
  npm-debug.log*
  
  # IDE
  .vscode/
  .idea/
  *.swp
  *.swo
  
  # OS
  .DS_Store
  Thumbs.db
  ```
- [ ] Save file

**Step 2: Create `.env.example` File**
- [ ] In `backend/`, create file `.env.example`
- [ ] This shows what env vars are needed (WITHOUT secrets!)
- [ ] Paste:
  ```env
  # Supabase
  SUPABASE_URL=https://your-project.supabase.co
  SUPABASE_KEY=your_anon_public_key
  
  # LLM API (choose one)
  GEMINI_API_KEY=your_key
  # GEMINI_API_KEY=your_key
  # GROQ_API_KEY=your_key
  
  # Optional: Ollama (if running locally)
  OLLAMA_URL=http://localhost:11434
  
  # Server
  PORT=3000
  NODE_ENV=development
  ```
- [ ] Save file

**Step 3: Initialize Git Repository**
- [ ] Open terminal in project root
- [ ] Run:
  ```bash
  git init
  git config user.name "Your Name"
  git config user.email "your.email@example.com"
  ```

**Step 4: Create GitHub Repository**
- [ ] Go to [github.com](https://github.com)
- [ ] Sign in (create account if needed)
- [ ] Click "+" icon (top right)
- [ ] Click "New repository"
- [ ] Fill in:
  - [ ] **Repository name:** `faq-assistant`
  - [ ] **Description:** "AI FAQ Assistant with RAG and LLM"
  - [ ] **Visibility:** Public (for portfolio)
  - [ ] **DO NOT** initialize with README
- [ ] Click "Create repository"
- [ ] Copy the repository URL (HTTPS or SSH)
  - It looks like: `https://github.com/yourname/faq-assistant.git`

**Step 5: Connect Local Git to GitHub**
- [ ] In terminal, run:
  ```bash
  git remote add origin https://github.com/yourname/faq-assistant.git
  git branch -M main
  ```
- [ ] Replace URL with YOUR repo URL

**Step 6: Make First Commit**
- [ ] In project root, run:
  ```bash
  git add .
  git commit -m "Initial project setup with .env.example and .gitignore"
  git push -u origin main
  ```
- [ ] Refresh GitHub page - you should see your files!

**Step 7: Add `.env` to `.gitignore` (VERIFY)**
- [ ] Make sure `.gitignore` contains `.env`
- [ ] Run:
  ```bash
  git status
  ```
- [ ] You should NOT see `.env` or `.env.local` listed
- [ ] If you see them, they haven't been committed yet (good!)
- [ ] If you see "deleted: .env", the file was already committed by accident
  - Run: `git rm --cached .env` then `git commit -m "Remove .env from tracking"`

### Deliverables Checklist
- ✅ Project folder structure created
- ✅ Supabase project created with pgvector enabled
- ✅ Documents table and match_documents function created
- ✅ Gemini API key obtained
- ✅ `.env` file filled with Supabase credentials and Gemini key
- ✅ `.env.example` created (safe to commit)
- ✅ `.gitignore` configured (protects secrets)
- ✅ GitHub repository created and connected
- ✅ First commit pushed to GitHub
- ✅ All credentials saved securely (NO MongoDB needed)

### Time Estimate: 2-3 hours

### Verification Checklist (Before Moving to Phase 2)
- [ ] Can you access Supabase dashboard?
- [ ] Can you see `documents` table in Table Editor?
- [ ] Can you see `match_documents` function in Functions?
- [ ] Do you have Gemini API key saved in `.env`?
- [ ] Is `.env` in `.gitignore`?
- [ ] Can you see your files on GitHub?
- [ ] Does `backend/.env` have: SUPABASE_URL, SUPABASE_KEY, GEMINI_API_KEY?

If you answered YES to all → You're ready for Phase 2! 🎉

---

## 💻 Phase 2: Backend Development (Days 2-4)

### Goals
- Build Express server
- Implement document upload with file parsing
- Create RAG query pipeline
- Integrate Google Gemini API

### Tasks

#### 2.1 Backend Project Setup - DETAILED STEPS

**Step 1: Initialize Backend**
- [ ] Open terminal in project root
- [ ] Run:
  ```bash
  cd backend
  npm init -y
  ```
- [ ] This creates `package.json` file
- [ ] Verify: `ls` should show `package.json`

**Step 2: Install All Dependencies**
- [ ] Still in `backend/` folder
- [ ] Run this complete command:
  ```bash
  npm install express dotenv @supabase/supabase-js \
    @google/generative-ai @xenova/transformers multer \
    pdf-parse cors axios
  ```
- [ ] This installs:
  - `express` - Web server
  - `dotenv` - Load environment variables
  - `@supabase/supabase-js` - Supabase client
  - `@google/generative-ai` - Google Gemini API (primary LLM)
  - `@xenova/transformers` - Embedding model (free, local)
  - `multer` - File upload handling
  - `pdf-parse` - PDF extraction
  - `cors` - Cross-origin requests
  - `axios` - HTTP requests
- [ ] Wait for installation (2-3 minutes)
- [ ] Verify: `ls node_modules | head -20` should show folder names

**Step 3: Create Folder Structure**
- [ ] Run these commands (still in `backend/`):
  ```bash
  mkdir routes middleware utils
  touch server.js
  ```
- [ ] Verify structure:
  ```bash
  ls -la
  ```
- [ ] Should show: `node_modules/`, `routes/`, `middleware/`, `utils/`, `server.js`, `package.json`, `.env`

**Step 4: Create Route Files**
- [ ] Run:
  ```bash
  touch routes/documents.js
  touch routes/query.js
  touch middleware/errorHandler.js
  touch utils/embedding.js
  touch utils/fileParser.js
  ```

**Step 5: Create Basic `server.js`**
- [ ] Open `backend/server.js` in text editor
- [ ] Paste:
  ```javascript
  import express from 'express';
  import cors from 'cors';
  import dotenv from 'dotenv';

  dotenv.config();

  const app = express();
  const PORT = process.env.PORT || 3000;

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'Server is running' });
  });

  // Routes will go here (Phase 2)

  // Start server
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
  ```
- [ ] Save file

**Step 6: Update `package.json`**
- [ ] Open `backend/package.json`
- [ ] Add this line after `"name":` line:
  ```json
  "type": "module",
  ```
  This allows using `import` statements (modern JavaScript)
- [ ] Also add `"start"` script. Find `"scripts"` section and update to:
  ```json
  "scripts": {
    "start": "node server.js",
    "dev": "node --watch server.js"
  },
  ```
- [ ] Save file

**Step 7: Test Server Starts**
- [ ] Run:
  ```bash
  npm start
  ```
- [ ] You should see:
  ```
  Server running on http://localhost:3000
  ```
- [ ] Press `Ctrl+C` to stop

**Step 8: Verify `.env` Has Required Keys**
- [ ] Open `backend/.env`
- [ ] Make sure it has:
  ```env
  SUPABASE_URL=https://your-project.supabase.co
  SUPABASE_KEY=your_anon_public_key
  GEMINI_API_KEY=your_key_here
  PORT=3000
  NODE_ENV=development
  ```
- [ ] If any are missing, add them now

**Step 9: Test Environment Variables Load**
- [ ] In `server.js`, add this line after `dotenv.config()`:
  ```javascript
  console.log('Supabase URL loaded:', !!process.env.SUPABASE_URL);
  console.log('LLM API key loaded:', !!process.env.GEMINI_API_KEY);
  ```
- [ ] Run: `npm start`
- [ ] Should show `true` for both
- [ ] If showing `false`, check `.env` file

**Backend folder is now set up!** ✅

#### 2.2 File Parser & Text Extraction - CREATE STEP BY STEP

**What this does:** Takes uploaded files (PDF, TXT, MD) and extracts plain text

**Step 1: Create `backend/utils/fileParser.js`**
- [ ] Open text editor
- [ ] Create new file at `backend/utils/fileParser.js`
- [ ] Paste this complete code:

```javascript
import pdfParse from 'pdf-parse';

/**
 * Extract text from uploaded file
 * @param {Object} file - Multer file object
 * @returns {Promise<string>} - Extracted text
 */
export async function extractText(file) {
  const { mimetype, buffer, originalname } = file;

  try {
    // Handle PDF files
    if (mimetype === 'application/pdf' || originalname.endsWith('.pdf')) {
      const pdfData = await pdfParse(buffer);
      return pdfData.text;
    }

    // Handle TXT and Markdown files
    if (
      mimetype === 'text/plain' ||
      mimetype === 'text/markdown' ||
      originalname.endsWith('.txt') ||
      originalname.endsWith('.md')
    ) {
      return buffer.toString('utf-8');
    }

    // Unsupported format
    throw new Error(
      `Unsupported file type: ${mimetype}. Supported: PDF, TXT, MD`
    );
  } catch (error) {
    throw new Error(`Failed to parse file: ${error.message}`);
  }
}
```

- [ ] Save the file

**Step 2: Test File Parser (Optional)**
- [ ] Create test file `backend/test-fileParser.js`
- [ ] Paste:
  ```javascript
  import fs from 'fs';
  import { extractText } from './utils/fileParser.js';

  // Test with a TXT file
  const testFile = {
    mimetype: 'text/plain',
    buffer: Buffer.from('Hello world! This is a test.'),
    originalname: 'test.txt'
  };

  extractText(testFile)
    .then(text => console.log('Extracted:', text))
    .catch(err => console.error('Error:', err.message));
  ```
- [ ] Run: `node test-fileParser.js`
- [ ] Should print: `Extracted: Hello world! This is a test.`
- [ ] Delete test file when done

**Code checkpoint:** ✅ File parsing works

#### 2.3 Text Chunking Utility - CREATE STEP BY STEP

**What this does:** Splits long text into smaller chunks for embedding

**Step 1: Create `backend/utils/chunking.js`**
- [ ] Create file at `backend/utils/chunking.js`
- [ ] Paste:

```javascript
/**
 * Split text into chunks
 * @param {string} text - Text to chunk
 * @param {number} chunkSize - Size of each chunk (default 500)
 * @param {number} overlap - Overlap between chunks (default 50)
 * @returns {string[]} - Array of text chunks
 */
export function chunkText(text, chunkSize = 500, overlap = 50) {
  if (!text || text.trim().length === 0) {
    return [];
  }

  const chunks = [];
  const cleanText = text.replace(/\s+/g, ' '); // Clean whitespace

  for (let i = 0; i < cleanText.length; i += chunkSize - overlap) {
    const chunk = cleanText.slice(i, i + chunkSize);
    
    if (chunk.trim().length > 0) {
      chunks.push(chunk);
    }
  }

  return chunks;
}
```

- [ ] Save file

**Step 2: Test Chunking (Optional)**
- [ ] Create `backend/test-chunking.js`
- [ ] Paste:
  ```javascript
  import { chunkText } from './utils/chunking.js';

  const testText = 'Lorem ipsum dolor sit amet. '.repeat(30);
  const chunks = chunkText(testText, 100, 10); // Smaller chunks for testing

  console.log(`Total text length: ${testText.length}`);
  console.log(`Number of chunks: ${chunks.length}`);
  console.log('First chunk:', chunks[0].substring(0, 50) + '...');
  console.log('Second chunk:', chunks[1].substring(0, 50) + '...');
  ```
- [ ] Run: `node test-chunking.js`
- [ ] Should show multiple chunks
- [ ] Delete test file when done

**Code checkpoint:** ✅ Text chunking works

#### 2.4 Embedding Generation (Local) - CREATE STEP BY STEP

**What this does:** Converts text to numerical vectors (1536 dimensions) for semantic search

**Step 1: Create `backend/utils/embedding.js`**
- [ ] Create file at `backend/utils/embedding.js`
- [ ] Paste:

```javascript
import { pipeline } from '@xenova/transformers';

let embeddingModel = null;

/**
 * Initialize embedding model (runs once on startup)
 */
export async function initializeEmbedder() {
  try {
    console.log('Loading embedding model... (first time takes 1-2 min)');
    embeddingModel = await pipeline(
      'feature-extraction',
      'Xenova/all-MiniLM-L6-v2'
    );
    console.log('✅ Embedding model loaded!');
  } catch (error) {
    throw new Error(`Failed to load embedding model: ${error.message}`);
  }
}

/**
 * Generate embedding for text
 * @param {string} text - Text to embed
 * @returns {Promise<number[]>} - Embedding vector
 */
export async function generateEmbedding(text) {
  if (!embeddingModel) {
    throw new Error('Embedding model not initialized. Call initializeEmbedder first');
  }

  try {
    if (!text || text.trim().length === 0) {
      throw new Error('Text cannot be empty');
    }

    const embeddings = await embeddingModel(text, {
      pooling: 'mean',
      normalize: true,
    });

    return Array.from(embeddings.data);
  } catch (error) {
    throw new Error(`Failed to generate embedding: ${error.message}`);
  }
}
```

- [ ] Save file

**Step 2: Update `server.js` to Initialize Embedder**
- [ ] Open `backend/server.js`
- [ ] Add these imports at the top:
  ```javascript
  import { initializeEmbedder } from './utils/embedding.js';
  ```
- [ ] Add this code before the server starts listening:
  ```javascript
  // Initialize embedding model on startup
  try {
    await initializeEmbedder();
  } catch (error) {
    console.error('Failed to initialize:', error.message);
    process.exit(1);
  }
  ```
- [ ] Your server.js should now look like:
  ```javascript
  import express from 'express';
  import cors from 'cors';
  import dotenv from 'dotenv';
  import { initializeEmbedder } from './utils/embedding.js';

  dotenv.config();

  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  app.get('/api/health', (req, res) => {
    res.json({ status: 'Server is running' });
  });

  // Initialize embedding model on startup
  try {
    await initializeEmbedder();
  } catch (error) {
    console.error('Failed to initialize:', error.message);
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
  ```
- [ ] Save

**Step 3: Test Embedding Generation**
- [ ] Run: `npm start`
- [ ] You should see:
  ```
  Loading embedding model... (first time takes 1-2 min)
  ✅ Embedding model loaded!
  Server running on http://localhost:3000
  ```
- [ ] First run takes 1-2 minutes while it downloads the model (~150MB)
- [ ] Subsequent runs are instant (model is cached)
- [ ] Press `Ctrl+C` to stop

**Code checkpoint:** ✅ Embeddings are working

#### 2.5 Document Upload Route - CREATE STEP BY STEP

**What this does:** API endpoint that accepts file uploads, processes them, and stores in Supabase

**Step 1: Create `backend/routes/documents.js`**
- [ ] Create file at `backend/routes/documents.js`
- [ ] Paste this complete code:

```javascript
import express from 'express';
import multer from 'multer';
import { createClient } from '@supabase/supabase-js';
import { extractText } from '../utils/fileParser.js';
import { chunkText } from '../utils/chunking.js';
import { generateEmbedding } from '../utils/embedding.js';

const router = express.Router();

// Configure multer for file uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

/**
 * POST /api/documents/upload
 * Upload and process a document
 */
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    // Validate file was uploaded
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    console.log(`Processing file: ${req.file.originalname}`);

    // Step 1: Extract text from file
    const text = await extractText(req.file);
    
    if (text.trim().length === 0) {
      return res.status(400).json({ error: 'File is empty or unreadable' });
    }

    console.log(`Extracted ${text.length} characters`);

    // Step 2: Chunk the text
    const chunks = chunkText(text, 500, 50);
    
    if (chunks.length === 0) {
      return res.status(400).json({ error: 'Could not create chunks from file' });
    }

    console.log(`Created ${chunks.length} chunks`);

    // Step 3: Generate embeddings and store in Supabase
    const documents = [];
    let successCount = 0;

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];

      try {
        // Generate embedding for this chunk
        const embedding = await generateEmbedding(chunk);

        // Insert into Supabase
        const { data, error } = await supabase
          .from('documents')
          .insert([
            {
              title: req.file.originalname,
              content: chunk,
              embedding: embedding,
            },
          ])
          .select();

        if (error) {
          console.error(`Error inserting chunk ${i + 1}:`, error);
        } else {
          documents.push(data[0]);
          successCount++;
        }

        // Log progress
        if ((i + 1) % 10 === 0) {
          console.log(`Progress: ${i + 1}/${chunks.length} chunks processed`);
        }
      } catch (error) {
        console.error(`Error processing chunk ${i + 1}:`, error.message);
      }
    }

    if (successCount === 0) {
      return res.status(500).json({ error: 'Failed to store any chunks' });
    }

    console.log(`✅ Successfully stored ${successCount} chunks`);

    res.json({
      success: true,
      fileName: req.file.originalname,
      fileType: req.file.mimetype,
      totalCharacters: text.length,
      chunksCreated: successCount,
      message: `Processed ${successCount} chunks from ${chunks.length} created`,
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to process file' 
    });
  }
});

export default router;
```

- [ ] Save file

**Step 2: Update `server.js` to Use Documents Route**
- [ ] Open `backend/server.js`
- [ ] Add import at the top:
  ```javascript
  import documentsRouter from './routes/documents.js';
  ```
- [ ] Add this line before `app.listen()`:
  ```javascript
  app.use('/api/documents', documentsRouter);
  ```
- [ ] Your app should now have routes configured

**Step 3: Test Upload Endpoint**
- [ ] Create a test file `test.txt` with some text:
  ```
  This is a test document. It contains information about uploads.
  The system will chunk this text and create embeddings.
  This is very important for the FAQ assistant.
  ```
- [ ] Start server: `npm start`
- [ ] Open another terminal and test with curl:
  ```bash
  curl -X POST http://localhost:3000/api/documents/upload \
    -F "file=@test.txt"
  ```
- [ ] You should get response:
  ```json
  {
    "success": true,
    "fileName": "test.txt",
    "chunksCreated": 1,
    "totalCharacters": 163
  }
  ```

**Step 4: Verify in Supabase**
- [ ] Go to Supabase dashboard
- [ ] Click "Table Editor"
- [ ] Select "documents" table
- [ ] You should see rows with your uploaded text!

**Code checkpoint:** ✅ Document upload works

#### 2.6 Document Listing Route (Optional Bonus)
- [ ] `GET /api/documents` endpoint
- [ ] Returns unique document titles
- [ ] Shows chunk count per document
- [ ] Useful for frontend display
- [ ] Can skip for MVP

#### 2.7 RAG Query Route - CREATE STEP BY STEP

**What this does:** Takes a question, finds relevant documents, and uses LLM to generate answer

**Step 1: Create Gemini Helper (Choose Your LLM)**
- [ ] Create file at `backend/utils/gemini.js`
- [ ] Paste:

```javascript
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Generate answer using Gemini API
 * @param {string} context - Retrieved document context
 * @param {string} question - User question
 * @returns {Promise<string>} - AI-generated answer
 */
export async function generateAnswerWithGemini(context, question) {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

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

    return result.response.text();
  } catch (error) {
    throw new Error(`Gemini API error: ${error.message}`);
  }
}
```

- [ ] Save file

**Alternative: If using Claude instead**
- [ ] Instead of the file above, create this for Claude:

```javascript
import Anthropic from '@google/generative-ai';

const anthropic = new Anthropic({
  apiKey: process.env.GEMINI_API_KEY,
});

export async function generateAnswerWithClaude(context, question) {
  try {
    const message = await anthropic.messages.create({
      model: 'claude-opus-4-20250805',
      max_tokens: 1024,
      system: `You are a helpful assistant that answers questions based on provided documents.
- Answer only based on the provided context
- If the answer is not in the context, say "I don't have this information"
- Be clear and concise`,
      messages: [
        {
          role: 'user',
          content: `Context from documents:

${context}

User question: ${question}

Please answer based only on the provided context.`,
        },
      ],
    });

    return message.content[0].text;
  } catch (error) {
    throw new Error(`Google Gemini API error: ${error.message}`);
  }
}
```

**Step 2: Create Query Route**
- [ ] Create file at `backend/routes/query.js`
- [ ] Paste (for Gemini):

```javascript
import express from 'express';
import { createClient } from '@supabase/supabase-js';
import { generateEmbedding } from '../utils/embedding.js';
import { generateAnswerWithGemini } from '../utils/gemini.js';

const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

/**
 * POST /api/query
 * Answer a question using RAG
 */
router.post('/', async (req, res) => {
  try {
    const { question } = req.body;

    // Validate question
    if (!question || question.trim().length === 0) {
      return res.status(400).json({ error: 'Question is required' });
    }

    console.log(`Query: ${question}`);

    // Step 1: Generate embedding for question
    const questionEmbedding = await generateEmbedding(question);

    // Step 2: Retrieve similar documents from Supabase
    const { data: results, error: queryError } = await supabase.rpc(
      'match_documents',
      {
        query_embedding: questionEmbedding,
        match_threshold: 0.5,
        match_count: 5,
      }
    );

    if (queryError) {
      throw new Error(`Database error: ${queryError.message}`);
    }

    // Step 3: Check if relevant documents found
    if (!results || results.length === 0) {
      return res.json({
        answer: "I don't have relevant information in the documents to answer this question. Please try a different question or upload more relevant documents.",
        sources: [],
        similarity_scores: [],
      });
    }

    console.log(`Found ${results.length} relevant chunks`);

    // Step 4: Build context from results
    const context = results
      .map(
        (doc, i) =>
          `[Document ${i + 1}: ${doc.title}]\n${doc.content}\n`
      )
      .join('\n---\n');

    // Step 5: Generate answer using LLM
    console.log('Generating answer...');
    const answer = await generateAnswerWithGemini(context, question);

    // Step 6: Return response
    res.json({
      answer,
      sources: [...new Set(results.map((r) => r.title))], // Unique titles
      similarity_scores: results.map((r) => r.similarity),
    });
  } catch (error) {
    console.error('Query error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
```

- [ ] Save file

**Step 3: Update `server.js` to Use Query Route**
- [ ] Open `backend/server.js`
- [ ] Add import:
  ```javascript
  import queryRouter from './routes/query.js';
  ```
- [ ] Add this line before `app.listen()`:
  ```javascript
  app.use('/api/query', queryRouter);
  ```

**Step 4: Test Query Endpoint**
- [ ] Make sure server is running: `npm start`
- [ ] In another terminal, test with curl:
  ```bash
  curl -X POST http://localhost:3000/api/query \
    -H "Content-Type: application/json" \
    -d '{"question": "What information was in the file?"}'
  ```
- [ ] You should get response with answer and sources!

**Expected response:**
```json
{
  "answer": "The file contains information about...",
  "sources": ["test.txt"],
  "similarity_scores": [0.85]
}
```

**Code checkpoint:** ✅ RAG query works

#### 2.8 Testing (Manual)
- [ ] Test file upload with PDF
- [ ] Test file upload with TXT
- [ ] Test file upload with Markdown
- [ ] Test with invalid file type (should reject)
- [ ] Test with empty file (should reject)
- [ ] Test query endpoint with question
- [ ] Verify embeddings are stored in Supabase
- [ ] Verify Gemini API is called correctly
- [ ] Check response format

### Deliverables
- ✅ Working Express server with Gemini integration
- ✅ File upload endpoint (PDF, TXT, MD)
- ✅ RAG query endpoint with Gemini LLM
- ✅ Embeddings generated and stored in Supabase
- ✅ All endpoints tested manually
- ✅ Error handling in place
- ✅ Environment variables configured

### Time Estimate: 1.5-2 days

### Testing Checklist
- [ ] Upload a 2-page PDF → Verify chunks in Supabase
- [ ] Upload a TXT file → Verify parsing works
- [ ] Ask a question → Verify Gemini generates response
- [ ] Check that sources are accurate
- [ ] Verify embeddings have correct dimensions (1536)
- [ ] Check that Gemini API key is being used

---

## 🎨 Phase 3: Frontend Development (Days 4-5)

### Goals
- Build React application
- Create upload component
- Create query/chat component
- Display results with citations
- Responsive, clean UI

### Tasks

#### 3.1 Frontend Project Setup - DETAILED STEPS

**Step 1: Create React App**
- [ ] Open terminal in project root (not in backend)
- [ ] Run:
  ```bash
  cd frontend
  npx create-react-app .
  ```
- [ ] This takes 5-10 minutes (lots of dependencies)
- [ ] When done, you should see:
  ```
  Success! Created react app at .../frontend
  ```
- [ ] Verify: `ls` should show `src/`, `public/`, `package.json`

**Step 2: Install Additional Dependencies**
- [ ] Still in `frontend/` folder
- [ ] Run:
  ```bash
  npm install axios
  npm install -D tailwindcss postcss autoprefixer
  npx tailwindcss init -p
  ```
- [ ] Creates Tailwind config files: `tailwind.config.js`, `postcss.config.js`

**Step 3: Configure Tailwind CSS**
- [ ] Open `frontend/tailwind.config.js`
- [ ] Replace the `content` array with:
  ```javascript
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  ```
- [ ] Open `frontend/src/index.css`
- [ ] Add at the very top:
  ```css
  @tailwind base;
  @tailwind components;
  @tailwind utilities;
  ```

**Step 4: Create Folder Structure**
- [ ] Run:
  ```bash
  mkdir -p src/components src/services
  touch src/components/DocumentUpload.jsx
  touch src/components/QueryForm.jsx
  touch src/components/AnswerDisplay.jsx
  touch src/components/DocumentList.jsx
  touch src/services/api.js
  ```

**Step 5: Create `.env.local` File**
- [ ] Create `frontend/.env.local`
- [ ] Add:
  ```env
  REACT_APP_API_URL=http://localhost:3000
  ```
- [ ] This tells React where the backend is

**Step 6: Create API Helper**
- [ ] Open `frontend/src/services/api.js`
- [ ] Paste:

```javascript
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: `${API_URL}/api`,
});

export const uploadDocument = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post('/documents/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export const queryDocuments = (question) => {
  return api.post('/query', { question });
};

export const getDocuments = () => {
  return api.get('/documents');
};
```

- [ ] Save file

**Frontend base setup done!** ✅

#### 3.2 Create `.env.local`
- [ ] Set backend API URL:
  ```
  REACT_APP_API_URL=http://localhost:3000
  ```

#### 3.3 DocumentUpload Component
- [ ] File input field (accept PDF, TXT, MD)
- [ ] Upload button with loading state
- [ ] Display file size
- [ ] Success/error messages
- [ ] Show upload progress
- [ ] After upload, refresh document list

**Features:**
- [ ] Disable button while uploading
- [ ] Show file name before upload
- [ ] Display success message with chunk count
- [ ] Display error messages
- [ ] Clear input after successful upload

#### 3.4 DocumentList Component
- [ ] Display list of uploaded documents
- [ ] Show how many chunks per document
- [ ] Delete button (optional for MVP, can skip)
- [ ] Loading state while fetching
- [ ] Refresh on new upload

#### 3.5 QueryForm Component
- [ ] Text input for question
- [ ] Submit button
- [ ] Loading state while waiting for answer
- [ ] Disabled state if no documents uploaded
- [ ] Clear query after submission
- [ ] Keyboard shortcut (Enter to submit)

#### 3.6 AnswerDisplay Component
- [ ] Show AI-generated answer
- [ ] Display sources (which documents used)
- [ ] Show similarity scores (if available)
- [ ] "No answer found" state if no relevant docs
- [ ] Loading skeleton while fetching
- [ ] Copy button (nice-to-have)

#### 3.7 App.jsx Main Component
- [ ] Layout with header
- [ ] Two-column layout:
  - [ ] Left: Document upload + document list
  - [ ] Right: Query form + answer display
- [ ] Responsive design (stack on mobile)
- [ ] Global loading/error states
- [ ] State management (useState)

#### 3.8 Styling & Tailwind
- [ ] Set up Tailwind config
- [ ] Create consistent color scheme
- [ ] Add responsive classes
- [ ] Style buttons, inputs, cards
- [ ] Add hover/focus states
- [ ] Dark mode support (optional)

#### 3.9 API Integration
- [ ] Create `src/api/api.js` helper:
  ```javascript
  export const uploadDocument = (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return axios.post(`${process.env.REACT_APP_API_URL}/api/documents/upload`, formData);
  }

  export const queryDocuments = (question) => {
    return axios.post(`${process.env.REACT_APP_API_URL}/api/query`, { question });
  }

  export const getDocuments = () => {
    return axios.get(`${process.env.REACT_APP_API_URL}/api/documents`);
  }
  ```
- [ ] Error handling for network requests
- [ ] Retry logic (optional)

#### 3.10 Testing
- [ ] Test upload with backend running
- [ ] Test query with uploaded documents
- [ ] Test error messages
- [ ] Test responsive design on mobile
- [ ] Test loading states
- [ ] Verify answers are displayed correctly

### Deliverables
- ✅ React app with all components
- ✅ API integration working
- ✅ Upload functionality complete
- ✅ Query functionality complete
- ✅ Responsive design
- ✅ Error handling and loading states

### Time Estimate: 1.5 days

### Component Testing Checklist
- [ ] Upload component: Can upload files, shows success
- [ ] Query component: Can enter questions, shows loading
- [ ] Answer component: Displays answers and sources
- [ ] Document list: Shows uploaded documents
- [ ] Responsive: Works on mobile, tablet, desktop

---

## 🧪 Phase 4: Integration & Testing (Days 5-6)

### Goals
- Test full end-to-end flow
- Fix bugs and edge cases
- Optimize performance
- Clean up code

### Tasks

#### 4.1 End-to-End Testing
- [ ] Upload PDF → Ask question → Get answer
- [ ] Upload TXT → Ask question → Get answer
- [ ] Upload Markdown → Ask question → Get answer
- [ ] Upload multiple documents → Query across all
- [ ] Test with empty question (should error)
- [ ] Test with no documents uploaded (should error)
- [ ] Test with question unrelated to docs
- [ ] Verify sources are accurate and cited

#### 4.2 Error Handling Testing
- [ ] Try uploading unsupported file type (should fail gracefully)
- [ ] Try uploading very large file (should fail or show warning)
- [ ] Try uploading corrupted PDF (should fail gracefully)
- [ ] Test with Google Gemini API rate limit hit (should show user-friendly error)
- [ ] Test with Supabase connection lost (should show error)
- [ ] Verify error messages are helpful

#### 4.3 Performance Optimization
- [ ] Check embedding generation speed
- [ ] Optimize chunk size if needed
- [ ] Check database query performance
- [ ] Monitor Google Gemini API response times
- [ ] Test with large documents (10+ pages)
- [ ] Verify no memory leaks in embedding model

#### 4.4 Code Quality
- [ ] Remove console.logs
- [ ] Add comments to complex functions
- [ ] Consistent code formatting (ESLint)
- [ ] Remove unused imports
- [ ] Proper error handling everywhere
- [ ] No hardcoded values (use env vars)

#### 4.5 UI/UX Polish
- [ ] Check all buttons are clickable and responsive
- [ ] Verify loading spinners show/hide correctly
- [ ] Check font sizes and readability
- [ ] Verify all text is legible
- [ ] Check color contrast (accessibility)
- [ ] Add placeholder text to inputs
- [ ] Smooth transitions and animations (optional)

#### 4.6 Security Check
- [ ] No API keys in frontend code
- [ ] No secrets in GitHub commits
- [ ] .env file in .gitignore
- [ ] Proper CORS configuration
- [ ] Input validation on backend
- [ ] No SQL injection vulnerabilities

#### 4.7 Documentation
- [ ] Add comments to backend routes
- [ ] Add JSDoc comments to frontend components
- [ ] Document API endpoints in code
- [ ] Add environment variable documentation
- [ ] Add troubleshooting guide

### Deliverables
- ✅ All major bugs fixed
- ✅ End-to-end flow works smoothly
- ✅ Error handling robust
- ✅ Code is clean and documented
- ✅ Performance is acceptable

### Time Estimate: 1 day

### QA Checklist
- [ ] Happy path: Upload → Query → Get answer
- [ ] Error handling: Invalid inputs handled gracefully
- [ ] Performance: Queries return in <5 seconds
- [ ] UI: All elements visible and clickable
- [ ] Security: No secrets exposed

---

## 🚀 Phase 5: Deployment (Days 6-7)

### Goals
- Deploy frontend to Vercel
- Deploy backend to Render
- Configure environment variables
- Test live deployment
- Create README

### Tasks

#### 5.1 Prepare for Deployment
- [ ] Create GitHub repository (if not done)
- [ ] Commit all code
- [ ] Remove all local environment variables from code
- [ ] Create `.env.example` files for reference
- [ ] Add deployment instructions to README

#### 5.2 Deploy Frontend to Vercel - STEP BY STEP

**Step 1: Sign Up on Vercel**
- [ ] Go to [vercel.com](https://vercel.com)
- [ ] Click "Sign Up"
- [ ] Click "Continue with GitHub"
- [ ] Authorize Vercel to access your GitHub
- [ ] You're logged in!

**Step 2: Import GitHub Repository**
- [ ] On Vercel dashboard, click "Add New..." → "Project"
- [ ] Click "Import an Existing Project"
- [ ] Select your GitHub repository (`faq-assistant`)
- [ ] Click "Import"

**Step 3: Configure Project Settings**
- [ ] You'll see configuration screen:
  - [ ] **Project name:** `faq-assistant` (or any name)
  - [ ] **Framework Preset:** "Create React App"
  - [ ] **Root Directory:** Click dropdown → Select `frontend`
  - [ ] Build command: Should auto-fill `npm run build`
  - [ ] Output directory: Should auto-fill `build`

**Step 4: Add Environment Variables**
- [ ] Scroll down to "Environment Variables"
- [ ] Add new variable:
  - [ ] Name: `REACT_APP_API_URL`
  - [ ] Value: Leave blank for now (you'll update after backend deployment)
- [ ] Click "Add"

**Step 5: Deploy**
- [ ] Click "Deploy"
- [ ] Vercel will build your project (takes 2-5 minutes)
- [ ] You'll see a "Deployment Complete" message
- [ ] Copy the URL (e.g., `https://faq-assistant.vercel.app`)

**Step 6: Update Environment Variable**
- [ ] After backend is deployed (see 5.3), go back to Vercel
- [ ] Click "Settings" → "Environment Variables"
- [ ] Edit `REACT_APP_API_URL`
- [ ] Set value to your Render backend URL (from Step 5.3)
- [ ] Click "Save"
- [ ] Vercel will auto-redeploy

**Frontend deployed!** ✅

#### 5.3 Deploy Backend to Render - STEP BY STEP

**Step 1: Sign Up on Render**
- [ ] Go to [render.com](https://render.com)
- [ ] Click "Sign Up"
- [ ] Click "Continue with GitHub"
- [ ] Authorize Render
- [ ] You're logged in!

**Step 2: Create Web Service**
- [ ] On dashboard, click "New +" button
- [ ] Select "Web Service"
- [ ] Click "Connect repository"
- [ ] Search for `faq-assistant`
- [ ] Click to select it
- [ ] Click "Connect"

**Step 3: Configure Deployment**
- [ ] Fill in settings:
  - [ ] **Name:** `faq-assistant-backend`
  - [ ] **Runtime:** Node
  - [ ] **Build Command:** `cd backend && npm install`
  - [ ] **Start Command:** `cd backend && node server.js`
  - [ ] **Instance Type:** Free

**Step 4: Add Environment Variables (GEMINI)**
- [ ] Scroll to "Environment Variables"
- [ ] Add each variable (click "Add Environment Variable"):
  
  | Name | Value |
  |------|-------|
  | `SUPABASE_URL` | `https://your-project.supabase.co` |
  | `SUPABASE_KEY` | Your Supabase anon public key |
  | `GEMINI_API_KEY` | Your Google Gemini API key |
  | `NODE_ENV` | `production` |
  | `PORT` | `3000` |

- [ ] **Get values from:**
  - [ ] `SUPABASE_URL` and `SUPABASE_KEY`: Supabase Dashboard → Settings → API
  - [ ] `GEMINI_API_KEY`: [aistudio.google.com/app/apikeys](https://aistudio.google.com/app/apikeys)

**Step 5: Deploy**
- [ ] Scroll down and click "Create Web Service"
- [ ] Render will:
  - [ ] Build your project (~3-5 minutes)
  - [ ] Deploy it (~2-5 minutes)
  - [ ] Show a live URL when done
- [ ] Copy the URL (e.g., `https://faq-assistant-backend.onrender.com`)

**Step 6: Verify Backend is Working**
- [ ] Open your backend URL + `/api/health`
- [ ] Example: `https://faq-assistant-backend.onrender.com/api/health`
- [ ] You should see: `{"status":"Server is running"}`

**Backend deployed with Gemini!** ✅

**Note:** On Render free tier, the server sleeps after 15 minutes of inactivity. First request after sleep takes 30-60 seconds. This is normal.

#### 5.4 Connect Frontend to Backend - STEP BY STEP

**Step 1: Update Frontend Environment Variable**
- [ ] Go to Vercel dashboard
- [ ] Select your `faq-assistant` project
- [ ] Click "Settings"
- [ ] Click "Environment Variables" (left sidebar)
- [ ] Find `REACT_APP_API_URL`
- [ ] Click the edit button (pencil icon)
- [ ] Set value to your Render backend URL
  - Example: `https://faq-assistant-backend.onrender.com`
- [ ] Click "Save"

**Step 2: Trigger Redeployment**
- [ ] Go to "Deployments" tab
- [ ] Click "Redeploy" on the latest deployment
- [ ] Or just make a small commit to your repo (GitHub → automatic deploy)
- [ ] Wait for redeployment (2-5 minutes)

**Step 3: Verify Connection**
- [ ] Go to your Vercel frontend URL
- [ ] Try uploading a file
- [ ] Try asking a question
- [ ] Check browser console (F12) for errors
- [ ] If everything works, you're connected! ✅

#### 5.5 Test Live Deployment
- [ ] Go to Vercel frontend URL
- [ ] Test upload functionality
- [ ] Test query functionality
- [ ] Check browser console for errors
- [ ] Test on mobile device
- [ ] Verify API calls go to live backend

#### 5.6 Fix CORS Issues (if any)
- [ ] Update backend CORS configuration:
  ```javascript
  app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true
  }));
  ```
- [ ] Add `FRONTEND_URL` to Render environment variables
- [ ] Redeploy backend

#### 5.7 Monitor Performance
- [ ] Check Vercel Analytics
- [ ] Check Render logs for errors
- [ ] Monitor Supabase usage (should be low)
- [ ] Monitor Google Gemini API costs (should be under $5 free credit)
- [ ] Set up basic monitoring/alerts (optional)

### Deliverables
- ✅ Frontend live on Vercel
- ✅ Backend live on Render
- ✅ Full end-to-end working on live URLs
- ✅ Environment variables configured correctly
- ✅ No errors in production

### Time Estimate: 1-2 hours

### Deployment Checklist
- [ ] Frontend deployed to Vercel
- [ ] Backend deployed to Render
- [ ] Environment variables set on both
- [ ] Can upload files on live site
- [ ] Can query documents on live site
- [ ] No console errors
- [ ] Live URLs work on mobile

---

## 📖 Phase 6: Documentation & Polish (Day 7)

### Goals
- Create comprehensive README
- Add screenshots
- Document features
- Prepare for job interviews

### Tasks

#### 6.1 Create Professional README.md - STEP BY STEP

**What to include:** A comprehensive guide for anyone to understand and use your project

**Step 1: Create the README**
- [ ] In project root, create `README.md`
- [ ] Or edit if one exists

**Step 2: Add Content**
- [ ] Paste this template and fill in YOUR values:

```markdown
# AI FAQ Assistant with Retrieval-Augmented Generation (RAG)

An intelligent document Q&A system that combines modern AI with semantic search. Upload documents (PDF, TXT, Markdown) and ask questions - the system retrieves relevant content and generates accurate answers using Claude/Gemini.

## 🎯 Live Demo

**Frontend:** [https://your-vercel-url.vercel.app](https://your-vercel-url.vercel.app)  
**Backend API:** [https://your-render-url.onrender.com](https://your-render-url.onrender.com)

## ✨ Features

- 📄 **Multi-Format Upload:** Support for PDF, TXT, and Markdown files
- 🔍 **Semantic Search:** AI-powered document retrieval using embeddings
- 💡 **Intelligent Answers:** LLM-generated responses with document citations
- 🚀 **Production Ready:** Full error handling, responsive design, optimized performance
- 🔐 **Secure:** Environment-based configuration, no hardcoded secrets
- 📱 **Mobile Friendly:** Works on desktop, tablet, and mobile devices

## 🛠️ Tech Stack

| Component | Technology |
|-----------|-----------|
| **Frontend** | React 18 + Tailwind CSS |
| **Backend** | Node.js + Express.js |
| **Database | Supabase (PostgreSQL + pgvector) |
| **Embeddings** | Xenova/all-MiniLM-L6-v2 (local, free) |
| **LLM** | Google Gemini 2.0 Flash / Gemini 2.0 Flash |
| **Hosting** | Vercel (frontend) + Render (backend) |

## 🏗️ Architecture

```
User Interface (React)
    ↓
    ├─→ Upload Document
    │    ↓
    │    Backend (Express)
    │    ↓
    │    Parse & Chunk Text
    │    ↓
    │    Generate Embeddings (Xenova - Local, Free)
    │    ↓
    │    Store in Supabase (pgvector)
    │
    └─→ Ask Question
         ↓
         Backend (Express)
         ↓
         Generate Question Embedding
         ↓
         Semantic Search (Supabase pgvector)
         ↓
         Retrieve Top 5 Similar Chunks
         ↓
         LLM (Gemini/Claude) - RAG
         ↓
         Generate Answer + Sources
         ↓
         Return to Frontend
```

## 🚀 Getting Started

### Prerequisites

- Node.js 16+ and npm
- Supabase account (free)
- Google Gemini API key (free) or Google Gemini API key

### Local Development

**1. Clone and Setup**

\`\`\`bash
git clone https://github.com/YOUR_USERNAME/faq-assistant.git
cd faq-assistant
\`\`\`

**2. Backend Setup**

\`\`\`bash
cd backend

# Copy environment template
cp .env.example .env

# Edit .env and add your keys
# SUPABASE_URL=https://...
# SUPABASE_KEY=...
# GEMINI_API_KEY=...

# Install dependencies
npm install

# Start server (it will download embedding model on first run - takes 1-2 min)
npm start
# Server runs on http://localhost:3000
\`\`\`

**3. Frontend Setup** (in new terminal)

\`\`\`bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm start
# Opens on http://localhost:3000
\`\`\`

**4. Test Locally**

- Open http://localhost:3000 in browser
- Upload a PDF, TXT, or Markdown file
- Ask a question about the content
- Get AI-generated answers!

## 📝 API Documentation

### Upload Document

**Endpoint:** `POST /api/documents/upload`

**Request:**
\`\`\`
Content-Type: multipart/form-data
Body: file (PDF, TXT, or MD)
\`\`\`

**Response:**
\`\`\`json
{
  "success": true,
  "fileName": "document.pdf",
  "chunksCreated": 45,
  "totalCharacters": 23500
}
\`\`\`

### Query Documents

**Endpoint:** `POST /api/query`

**Request:**
\`\`\`json
{
  "question": "What is the main topic?"
}
\`\`\`

**Response:**
\`\`\`json
{
  "answer": "The main topic is...",
  "sources": ["document.pdf"],
  "similarity_scores": [0.87]
}
\`\`\`

## 🌐 Deployment

### Deploy to Vercel (Frontend)

1. Push to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Import your repository
4. Set root directory to `frontend`
5. Add `REACT_APP_API_URL` environment variable
6. Deploy!

### Deploy to Render (Backend)

1. Go to [render.com](https://render.com)
2. Create new Web Service
3. Connect your GitHub repo
4. Set start command: `cd backend && node server.js`
5. Add environment variables (SUPABASE_URL, SUPABASE_KEY, GEMINI_API_KEY)
6. Deploy!

## 🔐 Environment Variables

**Backend (.env):**
\`\`\`env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_anon_public_key
GEMINI_API_KEY=your_gemini_key
NODE_ENV=production
PORT=3000
\`\`\`

**Frontend (.env.local):**
\`\`\`env
REACT_APP_API_URL=https://your-backend.onrender.com
\`\`\`

## 📊 How RAG Works

1. **Document Ingestion:**
   - User uploads document (PDF/TXT/MD)
   - Text is extracted and split into 500-char chunks
   - Each chunk is converted to a 1536-dimensional embedding vector

2. **Storage:**
   - Chunks and embeddings stored in Supabase vector database
   - Indexed for fast semantic search

3. **Query Processing:**
   - User asks a question
   - Question converted to embedding (same model)
   - Semantic search finds most similar chunks (cosine similarity)
   - Top 5 chunks retrieved with similarity scores

4. **Answer Generation:**
   - Retrieved chunks combined as context
   - Sent to LLM with user question and context
   - LLM generates answer based only on provided context
   - Answer returned with source citations

## 🚨 Troubleshooting

### Embedding model takes long to load
- First time startup: model downloads (~150MB) - takes 1-2 minutes
- Subsequent startups: instant (model is cached)

### CORS errors
- Make sure backend URL is correct in frontend `.env.local`
- Check that backend is running

### Supabase connection fails
- Verify `SUPABASE_URL` and `SUPABASE_KEY` in `.env`
- Check Supabase project is active
- Test connection string

### LLM API errors
- Check API key is correct and not expired
- Verify you have free credits available
- Check rate limits haven't been exceeded

## 💡 Future Improvements

- [ ] User authentication and workspaces
- [ ] Document version control and deletion
- [ ] Feedback loop to improve retrieval quality
- [ ] Chat history and conversation context
- [ ] Re-ranking for better retrieval accuracy
- [ ] Support for image OCR
- [ ] Admin dashboard with analytics
- [ ] Export answers to PDF
- [ ] Real-time collaborative editing
- [ ] Multiple language support

## 📈 Performance Metrics

- **Upload:** ~500ms per chunk (depends on file size)
- **Query:** ~2-3 seconds (embedding + search + LLM generation)
- **Throughput:** ~60 queries/minute on free tier
- **Accuracy:** 85-90% retrieval accuracy with proper context

## 🤝 Contributing

Contributions welcome! Please fork and create a pull request.

## 📄 License

MIT License - feel free to use this project for anything

## 👨‍💻 About

Built as a full-stack RAG system to demonstrate:
- Modern AI/LLM integration
- Vector databases and semantic search
- Full-stack JavaScript development
- Production deployment best practices

## 📧 Questions?

Open an issue or contact me!

---

**Built with ❤️ for better document Q&A**
```

- [ ] Replace placeholders with YOUR values:
  - [ ] Replace `your-vercel-url.vercel.app` with YOUR Vercel URL
  - [ ] Replace `your-render-url.onrender.com` with YOUR Render URL
  - [ ] Replace `YOUR_USERNAME` with YOUR GitHub username

**Step 3: Save and Push to GitHub**
- [ ] Save `README.md`
- [ ] Run:
  ```bash
  git add README.md
  git commit -m "Add comprehensive README"
  git push
  ```

**Professional README complete!** ✅
- [ ] Project title and description (1 line)
- [ ] Live demo link (Vercel URL)
- [ ] Screenshot/GIF of app in action
- [ ] Features list
- [ ] Tech stack
- [ ] Architecture diagram (ASCII or Mermaid)
- [ ] Getting started (clone, install, run)
- [ ] Environment variables setup
- [ ] API endpoints documentation
- [ ] Deployment instructions
- [ ] Future improvements
- [ ] License

**README Structure:**
```markdown
# AI FAQ Assistant with RAG

[Description]

## Live Demo
[Link to Vercel]

## Features
- [Feature 1]
- [Feature 2]
- ...

## Tech Stack
- Frontend: React
- Backend: Node.js + Express
- Database: Supabase + MongoDB
- LLM: Google Gemini API

## Getting Started
[Setup instructions]

## Architecture
[Diagram of flow]

## API Endpoints
[Document endpoints]

## Deployment
[How to deploy]

## Future Improvements
[What you'd add next]

## License
MIT
```

#### 6.2 Create Architecture Diagram
- [ ] Create ASCII diagram or Mermaid diagram showing:
  - [ ] Frontend → Backend flow
  - [ ] File upload → Embedding → Storage
  - [ ] Query → Retrieval → LLM → Response

Example:
```
User (React App)
    ↓ PDF/TXT Upload
Backend (Express)
    ↓ Parse & Chunk
Embeddings (Xenova)
    ↓ Store
Supabase (pgvector)
    ↓
User (React App)
    ↓ Question
Backend (Express)
    ↓ Embed & Retrieve
Supabase (pgvector)
    ↓ Similar chunks
Google Gemini API
    ↓ Generate answer
Backend (Express)
    ↓ Answer + Sources
User (React App)
```

#### 6.3 Add Screenshots
- [ ] Screenshot of upload interface
- [ ] Screenshot of query interface
- [ ] Screenshot of answer display with sources
- [ ] Screenshot of document list
- [ ] Save screenshots to `public/screenshots/` folder
- [ ] Add alt text to screenshots in README

#### 6.4 Write Setup Instructions
- [ ] Prerequisites (Node.js, Git, accounts)
- [ ] Clone repo
- [ ] Install dependencies
- [ ] Create `.env` files
- [ ] Configure Supabase
- [ ] Run backend: `npm start` (or commands)
- [ ] Run frontend: `npm start`
- [ ] Access at `http://localhost:3000`

#### 6.5 Document API Endpoints
- [ ] `POST /api/documents/upload`
  - [ ] Request: multipart file
  - [ ] Response: success, fileName, chunksCreated
- [ ] `GET /api/documents`
  - [ ] Response: array of documents with chunk counts
- [ ] `POST /api/query`
  - [ ] Request: question
  - [ ] Response: answer, sources, similarity_scores

#### 6.6 Add Comments & Docstrings
- [ ] Add JSDoc to React components
- [ ] Add comments to backend routes
- [ ] Document complex functions
- [ ] Explain embedding strategy
- [ ] Explain RAG pipeline

#### 6.7 Create .env.example Files
- **Backend `.env.example`:**
  ```
  GEMINI_API_KEY=your_key_here
  SUPABASE_URL=your_url_here
  SUPABASE_KEY=your_key_here
  NODE_ENV=development
  PORT=3000
  FRONTEND_URL=http://localhost:3000
  ```

- **Frontend `.env.local.example`:**
  ```
  REACT_APP_API_URL=http://localhost:3000
  ```

#### 6.8 Add Future Improvements Section
Ideas for what you'd add next (resume-friendly):
- [ ] Add PDF form filling support
- [ ] Implement document version control
- [ ] Add user authentication and workspaces
- [ ] Implement chat history
- [ ] Add document summarization
- [ ] Implement feedback loop to improve RAG
- [ ] Add support for image OCR
- [ ] Create admin dashboard with analytics
- [ ] Implement document deletion/editing
- [ ] Add re-ranking for better retrieval

#### 6.9 Code Comments for Interviews
- [ ] Add comments explaining RAG pipeline
- [ ] Document trade-offs (why Xenova for embeddings?)
- [ ] Explain chunk size choice (500 chars)
- [ ] Document similarity threshold decisions
- [ ] Explain error handling strategies

#### 6.10 Create DEPLOYMENT.md (Optional)
- [ ] Step-by-step Vercel deployment
- [ ] Step-by-step Render deployment
- [ ] Environment variables setup
- [ ] Troubleshooting common issues
- [ ] How to monitor production

### Deliverables
- ✅ Comprehensive README.md
- ✅ Screenshots showing features
- ✅ Setup and deployment instructions
- ✅ API documentation
- ✅ Architecture explained clearly
- ✅ Code well-commented
- ✅ Ready to show to companies

### Time Estimate: 2-3 hours

### Resume-Ready Checklist
- [ ] README is complete and professional
- [ ] Live demo link works
- [ ] Screenshots are clear
- [ ] Instructions are easy to follow
- [ ] All code is commented
- [ ] No secrets in any files
- [ ] GitHub repo looks professional
- [ ] Tech choices are explained

---

## 📊 Summary Timeline

| Phase | Duration | Deliverable |
|-------|----------|-------------|
| Phase 1: Setup | Days 1-2 | Supabase + Gemini API + GitHub ready |
| Phase 2: Backend | Days 2-4 | File upload & Gemini RAG query working |
| Phase 3: Frontend | Days 4-5 | React UI complete & connected |
| Phase 4: Testing | Days 5-6 | End-to-end tested, production-ready |
| Phase 5: Deployment | Days 6-7 | Live on Vercel + Render (Gemini working) |
| Phase 6: Docs | Day 7 | Professional README, interview-ready |
| **TOTAL** | **7-10 days** | **Complete Gemini-powered RAG app** |

---

## 🎯 Key Milestones

- **After Phase 1:** All services configured, database schema ready
- **After Phase 2:** Can upload files and retrieve answers via API (test with curl)
- **After Phase 3:** Full UI working locally, all features visible
- **After Phase 4:** No bugs, ready for production
- **After Phase 5:** Live and accessible to anyone
- **After Phase 6:** Ready to add to resume and show in interviews

---

## 📝 Interview Talking Points

After completing this project, be ready to discuss:

**"Tell me about this project"**
- Problem: Companies need to answer customer questions from documentation
- Solution: Built RAG system combining retrieval + generation
- Technical highlights: Vector embeddings, semantic search, LLM integration
- Challenges: Handling different file formats, optimizing retrieval quality

**"What would you do differently?"**
- Implement user authentication
- Add re-ranking for better results
- Create feedback loop to improve embeddings over time
- Build admin dashboard with analytics
- Support more file types (Excel, PowerPoint)

**"Tell me about the tech stack"**
- Frontend: React for UI, Tailwind for styling
- Backend: Express for API, Node.js runtime
- Embeddings: Xenova for free local embeddings (runs locally, no API calls)
- Vector DB: Supabase pgvector for semantic search
- LLM: Google Gemini 2.0 Flash for natural language generation (very fast, free tier)

**"What was the most challenging part?"**
- Optimizing retrieval to get relevant documents (semantic search tuning)
- Handling different file formats cleanly (PDF parsing is tricky)
- Balancing performance with free tier limits (Gemini 60 RPM)
- Ensuring answer accuracy (preventing hallucinations through prompt engineering)

---

## ✅ Final Checklist Before Showing to Companies

- [ ] Project on GitHub with meaningful commit history
- [ ] Live demo accessible (not just localhost)
- [ ] README is comprehensive and professional
- [ ] No bugs or broken features
- [ ] Mobile responsive
- [ ] Error handling works gracefully
- [ ] Code is clean and commented
- [ ] No API keys or secrets in code
- [ ] Performance is acceptable (< 5s response)
- [ ] Can explain every technical decision
- [ ] Project link on resume
- [ ] Ready to discuss in interviews

---

## 🚨 Common Issues & Solutions

### Issue: Free tier Render goes to sleep
**Solution:** Accept it for MVP, mention in README that production would use paid tier

### Issue: Google Gemini API runs out of free credits
**Solution:** Use Xenova embeddings (free, local) and don't spam queries during testing

### Issue: PDF parsing fails on complex PDFs
**Solution:** Add error message, ask user to upload simpler PDF or try PDF converter

### Issue: Embedding model is slow to load first time
**Solution:** Mention in README, it caches after first load

### Issue: Supabase free tier is slow
**Solution:** Acceptable for MVP, production would upgrade

---

## 🎓 Learning Outcomes

By the end of this project, you'll understand:

1. **RAG Pipeline:** How retrieval-augmented generation actually works
2. **Embeddings:** Vector representations and semantic search
3. **LLM Integration:** How to use Google Gemini API effectively
4. **Full-Stack Development:** Frontend + Backend + Database
5. **Deployment:** Getting code live on real platforms
6. **Production Thinking:** Error handling, performance, security
7. **Interview Prep:** How to talk about your work

---

## 📚 Resources

- [Supabase Vector Documentation](https://supabase.com/docs/guides/ai)
- [Google Gemini API Documentation](https://docs.anthropic.com)
- [Xenova Transformers](https://huggingface.co/docs/transformers.js)
- [Express.js Guide](https://expressjs.com/)
- [React Documentation](https://react.dev)
- [Vercel Deployment Guide](https://vercel.com/docs)
- [Render Deployment Guide](https://render.com/docs)

---

**Good luck! You've got this. 🚀**
