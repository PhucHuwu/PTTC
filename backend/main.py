import os
import json
import uuid
from typing import List, Optional
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from config import settings
from models import init_db, get_db, ChatSession, ChatMessage, LeadContact
from ingestion import load_knowledge_chunks
from vector_store import vector_store
from rag_service import stream_chat_completion

app = FastAPI(
    title="PTTC Chinese Course Consultation AI Chatbot API",
    description="RAG-powered AI Consultant for PTTC Chinese Language Courses",
    version="1.0.0"
)

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic Request/Response Models
class ChatRequest(BaseModel):
    session_id: Optional[str] = None
    message: str

class LeadCreate(BaseModel):
    full_name: str
    phone: str
    email: Optional[str] = None
    target_level: Optional[str] = "HSK 1-3"
    university: Optional[str] = "PTIT"
    note: Optional[str] = None

@app.on_event("startup")
async def on_startup():
    # 1. Initialize SQLite / DB
    init_db()
    
    # 2. Ingest Knowledge Docs
    docs_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "docs"))
    if not os.path.exists(docs_path):
        docs_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "docs"))
    print(f"Loading docs from: {docs_path}")
    chunks = load_knowledge_chunks(docs_path)
    vector_store.build_index(chunks)
    print(f"Server initialized with {len(chunks)} knowledge chunks.")

@app.get("/")
def health_check():
    return {
        "status": "healthy",
        "service": "PTTC Chinese RAG Chatbot API",
        "knowledge_chunks": len(vector_store.chunks),
        "model": settings.LLM_MODEL
    }

@app.post("/api/chat")
async def chat_endpoint(req: ChatRequest, db: Session = Depends(get_db)):
    session_id = req.session_id or str(uuid.uuid4())
    
    # Ensure session exists in DB
    session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
    if not session:
        session = ChatSession(id=session_id)
        db.add(session)
        db.commit()

    # 1. Retrieve relevant knowledge chunks
    retrieved_chunks = vector_store.search(req.message, top_k=4)
    context_str = "\n\n".join([f"- [Nguồn: {c['metadata'].get('source')}]: {c['content']}" for c in retrieved_chunks])
    
    sources = [
        {
            "id": c["id"],
            "source": c["metadata"].get("source", "Tài liệu PTTC"),
            "snippet": c["content"][:150] + "..." if len(c["content"]) > 150 else c["content"]
        }
        for c in retrieved_chunks
    ]

    # 2. Get past chat history from DB (last 6 messages)
    past_messages = db.query(ChatMessage).filter(ChatMessage.session_id == session_id).order_by(ChatMessage.id.desc()).limit(6).all()
    history_messages = []
    for msg in reversed(past_messages):
        history_messages.append({"role": msg.role, "content": msg.content})
    
    # Append current user question
    history_messages.append({"role": "user", "content": req.message})

    # Save user message to DB
    user_msg = ChatMessage(
        session_id=session_id,
        role="user",
        content=req.message
    )
    db.add(user_msg)
    db.commit()

    # 3. Stream response generator
    async def sse_generator():
        # First send session_id and sources as initial metadata event
        meta_event = {
            "type": "meta",
            "session_id": session_id,
            "sources": sources
        }
        yield f"data: {json.dumps(meta_event, ensure_ascii=False)}\n\n"
        
        full_assistant_reply = ""
        async for token in stream_chat_completion(history_messages, context=context_str):
            full_assistant_reply += token
            token_event = {
                "type": "token",
                "content": token
            }
            yield f"data: {json.dumps(token_event, ensure_ascii=False)}\n\n"

        # Save assistant reply to DB
        new_db = next(get_db())
        try:
            bot_msg = ChatMessage(
                session_id=session_id,
                role="assistant",
                content=full_assistant_reply,
                sources=json.dumps(sources, ensure_ascii=False)
            )
            new_db.add(bot_msg)
            new_db.commit()
        finally:
            new_db.close()

        done_event = {"type": "done"}
        yield f"data: {json.dumps(done_event)}\n\n"

    return StreamingResponse(sse_generator(), media_type="text/event-stream")

@app.get("/api/history/{session_id}")
def get_chat_history(session_id: str, db: Session = Depends(get_db)):
    messages = db.query(ChatMessage).filter(ChatMessage.session_id == session_id).order_by(ChatMessage.id.asc()).all()
    return [
        {
            "id": m.id,
            "role": m.role,
            "content": m.content,
            "sources": json.loads(m.sources) if m.sources else [],
            "created_at": m.created_at.isoformat()
        }
        for m in messages
    ]

@app.post("/api/leads")
def submit_lead(lead: LeadCreate, db: Session = Depends(get_db)):
    contact = LeadContact(
        full_name=lead.full_name,
        phone=lead.phone,
        email=lead.email,
        target_level=lead.target_level,
        university=lead.university,
        note=lead.note
    )
    db.add(contact)
    db.commit()
    db.refresh(contact)
    return {
        "status": "success",
        "message": "Đã lưu thông tin tư vấn thành công. Đội ngũ PTTC sẽ liên hệ sớm nhất!",
        "lead_id": contact.id
    }

@app.get("/api/leads")
def list_leads(db: Session = Depends(get_db)):
    leads = db.query(LeadContact).order_by(LeadContact.created_at.desc()).all()
    return leads
