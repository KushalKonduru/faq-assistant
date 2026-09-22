# ContextSense — Intelligent Document RAG Assistant

<p align="center">
  <img src="https://img.shields.io/badge/React_18-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React 18" />
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express" />
  <img src="https://img.shields.io/badge/Supabase_pgvector-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase pgvector" />
  <img src="https://img.shields.io/badge/Google_Gemini-8E75B2?style=for-the-badge&logo=googlegemini&logoColor=white" alt="Google Gemini" />
  <img src="https://img.shields.io/badge/Hugging_Face-FFD21E?style=for-the-badge&logo=huggingface&logoColor=black" alt="Hugging Face" />
  <img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
</p>

A production-grade, privacy-first **Retrieval-Augmented Generation (RAG)** assistant that allows users to upload custom documents (PDF, TXT, Markdown) and ask natural-language questions to receive context-grounded, cited answers with dynamic follow-up suggestions—operating completely on a **$0.00 free-tier budget**.

---

## 🌟 Key Highlights

- **$0.00 Local Vector Embeddings:** Uses `@huggingface/transformers` (`all-MiniLM-L6-v2`) via ONNX Runtime directly on CPU—100% private, zero external vector API charges, zero rate limits.
- **Dynamic Smart Suggestions:** When a suggested question is clicked or submitted, it is immediately removed from the suggestions bar so it never lingers. Gemini dynamically generates 2–3 contextual follow-up questions to replenish suggestions in real-time, deduplicated against already asked questions.
- **Ephemeral Privacy Vault & Zero-Leak Sessions:** Uses `sessionStorage` for cryptographic session isolation. Closing the browser or tab immediately destroys the session key. Reopening the browser always starts a fresh, empty workspace with zero trace of prior documents.
- **Automated Database Privacy Purge (TTL):** A background task runs on server boot and every 15 minutes, permanently deleting document chunks older than 1 hour from Supabase (`DELETE FROM documents WHERE created_at < NOW() - INTERVAL '1 hour'`).
- **Instant Manual Destruction:** Users can click the trash icon next to any document or click **"New Session"** to immediately purge documents and vector embeddings from Supabase on demand.
- **Supabase pgvector Search:** Stores 1536-dimensional vector embeddings in PostgreSQL with pgvector cosine similarity matching (`1 - (embedding <=> query_embedding)`).
- **Hardened Security & SQL Injection Immunity:** All queries use parameterized Supabase RPC calls with hardened `search_path = public` and Row-Level Security (RLS) restricted to `service_role`.
- **Multi-Document Citations:** Simultaneously queries all indexed documents and attributes answers to contributing files via interactive "Sources Cited" badges with similarity match percentages.
- **Modern Interactive UI:** Features a custom WebGL shimmering `<Silk />` backdrop shader on the landing page, collapsible sidebar, real-time backend health monitor, and full document CRUD.
- **Native Browser History Navigation:** Synchronized with the HTML5 History API (`pushState`, `popstate`), allowing browser Back/Forward buttons and swipe gestures to smoothly transition between `/` and `/chat`.

---

## 🏗️ Architecture & Data Flow

```text
  [ User Document (PDF / TXT / MD) ]
                 │
                 ▼
      [ In-Memory File Parser ]
                 │
                 ▼
   [ Sliding-Window Chunker ]  ──► (500 chars / 50 overlap)
                 │
                 ▼
  [ Local ONNX Transformer Embedder ] ──► (all-MiniLM-L6-v2, 384d padded to 1536d)
                 │
                 ▼
   [ Supabase pgvector Database ] ──► (documents table + session_id isolation)
                 │
                 ├──────────────────────────────────────────────────────┐
                 │                                                      │
                 ▼                                                      ▼
    [ Semantic Cosine Search ]                               [ Gemini Starter Prompts ]
                 │                                                      │
                 ▼                                                      ▼
  [ Multi-Chunk Context Assembly ]                             [ 5-6 Tailored Questions ]
                 │
                 ▼
   [ Google Gemini 2.5 / 3.5 Flash ]
                 │
                 ▼
  [ Structured Answer + Sources Cited + Contextual Follow-Up Suggestions ]
```

---

## 🔒 Privacy & Security Model

ContextSense is engineered with privacy as a foundational principle:

