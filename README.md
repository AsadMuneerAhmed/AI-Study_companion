# AI Study Companion

An AI-powered study assistant that helps students learn from their own course material. Students upload lecture notes, slides, or past papers, and the app turns them into a searchable knowledge base. Students can then search their notes, get a summary, practice with quiz questions, or get exam-style questions for any topic.

Answers are generated only from the uploaded material (Retrieval-Augmented Generation, RAG), so they stay relevant to the student's course.

## Features

- **Upload** PDF, PPTX, DOCX, and TXT files, and label each one as `notes` or `past_paper`.
- **Semantic search** over the knowledge base, with a relevance threshold. If nothing relevant is found, the app says so.
- **Study plan** for a topic: summary, key points, and study steps.
- **Ask Your Notes** with four tabs:
  - **Search:** relevant passages from the notes.
  - **Summary:** a short summary of a topic.
  - **Quiz:** 5 multiple-choice questions (4 options each).
  - **Past Papers:** short and long exam-style questions.
- **Intent router:** the agent decides whether a request is a search, summary, quiz, past paper, or unclear question.
- **Fallback:** if a topic is not in the notes, the app returns a clear message instead of guessing.

## Architecture

```
Upload file -> extract text -> chunk text -> embed chunks -> store in Qdrant Cloud
                                                                   |
Student request -> intent router (Groq LLM) -> semantic search (Qdrant) -> LLM answer
```

- **Knowledge base:** each chunk is stored in Qdrant with its text, `source_file`, `doc_type`, and `chunk_id`.
- **Search:** the query is embedded and matched using cosine similarity. Results below a score of 0.4 are dropped. An optional `doc_type` filter limits search to notes or past papers.
- **Agent:** a Groq LLM classifies the request into one intent, extracts the topic, retrieves matching chunks, and generates the answer. Quiz and past paper output is returned as JSON.

## Tech stack

| Layer | Technology |
|---|---|
| Backend | Python, FastAPI, Uvicorn |
| Frontend | Next.js (App Router), React, TypeScript |
| Vector database | Qdrant Cloud |
| Embeddings | sentence-transformers, `all-MiniLM-L6-v2` (384 dimensions) |
| LLM | Groq API, `openai/gpt-oss-120b` |
| File parsing | pypdf, python-docx, python-pptx |

## Project structure

```
AI-Study_companion/
├── backend/
│   ├── main.py                  # FastAPI routes
│   ├── agent.py                 # Intent router and topic extraction
│   ├── quiz.py                  # Quiz and past paper generation
│   ├── study_plan.py            # Summary and study plan generation
│   ├── qdrant_client_setup.py   # Qdrant collection, storage, and search
│   ├── embeddings.py            # Embedding model
│   ├── chunking.py              # Text splitting
│   ├── file_reader.py           # PDF, PPTX, DOCX, and TXT text extraction
│   ├── requirements.txt
│   └── uploads/                 # Uploaded files (not committed)
├── frontend/
│   ├── app/
│   │   ├── page.tsx             # Dashboard
│   │   ├── layout.tsx           # Sidebar layout
│   │   ├── upload/page.tsx      # Upload notes
│   │   ├── study-plan/page.tsx  # Study plan
│   │   └── ask/page.tsx         # Ask Your Notes (tabs)
│   └── components/
│       ├── Sidebar.tsx
│       ├── Tabs.tsx
│       └── AgentPanel.tsx
├── TESTING.md                   # Test cases
└── README.md
```

## Prerequisites

- Python 3.11 or 3.12 (recommended)
- Node.js 20.9 or newer
- Git
- A free [Qdrant Cloud](https://cloud.qdrant.io) cluster (URL and API key)
- A free [Groq](https://console.groq.com) API key

## Setup

### 1. Clone the repository

```
git clone https://github.com/AsadMuneerAhmed/AI-Study_companion.git
cd AI-Study_companion
```

Keep the project outside OneDrive-synced folders if possible (for example `C:\Projects`). Sync can lock files inside `venv` and cause install errors.

### 2. Create the environment file

Create a file named `.env` inside the `backend` folder:

```
QDRANT_URL=https://your-cluster-id.your-region.cloud.qdrant.io:6333
QDRANT_API_KEY=your_qdrant_api_key
GROQ_API_KEY=your_groq_api_key
```

Use your own values, with no quotes and no spaces around `=`. Never commit this file or share the keys. The `.env` file is already listed in `.gitignore`.

### 3. Set up the backend (first time only)

```
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

If `pip install` fails for `sentence-transformers` or `torch`, check that your Python version is 3.11 or 3.12.

### 4. Run the backend

```
cd backend
venv\Scripts\activate
python -m uvicorn main:app --reload --port 8000
```

Wait for `Application startup complete`. The first start downloads the embedding model (about 90 MB), which can take a few minutes. Keep this terminal open while you use the app.

### 5. Create the Qdrant collection (first time only)

Open `http://127.0.0.1:8000/docs`, run `POST /setup-collection`, and confirm the response is `{"message": "Collection ready"}`.

### 6. Set up and run the frontend

Open a second terminal:

```
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000` in your browser.

## Usage

1. **Upload notes:** go to **Upload Notes**, choose a document type (`Notes` or `Past paper`), choose a file, and click **Upload & Store**.
2. **Study plan:** go to **Study Plan**, enter a topic, and click **Build study plan**.
3. **Ask your notes:** go to **Ask Your Notes** and use one of the tabs (Search, Summary, Quiz, Past Papers). Enter a topic and click **Go**.

## API endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/` | Health check |
| POST | `/setup-collection` | Create the Qdrant collection and index (run once) |
| POST | `/store-document` | Upload and store a file. Form fields: `file`, `doc_type` (`notes` or `past_paper`) |
| GET | `/search` | Semantic search. Query params: `query`, optional `doc_type` |
| GET | `/search-scores` | Search results with their scores |
| GET | `/study-plan` | Study plan for a topic. Query param: `topic` |
| GET | `/agent` | Intent-routed answer. Query param: `request` |
| POST | `/upload`, `/test-chunk`, `/test-embedding` | Development and testing endpoints |

Example `/agent` requests:

- `Summarize the information security topic`
- `Make a quiz on the information security topic`
- `Give me past paper questions on the information security topic`
- `Search my notes for structures`

## Testing

See [TESTING.md](TESTING.md) for the test cases, expected results, and frontend checks.

## Known limitations

- **Chunk size:** chunks are 1000 characters, not 200 to 500 tokens as originally planned. The embedding model reads up to 256 tokens, so larger chunks would be cut off.
- **LLM model:** the app uses `openai/gpt-oss-120b` on Groq. The original plan mentioned a Llama model. Llama models were not enabled on our Groq account during development, so this can be switched later.
- **Past papers:** past paper questions are generated from uploaded material. Testing with real past papers is still pending.
- **Clarify intent:** the app returns a message asking for a topic. A follow-up question is not implemented yet.
- **Duplicate uploads:** uploading the same file again stores its chunks again.
- **Output quality:** LLM answers depend on the model and the quality of the uploaded notes. Check generated quizzes before relying on them.

## Team

- Mahnoor Shuaib (original repository)
- Asad Muneer Ahmed (backend intent router, quiz, past papers, and frontend)