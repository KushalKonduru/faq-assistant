# AI FAQ Assistant with RAG

A production-ready Retrieval-Augmented Generation (RAG) system that enables users to upload custom documents (PDF, TXT, Markdown) and ask natural-language questions to receive context-aware, cited answers powered by AI.

---

## 🌟 Key Features

- **Multi-Format Document Parsing:** Automatically extracts clean text from PDFs, Markdown, and plain text files.
- **Intelligent Text Chunking:** Dynamically splits large documents into semantic chunks with configurable sliding window overlap.
- **Free, Local Vector Embeddings:** Uses `@xenova/transformers` (`all-MiniLM-L6-v2`) to generate embeddings locally on CPU—100% private, zero external API costs, and zero rate limits.
- **Vector Database Search:** Stores vector embeddings in PostgreSQL using Supabase's `pgvector` extension for rapid cosine similarity retrieval.
- **AI Synthesis with Citations:** Uses Google Gemini to generate clear, concise answers strictly grounded in retrieved document context, complete with document citations.
- **Robust REST API:** Built with Node.js and Express (ES Modules), complete with input validation, memory-efficient multipart uploads, and centralized error handling.

---

## 🏗️ Architecture & Data Flow

```text
[User Document (PDF/TXT/MD)]
            │
            ▼
    [File Parser & Chunker]
            │
            ▼
 [Local Embeddings (Xenova)] ───► [Supabase pgvector (documents)]
                                                 │
[User Question] ──► [Query Embedding] ──────────┤
                                                 ▼
                                     [Cosine Similarity Search]
                                                 │
                                                 ▼
                                     [Context + Prompt Assembly]
                                                 │
                                                 ▼
                                      [Google Gemini Flash]
                                                 │
                                                 ▼
                                     [Cited AI Answer Response]
```

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | React, Tailwind CSS | Modern interactive web interface (Phase 3) |
| **Backend** | Node.js, Express (ES Modules) | High-performance RESTful API service |
| **Vector DB** | Supabase (PostgreSQL + `pgvector`) | Cloud vector storage & similarity search |
| **Embeddings** | `@xenova/transformers` | Local, free sentence embeddings (`all-MiniLM-L6-v2`) |
| **LLM** | Google Gemini (`@google/generative-ai`) | High-speed, context-grounded answer generation |
| **File Processing** | `multer`, `pdf-parse` | Multipart upload stream and PDF text extraction |

---

## 📁 Project Structure

```text
faq-assistant/
├── backend/
│   ├── middleware/
│   │   └── errorHandler.js      # Centralized error handler
│   ├── routes/
│   │   ├── documents.js         # Document upload & ingestion endpoint
│   │   └── query.js             # Semantic search & RAG query endpoint
│   ├── utils/
│   │   ├── chunking.js          # Text segmentation with overlap
│   │   ├── embedding.js         # Local transformer embedding generator
│   │   ├── fileParser.js        # Multi-format document parser
│   │   └── gemini.js            # Google Gemini client & prompt builder
│   ├── .env.example             # Template for required environment variables
│   ├── .gitignore               # Backend git ignore rules
│   ├── package.json             # Backend dependencies and scripts
│   └── server.js                # Express application entry point
├── frontend/                    # React client workspace (Phase 3)
├── .env.example                 # Root environment variables blueprint
├── .gitignore                   # Root git ignore rules
├── PROJECT_PHASES.md            # Comprehensive project development roadmap
└── README.md                    # Project documentation
```

---

## 📡 API Reference

### 1. Health Check
Checks if the backend service is online.

- **Method:** `GET`
- **Endpoint:** `/api/health`
- **Response:**
  ```json
  {
    "status": "Server is running",
    "environment": "development"
  }
  ```

---

### 2. Upload & Ingest Document
Uploads a document, extracts text, chunks it, generates vector embeddings, and stores it in Supabase.

- **Method:** `POST`
- **Endpoint:** `/api/documents/upload`
- **Content-Type:** `multipart/form-data`
- **Body Field:** `file` (Supports `.pdf`, `.txt`, `.md`, max 50MB)
- **Response:**
  ```json
  {
    "success": true,
    "fileName": "company_policy.pdf",
    "fileType": "application/pdf",
    "totalCharacters": 4820,
    "chunksCreated": 11,
    "message": "Processed 11 chunks from 11 created"
  }
  ```

---

### 3. Query Knowledge Base (RAG)
Takes a user question, embeds it, queries Supabase for the most relevant document chunks, and asks Gemini to generate an answer.

- **Method:** `POST`
- **Endpoint:** `/api/query`
- **Content-Type:** `application/json`
- **Body:**
  ```json
  {
    "question": "What is the return policy for electronic items?",
    "match_threshold": 0.3,
    "match_count": 5
  }
  ```
- **Response:**
  ```json
  {
    "answer": "According to company policy, electronic items can be returned within 30 days of purchase...",
    "sources": ["company_policy.pdf"],
    "similarity_scores": [0.684]
  }
  ```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **Supabase Account**: Free account at [supabase.com](https://supabase.com)
- **Google AI Studio API Key**: Free key at [aistudio.google.com](https://aistudio.google.com/app/apikeys)

### 1. Clone & Setup Repository
```bash
git clone https://github.com/KushalKonduru/faq-assistant.git
cd faq-assistant
```

### 2. Configure Environment Variables
Copy the example environment file into `backend/.env`:
```bash
cp backend/.env.example backend/.env
```
Open `backend/.env` and supply your credentials:
```env
# Gemini API Key (Google AI Studio)
GEMINI_API_KEY=your_actual_gemini_api_key

# Supabase Credentials (Project Settings -> API)
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_KEY=your_actual_anon_public_key

# Server Configuration
PORT=3000
NODE_ENV=development
```

### 3. Database Schema Setup (Supabase)
In your Supabase project's **SQL Editor**, execute:

```sql
-- 1. Enable pgvector
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

-- 3. Create semantic search function
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


### 4. Install & Run Backend
```bash
cd backend
npm install
npm run dev
```
The server will start on `http://localhost:3000`.

