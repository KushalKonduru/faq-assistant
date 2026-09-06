# ContextSense - Document Intelligence with RAG

A production-ready, zero-cost Retrieval-Augmented Generation (RAG) system that enables users to upload custom documents (PDF, TXT, Markdown) and ask natural-language questions to receive context-aware, cited answers powered by AI.

🌐 **Live Web Application:** [https://contextsense.vercel.app](https://contextsense.vercel.app)

---

## 🌟 Key Features

- **Zero-Cost Local Embeddings ($0.00 API Bill):** Uses official `@huggingface/transformers` (`all-MiniLM-L6-v2`) to generate vector embeddings locally on CPU—100% private, zero third-party vector API bills, and zero rate limits.
- **High-Speed Free-Tier LLM:** Powered by Google Gemini (`gemini-3.5-flash-lite`) offering 1,500 free requests/day with multi-model automatic failover.
- **Supabase pgvector Database:** Stores 1536-dimensional vector embeddings in PostgreSQL using Supabase's `pgvector` extension for rapid sub-second cosine similarity retrieval.
- **Multi-Format Ingestion:** Seamlessly parses, normalizes, and chunks PDFs, GitHub-style Markdown, and plain text files up to 50MB.
- **Intelligent Sliding-Window Chunking:** Dynamically splits large documents into 500-character segments with 50-character sliding overlaps to preserve semantic context across sentence boundaries.
- **Dynamic Chunk-Derived Starter Questions:** Automatically extracts 5 to 6 specific, natural questions grounded strictly in your document chunks (zero preset dummy questions), with an on-demand **Regenerate** button.
- **Multi-Document Citations:** Simultaneously queries all indexed documents and attributes answers to contributing files via interactive "Sources Cited" badges with similarity percentage scores.
- **Modern Interactive UI:** Features an ambient React Bits `<Silk />` WebGL shimmering backdrop on the landing page, collapsible sidebar, real-time backend health monitor, and full document CRUD.
- **Native Browser History Navigation:** Built with the HTML5 History API (`pushState`, `popstate`), ensuring browser Back/Forward buttons and swipe gestures transition seamlessly between `/` and `/chat`.

---

## 🏗️ Architecture & Data Flow

```text
[User Document (PDF / TXT / MD)]
            │
            ▼
    [File Parser & Chunker] ── (500 chars / 50 overlap)
            │
            ▼
 [Local Embeddings (Hugging Face)] ── (384d padded to 1536d)
            │
            ▼
 [Supabase pgvector (documents table)]
            │
[User Question] ──► [Query Embedding]
            │               │
            └───────────────┼──────────────────────────┐
                            ▼                          ▼
                [Cosine Similarity Search]   [Gemini Starter Prompts]
                            │                          │
                            ▼                          ▼
               [Multi-Chunk Context Excerpts]   [5-6 Tailored Questions]
                            │
                            ▼
               [Google Gemini 3.5 Flash Lite]
                            │
                            ▼
          [Cited Markdown Response + Source Badges]
```

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | React 18, Tailwind CSS, Vite | Responsive UI with collapsible layout & chat workspace |
| **WebGL Visuals** | Three.js, React Three Fiber | Shimmering ambient Silk shader on landing page hero |
| **Navigation** | HTML5 History API (`pushState`/`popstate`) | Seamless browser back/forward gestures without page reloads |
| **Backend** | Node.js (ES Modules), Express | High-performance RESTful API service |
| **Vector DB** | Supabase (PostgreSQL + `pgvector`) | Cloud vector storage & cosine similarity matching |
| **Embeddings** | `@huggingface/transformers` | Local, free sentence embeddings (`all-MiniLM-L6-v2`) |
| **LLM** | Google Gemini (`gemini-3.5-flash-lite`) | High-speed, context-grounded answer & question synthesis |
| **File Processing** | `multer`, `pdf-parse` | In-memory multipart upload handling and PDF extraction |

---

## 📁 Project Structure

```text
contextsense/
├── backend/
│   ├── middleware/
│   │   └── errorHandler.js      # Centralized error handler (masks stack in prod)
│   ├── routes/
│   │   ├── documents.js         # Upload, list, delete & prompt generation routes
│   │   └── query.js             # Semantic search & RAG query route
│   ├── utils/
│   │   ├── chunking.js          # Text segmentation with sliding overlap
│   │   ├── embedding.js         # Local transformer embedding generator
│   │   ├── fileParser.js        # Multi-format document parser
│   │   └── gemini.js            # Gemini model orchestration & failover
│   ├── .env.example             # Template for backend environment variables
│   ├── .gitignore               # Backend git ignore rules
│   ├── package.json             # Backend dependencies and scripts
│   └── server.js                # Express application entry point
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ChatInterface.jsx   # Chatbot Q&A workspace & citation renderer
│   │   │   ├── DocumentList.jsx    # Knowledge base documents list & deletion
│   │   │   ├── DocumentUpload.jsx  # Drag-and-drop document upload zone
│   │   │   ├── LandingPage.jsx     # Modern landing page with Silk backdrop
│   │   │   └── Silk.jsx            # React Bits WebGL custom shader component
│   │   ├── services/
│   │   │   └── api.js              # Centralized Axios API client
│   │   ├── App.jsx                 # Top-level view router & history manager
│   │   ├── main.jsx                # React DOM entry point
│   │   └── index.css               # Tailwind CSS styles & animations
│   ├── vercel.json                 # SPA rewrite rules for deep linking (/chat)
│   ├── vite.config.js              # Vite bundler & Three.js chunking config
│   ├── package.json                # Frontend dependencies and scripts
│   └── index.html                  # HTML entry with ContextSense metadata
├── PROJECT_PHASES.md               # Comprehensive development roadmap & checkpoints
└── README.md                       # Project documentation
```

---

## 📡 API Reference

### 1. Health Check
Verifies that the backend service and database are operational.
- **Method:** `GET`
- **Endpoint:** `/api/health`
- **Response:**
  ```json
  {
    "status": "Server is running",
    "environment": "development",
    "timestamp": "2026-09-06T07:00:00.000Z"
  }
  ```

---

### 2. List Indexed Documents
Retrieves all unique documents currently stored in Supabase with chunk counts and timestamps.
- **Method:** `GET`
- **Endpoint:** `/api/documents`
- **Response:**
  ```json
  {
    "documents": [
      {
        "title": "Employee_Handbook.pdf",
        "chunks_count": 24,
        "created_at": "2026-09-06T06:15:00.000Z"
      }
    ]
  }
  ```

---

### 3. Upload & Ingest Document
Uploads a document, extracts text in-memory, chunks it, generates vector embeddings locally, and inserts them into Supabase.
- **Method:** `POST`
- **Endpoint:** `/api/documents/upload`
- **Content-Type:** `multipart/form-data`
- **Body Field:** `file` (Supports `.pdf`, `.txt`, `.md`, max 50MB)
- **Response:**
  ```json
  {
    "success": true,
    "fileName": "Employee_Handbook.pdf",
    "fileType": "application/pdf",
    "totalCharacters": 12450,
    "chunksCreated": 24,
    "message": "Processed 24 chunks from 24 created"
  }
  ```

---

### 4. Generate Starter Questions
Formulates 5 to 6 natural questions directly from the document's indexed chunks using Gemini.
- **Method:** `POST`
- **Endpoint:** `/api/documents/generate-prompts`
- **Content-Type:** `application/json`
- **Body:**
  ```json
  {
    "title": "Employee_Handbook.pdf"
  }
  ```
- **Response:**
  ```json
  {
    "prompts": [
      "What is the remote work equipment stipend policy?",
      "How do employees submit quarterly expense receipts?",
      "What are the core working hours for distributed teams?"
    ]
  }
  ```

---

### 5. Query Knowledge Base (RAG)
Takes a user question, embeds it locally, queries Supabase for the most relevant document chunks via cosine similarity, and synthesizes a grounded answer with citations.
- **Method:** `POST`
- **Endpoint:** `/api/query`
- **Content-Type:** `application/json`
- **Body:**
  ```json
  {
    "question": "What is our policy on remote work equipment reimbursement?",
    "match_threshold": 0.3,
    "match_count": 5
  }
  ```
- **Response:**
  ```json
  {
    "answer": "According to the company policy guidelines, full-time remote employees are entitled to a $500 one-time home office setup stipend...",
    "sources": ["Employee_Handbook.pdf"],
    "similarity_scores": [0.892]
  }
  ```

---

### 6. Delete Document
Deletes all chunks associated with a specific document title from Supabase.
- **Method:** `DELETE`
- **Endpoint:** `/api/documents/:title`
- **Response:**
  ```json
  {
    "success": true,
    "message": "Successfully deleted document \"Employee_Handbook.pdf\" and its 24 chunk(s)",
    "deletedChunks": 24
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

### 2. Configure Environment Variables
Copy the example environment template into `backend/.env`:
```bash
cp backend/.env.example backend/.env
```

Open `backend/.env` and supply your credentials:
```env
# Google Gemini API Key (https://aistudio.google.com/app/apikeys)
GEMINI_API_KEY=your_actual_gemini_api_key
GEMINI_MODEL=gemini-3.5-flash-lite

# Supabase Credentials (Project Settings -> API)
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_KEY=your_actual_anon_public_key

# Server Configuration
PORT=3000
NODE_ENV=development
```

---

### 3. Setup Database Schema (Supabase)
In your Supabase project's **SQL Editor**, run the following schema script:

```sql
-- 1. Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Create documents table
CREATE TABLE IF NOT EXISTS documents (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  embedding VECTOR(1536),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create semantic similarity search function
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
    1 - (documents.embedding <=> query_embedding) AS similarity
  FROM documents
  WHERE 1 - (documents.embedding <=> query_embedding) > match_threshold
  ORDER BY documents.embedding <=> query_embedding
  LIMIT match_count;
END;
$$ LANGUAGE plpgsql;
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
