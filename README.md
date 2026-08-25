# PTTC Chinese Course Consultation AI Chatbot (RAG)

An AI-powered consultation chatbot for the Chinese Language Program (HSK 1 – HSK 3) at Posts and Telecommunications Training Center (PTTC - PTIT). Built using a modern **Retrieval-Augmented Generation (RAG)** architecture with **Next.js 14**, **FastAPI**, and **Pinecone Vector Database**.

---

## Architecture & Tech Stack

- **Frontend:** Next.js 14 (App Router), TailwindCSS, Lucide Icons, React Markdown (Real-time SSE streaming).
- **Backend:** FastAPI (Python 3.12), SQLAlchemy, Pydantic, HTTPX.
- **Knowledge Base & RAG:** 
  - Source data exclusively loaded from `docs/QA.json` (50 official Q&A items for PTTC Chinese courses).
  - Embeddings: `sentence-transformers/all-MiniLM-L6-v2` (384 dimensions).
  - Vector Database: **Pinecone Serverless** (with local FAISS in-memory fallback).
- **LLM Provider:** OpenAI-compatible API endpoint with SSE token streaming support.

---

## Project Structure

```
PTTC/
├── backend/
│   ├── config.py              # Application settings & environment variables
│   ├── ingestion.py           # Loads and processes QA.json into knowledge chunks
│   ├── main.py                # FastAPI app entrypoint & API routes
│   ├── models.py              # SQLAlchemy database models (Sessions, Messages, Leads)
│   ├── rag_service.py         # LLM streaming & RAG prompt orchestration
│   ├── vector_store.py        # Pinecone / FAISS vector indexing and semantic search
│   ├── requirements.txt       # Python dependencies
│   ├── .env                   # Environment variables (excluded from Git)
│   └── .env.example           # Environment variables template
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx     # Root layout
│   │   │   ├── page.tsx       # Main Chatbot UI interface
│   │   │   └── globals.css    # Tailwind styling
│   │   └── components/
│   │       ├── SourceCitations.tsx # Citation & reference viewer
│   │       └── LeadModal.tsx       # Consultation registration modal
│   ├── package.json
│   ├── tailwind.config.js
│   └── tsconfig.json
├── docs/
│   └── QA.json                # Knowledge base (50 Chinese course Q&As)
└── README.md
```

---

## Getting Started

### 1. Prerequisites
- **Node.js**: v18+ (tested on v22)
- **Python**: 3.10+ (tested on 3.12)
- **Pinecone Account & API Key**

---

### 2. Backend Setup

1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```

2. Install the required Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Create and configure your `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```
   Fill in your configuration:
   ```ini
   LLM_BASE_URL=http://your-llm-endpoint/v1
   LLM_API_KEY=your_llm_api_key
   LLM_MODEL=gemini-3-flash

   PINECONE_API_KEY=your_pinecone_api_key
   PINECONE_INDEX_NAME=pttc-chinese

   DATABASE_URL=sqlite:///./pttc_chatbot.db
   EMBEDDING_MODEL=all-MiniLM-L6-v2
   EMBEDDING_DIM=384
   ```

4. Start the FastAPI server:
   ```bash
   python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
   ```
   The backend will be available at `http://127.0.0.1:8000`.  
   Interactive API docs (Swagger): `http://127.0.0.1:8000/docs`.

---

### 3. Frontend Setup

1. Open a new terminal and navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the Next.js development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser to interact with the chatbot.

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Health check and system status |
| `POST` | `/api/chat` | Main SSE streaming chat endpoint with RAG context retrieval |
| `GET` | `/api/history/{session_id}` | Retrieve chat message history for a given session |
| `POST` | `/api/leads` | Submit student consultation registration |
| `GET` | `/api/leads` | List all submitted consultation leads |
