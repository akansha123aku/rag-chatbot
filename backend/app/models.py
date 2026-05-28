from pydantic import BaseModel
from typing import Optional

class ChatRequest(BaseModel):
    question: str
    prompt_type: str = "zero_shot"
    k: int = 8

class ChatResponse(BaseModel):
    answer: str
    retrieved_chunks: int
    prompt_type: str
    error: Optional[str] = None
