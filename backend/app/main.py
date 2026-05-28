from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import os
from dotenv import load_dotenv
from app.models import ChatRequest, ChatResponse
from app.rag_engine import RAGEngine

load_dotenv()

app = FastAPI(title="RAG Q&A Chatbot", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
if not GROQ_API_KEY:
    raise ValueError("GROQ_API_KEY not found")

rag_engine = RAGEngine(groq_api_key=GROQ_API_KEY)

@app.get("/")
async def root():
    return {"message": "RAG Chatbot API is running!", "status": "healthy"}

@app.post("/upload")
async def upload_pdf(file: UploadFile = File(...)):
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files allowed")
    
    try:
        result = rag_engine.ingest_pdf(file)
        return JSONResponse(content=result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed: {str(e)}")

@app.post("/ask", response_model=ChatResponse)
async def ask_question(chat: ChatRequest):
    if not rag_engine.vector_store:
        raise HTTPException(status_code=400, detail="No PDF uploaded")
    
    result = rag_engine.ask(chat.question, chat.prompt_type, chat.k)
    
    return ChatResponse(
        answer=result["answer"],
        retrieved_chunks=result["retrieved_chunks"],
        prompt_type=result["prompt_type"],
        error=result.get("error")
    )

@app.get("/health")
async def health_check():
    return {"status": "ok", "has_vector_store": rag_engine.vector_store is not None}