| Security Layer | Implementation Detail | Guarantee |
| :--- | :--- | :--- |
| **Client Session Storage** | Browser `sessionStorage` (cryptographic UUID v4) | Session destroyed when browser tab/window closes; zero persistence across browser restarts. |
| **Vector Isolation** | `session_id` scoped filtering in Supabase `match_documents` | Users cannot search or retrieve chunks from other users' workspaces. |
| **Instant Wipeout** | `DELETE /api/documents/:title` and `DELETE /api/documents/session/clear` | Permanent, immediate deletion of document chunks and embeddings from Supabase on user action. |
| **Automated Purge (TTL)** | Periodic cron-like job running every 15 minutes | Documents older than 1 hour are automatically deleted from database. |
| **SQL Injection Defense** | Parameterized queries + PostgreSQL stored procedure | Zero string-interpolated SQL statements; immune to SQL injection. |
| **Schema Hardening** | `SECURITY DEFINER` + `SET search_path = public` | Prevents search_path hijacking attacks on database functions. |
| **Row-Level Security** | Supabase RLS enabled on `documents` table | Direct table access locked down; operations restricted to backend `service_role`. |

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | React 18, Vite, Tailwind CSS | Responsive UI with collapsible layout, suggestion pills, and chat workspace |
| **WebGL Visuals** | Three.js, React Three Fiber | Ambient shimmering Silk shader on landing page hero |
| **Navigation** | HTML5 History API (`pushState` / `popstate`) | Clean browser history integration without page reloads |
| **Backend** | Node.js (ES Modules), Express | RESTful API service with centralized error handling |
| **Vector Database** | Supabase (PostgreSQL + `pgvector`) | Vector indexing, session-scoped retrieval, and cosine similarity matching |
| **Local Embeddings** | `@huggingface/transformers` | Zero-cost sentence embeddings (`all-MiniLM-L6-v2`) running via ONNX Runtime |
| **LLM Synthesis** | Google Gemini API (`gemini-3.5-flash-lite`) | Answer synthesis with citation grounding & dynamic follow-up question generation |
| **Document Parsing** | `multer`, `pdf-parse` | In-memory multipart handling and text extraction for PDF, TXT, and MD |

---

## 📁 Project Structure

```text
faq-assistant/
├── backend/
│   ├── middleware/
│   │   └── errorHandler.js      # Centralized error handler with production error masking
│   ├── routes/
│   │   ├── documents.js         # Upload, list, delete, clear session, & prompt generation
│   │   └── query.js             # Semantic search & RAG answer synthesis with follow-ups
│   ├── utils/
│   │   ├── chunking.js          # Sliding-window segmentation (500 chars / 50 overlap)
│   │   ├── embedding.js         # Local transformer embedder via ONNX Runtime
│   │   ├── fileParser.js        # Multi-format document parser (PDF, TXT, MD)
│   │   └── gemini.js            # Gemini orchestration with multi-model failover & follow-up parsing
│   ├── .env.example             # Backend environment variables template
│   ├── package.json             # Backend dependencies and startup scripts
│   └── server.js                # Express entry point & automated 15-min privacy purge
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ChatInterface.jsx   # Interactive chat workspace, suggestion pills, & citations
│   │   │   ├── DocumentList.jsx    # Knowledge base documents list & deletion controls
│   │   │   ├── DocumentUpload.jsx  # Drag-and-drop document upload zone
│   │   │   ├── LandingPage.jsx     # Modern landing page with Silk shader backdrop
│   │   │   └── Silk.jsx            # WebGL custom shader component
│   │   ├── services/
│   │   │   └── api.js              # Axios client with automated session header injection
│   │   ├── utils/
│   │   │   └── session.js          # sessionStorage manager & legacy storage cleanup
│   │   ├── App.jsx                 # View router, suggestion replenishment, & history sync
│   │   ├── main.jsx                # React DOM entry point
│   │   └── index.css               # Tailwind CSS styles & animations
│   ├── vercel.json                 # SPA rewrite rules for direct routing (/chat)
│   ├── vite.config.js              # Vite build config with Three.js manual code splitting
│   ├── package.json                # Frontend dependencies and build scripts
│   └── index.html                  # HTML entry with ContextSense metadata
└── README.md                       # Comprehensive project documentation
```

---

## 📡 API Reference

### 1. Health Check
Verifies backend service availability and status.
- **Method:** `GET`
- **Endpoint:** `/api/health`
- **Response:**
  ```json
  {
    "status": "Server is running",
    "environment": "development",
    "timestamp": "2026-09-22T04:15:00.000Z"
  }
  ```

---

### 2. List Active Session Documents
Retrieves all unique documents belonging to the requesting browser session.
- **Method:** `GET`
- **Endpoint:** `/api/documents`
- **Headers:** `x-session-id: sess_<uuid>`
- **Response:**
  ```json
  {
    "documents": [
      {
        "title": "System_Architecture_Guide.pdf",
        "chunks_count": 18,
        "created_at": "2026-09-22T04:10:00.000Z"
      }
    ]
  }
  ```

---

### 3. Upload & Ingest Document
Uploads a document, extracts text in-memory, chunks it with sliding overlap, generates embeddings locally, and stores them in Supabase tagged with the session ID.
- **Method:** `POST`
- **Endpoint:** `/api/documents/upload`
- **Headers:** `x-session-id: sess_<uuid>`
- **Content-Type:** `multipart/form-data`
- **Body Field:** `file` (Supports `.pdf`, `.txt`, `.md`, max 50MB)
- **Response:**
  ```json
  {
    "success": true,
    "fileName": "System_Architecture_Guide.pdf",
    "fileType": "application/pdf",
    "totalCharacters": 14200,
    "chunksCreated": 18,
    "message": "Processed 18 chunks from 18 created"
  }
  ```

---

