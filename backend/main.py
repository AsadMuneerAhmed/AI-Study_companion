from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import shutil
import os
from chunking import chunk_text
from embeddings import get_embedding
from qdrant_client_setup import create_collection_if_not_exists, store_chunks, search_chunks, search_chunks_with_scores, list_documents, delete_document
from study_plan import generate_study_plan
from agent import detect_intent, extract_topic
from quiz import generate_quiz, generate_past_questions
from file_reader import extract_text

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@app.get("/")
def read_root():
    return {"message": "Study Companion backend is running!"}

@app.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    return {"filename": file.filename, "message": "File uploaded successfully"}

@app.post("/test-chunk")
async def test_chunk(file: UploadFile = File(...)):
    content = await file.read()
    text = content.decode("utf-8")
    chunks = chunk_text(text)
    if not chunks:
        raise HTTPException(status_code=400, detail="No readable text found in this file. Use a PDF with selectable text.")
    return {"total_chunks": len(chunks), "chunks": chunks}

@app.post("/test-embedding")
async def test_embedding(file: UploadFile = File(...)):
    content = await file.read()
    text = content.decode("utf-8")
    chunks = chunk_text(text)
    first_embedding = get_embedding(chunks[0])
    return {
        "total_chunks": len(chunks),
        "embedding_length": len(first_embedding),
        "sample_values": first_embedding[:5]
    }
@app.post("/setup-collection")
def setup_collection():
    create_collection_if_not_exists()
    return {"message": "Collection ready"}

@app.post("/store-document")
async def store_document(
    file: UploadFile = File(...),
    doc_type: str = Form("notes"),
):
    if doc_type not in ("notes", "past_paper"):
        raise HTTPException(status_code=400, detail="doc_type must be 'notes' or 'past_paper'")

    file_path = os.path.join(UPLOAD_DIR, file.filename)
    with open(file_path, "wb") as buffer:
        content = await file.read()
        buffer.write(content)

    text = extract_text(file_path)
    chunks = chunk_text(text)
    embeddings = [get_embedding(chunk) for chunk in chunks]
    store_chunks(chunks, embeddings, source_file=file.filename, doc_type=doc_type)
    return {
        "message": "Document stored successfully",
        "total_chunks": len(chunks),
        "source_file": file.filename,
        "doc_type": doc_type,
    }

@app.get("/search")
def search(query: str, doc_type: str | None = None):
    if doc_type is not None and doc_type not in ("notes", "past_paper"):
        raise HTTPException(status_code=400, detail="doc_type must be 'notes' or 'past_paper'")
    results = search_chunks(query, doc_type=doc_type)
    return {"query": query, "doc_type": doc_type, "results": results}

@app.get("/search-scores")
def search_scores(query: str):
    results = search_chunks_with_scores(query)
    return {"query": query, "results": results}

@app.get("/study-plan")
def study_plan(topic: str):
    chunks = search_chunks(topic)
    if not chunks:
        raise HTTPException(
            status_code=404,
            detail="Your notes don't seem to cover this topic. Try a topic from your uploaded files.",
        )
    plan = generate_study_plan(topic, chunks)
    return plan

@app.get("/agent")
def agent(request: str, doc_type: str | None = None):
    intent = detect_intent(request)

    if intent == "clarify":
           return {
               "intent": intent,
               "answer": "This question does not seem related to your notes.",
               "follow_up": "Which topic from your notes would you like to study? For example: 'structures' or 'threats'.",
           }

    if intent in ("search", "summary"):
        topic = extract_topic(request)
        chunks = search_chunks(topic, doc_type=doc_type)
        if not chunks:
            return {
                "intent": intent,
                "topic": topic,
                "answer": "This topic was not found in your notes.",
            }
        if intent == "search":
            return {"intent": intent, "topic": topic, "results": chunks}
        plan = generate_study_plan(topic, chunks)
        return {"intent": intent, "topic": topic, "answer": plan}
    if intent == "quiz":
        topic = extract_topic(request)
        chunks = search_chunks(topic, doc_type=doc_type)
        if not chunks:
            return {
                "intent": intent,
                "topic": topic,
                "answer": "This topic was not found in your notes.",
            }
        quiz = generate_quiz(topic, chunks)
        return {"intent": intent, "topic": topic, "answer": quiz}
    if intent == "past_paper":
        topic = extract_topic(request)
        chunks = search_chunks(topic, doc_type="past_paper")
        if not chunks:
            return {
                "intent": intent,
                "topic": topic,
                "answer": "No past paper material was found for this topic. Please upload a past paper with doc_type 'past_paper' first.",
            }
        questions = generate_past_questions(topic, chunks)
        return {"intent": intent, "topic": topic, "answer": questions}
    return {
           "intent": intent,
           "answer": "I could not understand this question. Please ask about a topic, such as 'structures' or 'threats'.",
       }
@app.get("/documents")
def documents():
    items = list_documents()
    return {"total_files": len(items), "documents": items}
@app.delete("/documents")
def remove_document(source_file: str, doc_type: str):
    if doc_type not in ("notes", "past_paper"):
        raise HTTPException(status_code=400, detail="doc_type must be 'notes' or 'past_paper'")
    delete_document(source_file, doc_type)
    return {"message": "Document deleted", "source_file": source_file, "doc_type": doc_type}