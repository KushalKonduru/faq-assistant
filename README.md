# AI FAQ Assistant with RAG

A production-ready Retrieval-Augmented Generation (RAG) web application that enables users to upload custom documents (PDF, TXT, Markdown) and ask natural-language questions to receive context-aware, cited answers powered by AI.

## 🏗️ Architecture & Tech Stack

- **Frontend:** React + Tailwind CSS
- **Backend:** Node.js + Express (ES Modules)
- **Vector Database:** Supabase (PostgreSQL with `pgvector`)
- **Embeddings:** `@xenova/transformers` (local, free embedding generation)
- **LLM:** Google Gemini 2.0 Flash (`@google/generative-ai`)

---

## 📁 Project Structure

```text
faq-assistant/
├── backend/
│   ├── .env                 # Local secrets (never committed)
│   ├── .env.example         # Environment template with placeholder keys
│   ├── .gitignore           # Backend-specific ignore rules
│   ├── package.json         # Backend manifest and scripts
│   ├── server.js            # Express server entry point
│   ├── routes/              # API route handlers
│   ├── middleware/          # Express middleware (e.g., error handling)
│   └── utils/               # Helper utilities (embeddings, parsing)
├── frontend/                # React client application (Phase 3)
├── .env.example             # Root environment variables reference
├── .gitignore               # Root git ignore rules
├── PROJECT_PHASES.md        # Comprehensive implementation roadmap
└── README.md                # Project documentation
```

---

## 🚀 Phase 1 Setup & Status

Phase 1 (Project Setup & Infrastructure) establishes the foundational directory structure, environment configurations, git tracking, and cloud service integration templates.

### Prerequisites
- Node.js (v18+ recommended)
- npm (v9+ recommended)
- Git

### Quickstart

1. **Clone or navigate to the repository:**
   ```bash
   cd faq-assistant
   ```

2. **Configure environment variables:**
   Copy the example environment file to `backend/.env`:
   ```bash
   cp backend/.env.example backend/.env
   ```
   Populate `backend/.env` with your Supabase URL, Supabase Anon Key, and Google Gemini API key.

3. **Next Steps:**
   Proceed to **Phase 2: Backend Development** to install dependencies and implement document ingestion and RAG querying.