### 4. Generate Starter Questions
Extracts 5 to 6 questions directly from indexed document chunks using Gemini.
- **Method:** `POST`
- **Endpoint:** `/api/documents/generate-prompts`
- **Headers:** `x-session-id: sess_<uuid>`
- **Body:**
  ```json
  {
    "title": "System_Architecture_Guide.pdf"
  }
  ```
- **Response:**
  ```json
  {
    "prompts": [
      "What are the primary microservices mentioned in the guide?",
      "How is session authentication handled between services?",
      "What is the failover strategy for the database cluster?"
    ]
  }
  ```

---

### 5. Query Knowledge Base (RAG)
Generates vector embedding for the question, performs cosine similarity retrieval on Supabase for the active session, synthesizes a cited answer, and supplies 2–3 contextual follow-up questions.
- **Method:** `POST`
- **Endpoint:** `/api/query`
- **Headers:** `x-session-id: sess_<uuid>`
- **Body:**
  ```json
  {
    "question": "How does the caching layer work?",
    "match_threshold": 0.3,
    "match_count": 5
  }
  ```
- **Response:**
  ```json
  {
    "answer": "- **Caching Layer:** The system uses Redis for in-memory session caching.\n- **TTL Configuration:** Keys expire after 30 minutes of inactivity.",
    "follow_up_questions": [
      "What happens when the Redis cache experiences a cache miss?",
      "How is cache invalidation handled on document updates?"
    ],
    "sources": ["System_Architecture_Guide.pdf"],
    "similarity_scores": [0.884]
  }
  ```

---

### 6. Delete Document
Permanently removes all chunks and vector embeddings for a document from Supabase.
- **Method:** `DELETE`
- **Endpoint:** `/api/documents/:title`
- **Headers:** `x-session-id: sess_<uuid>`
- **Response:**
  ```json
  {
    "success": true,
    "message": "Successfully deleted document \"System_Architecture_Guide.pdf\" and its 18 chunk(s)",
    "deletedChunks": 18
  }
  ```

---

### 7. Clear Active Session Workspace
Immediately wipes all document chunks and embeddings associated with the active session from Supabase.
- **Method:** `DELETE`
- **Endpoint:** `/api/documents/session/clear`
- **Headers:** `x-session-id: sess_<uuid>`
- **Response:**
  ```json
  {
    "success": true,
    "message": "Cleared 18 document chunk(s) from session",
    "deletedChunks": 18
  }
  ```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **Supabase Account**: Free tier at [supabase.com](https://supabase.com)
- **Google AI Studio API Key**: Free tier at [aistudio.google.com](https://aistudio.google.com/app/apikeys)

---

### 1. Clone the Repository
```bash
git clone https://github.com/KushalKonduru/faq-assistant.git contextsense
cd contextsense
```

---

### 2. Configure Backend Environment
Copy the example environment template into `backend/.env`:
```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` with your credentials:
```env
# Google Gemini API Key (https://aistudio.google.com/app/apikeys)
GEMINI_API_KEY=your_actual_gemini_api_key
GEMINI_MODEL=gemini-3.5-flash-lite

# Supabase Credentials (Project Settings -> API)
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_KEY=your_actual_service_role_or_anon_key

# Server Configuration
PORT=3000
NODE_ENV=development
```

---

### 3. Database Setup (Supabase SQL Editor)
Run the following SQL in your Supabase project's **SQL Editor**:

```sql
-- 1. Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Create documents table with session_id support
CREATE TABLE IF NOT EXISTS documents (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  embedding VECTOR(1536),
  session_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create index for fast session-based lookups and purges
CREATE INDEX IF NOT EXISTS idx_documents_session_id ON documents(session_id);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- 5. Create secure match_documents stored procedure
CREATE OR REPLACE FUNCTION match_documents(
  query_embedding vector(1536),
  match_threshold double precision,
  match_count integer,
  filter_session_id text DEFAULT NULL
)
RETURNS TABLE (
  id bigint,
  title text,
  content text,
  similarity double precision
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    documents.id,
    documents.title,
    documents.content,
    1 - (documents.embedding <=> query_embedding) AS similarity
  FROM documents
  WHERE 1 - (documents.embedding <=> query_embedding) > match_threshold
    AND (filter_session_id IS NULL OR documents.session_id = filter_session_id)
  ORDER BY documents.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- 6. Lock down execution permissions to service_role
REVOKE EXECUTE ON FUNCTION match_documents FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION match_documents TO service_role;
```

---

### 4. Run the Application Locally

#### Start Backend:
```bash
cd backend
npm install
npm run dev
```
Backend runs on `http://localhost:3000`.

#### Start Frontend:
In a separate terminal:
```bash
cd frontend
npm install
npm run dev
```
Frontend runs on `http://localhost:5173`.

---

## 🧪 Production Verification

Test the complete build locally before deployment:

```bash
# Build frontend for production
cd frontend
npm run build
```

The build should compile cleanly without any JSX or bundler errors.

---

## 📜 License

This project is licensed under the MIT License — see the LICENSE file for details.
