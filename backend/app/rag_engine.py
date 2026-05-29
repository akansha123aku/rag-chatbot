import tempfile
import os
from typing import Dict, Any, List
from langchain_community.document_loaders import PyPDFLoader
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_core.documents import Document
import numpy as np
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class RAGEngine:
    def __init__(self, groq_api_key: str):
        logger.info("Initializing RAG Engine...")
        
        # Use Groq for LLM only (no local embeddings needed)
        self.llm = ChatGroq(
            api_key=groq_api_key,
            model="llama-3.3-70b-versatile",
            temperature=0.2,
            max_tokens=500
        )
        
        self.chunks = []  # Store chunks in memory (no FAISS needed)
        
        self.prompts = {
            "zero_shot": """You are a strict assistant. Answer ONLY using the provided context below.
If the answer is NOT explicitly stated in the context, say "I don't have enough information in the document to answer that question."
Do NOT use your own knowledge. Do NOT make up answers.

Context: {context}

Question: {question}

Answer:""",
            
            "few_shot": """You are a helpful assistant. Follow the examples below when answering.

Example 1:
Question: What is the leave policy?
Answer: According to the document, employees receive 20 paid leave days per year.

Now answer this question using the SAME format (start with "According to the document"):

Context: {context}

Question: {question}

Answer: According to the document,""",
            
            "chain_of_thought": """You are a reasoning assistant. Think step by step.

Context: {context}

Question: {question}

Let me reason step by step:
1. First, identify what the document says about this topic.
2. Based on these facts, the answer is:

Answer:"""
        }
        
        logger.info("RAG Engine ready!")
    
    def ingest_pdf(self, pdf_file) -> Dict[str, Any]:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
            tmp.write(pdf_file.file.read())
            tmp_path = tmp.name
        
        try:
            loader = PyPDFLoader(tmp_path)
            documents = loader.load()
            logger.info(f"Loaded {len(documents)} pages")
            
            # Simple chunking - split by paragraphs and words
            chunks = []
            for doc in documents:
                text = doc.page_content
                # Split by double newline (paragraphs)
                paragraphs = text.split('\n\n')
                for para in paragraphs:
                    if len(para) > 100:  # Only keep meaningful paragraphs
                        chunks.append(Document(page_content=para.strip(), metadata=doc.metadata))
                    else:
                        # For short paragraphs, keep as is
                        chunks.append(Document(page_content=para.strip(), metadata=doc.metadata))
            
            self.chunks = chunks
            logger.info(f"Created {len(chunks)} chunks")
            
            stats = {
                "num_chunks": int(len(chunks)),
                "total_pages": len(documents),
                "filename": pdf_file.filename
            }
            
            return {"status": "success", "stats": stats}
            
        except Exception as e:
            logger.error(f"Ingestion failed: {str(e)}")
            raise
        finally:
            os.unlink(tmp_path)
    
    def ask(self, question: str, prompt_type: str = "zero_shot", k: int = 8) -> Dict[str, Any]:
        if not self.chunks:
            return {
                "answer": "Please upload a PDF first.",
                "retrieved_chunks": 0,
                "prompt_type": prompt_type
            }
        
        try:
            # Simple keyword-based retrieval (no embeddings needed!)
            scored_chunks = []
            question_words = set(question.lower().split())
            
            for chunk in self.chunks:
                chunk_text = chunk.page_content.lower()
                # Count how many question words appear in the chunk
                score = sum(1 for word in question_words if word in chunk_text)
                # Also check for word boundaries (higher weight for exact matches)
                scored_chunks.append((score, chunk))
            
            # Sort by score (highest first)
            scored_chunks.sort(reverse=True, key=lambda x: x[0])
            
            # Get top k chunks
            top_chunks = [chunk for _, chunk in scored_chunks[:k]]
            
            context = "\n\n---\n\n".join([chunk.page_content for chunk in top_chunks])
            
            template = self.prompts.get(prompt_type, self.prompts["zero_shot"])
            final_prompt = template.format(context=context, question=question)
            
            messages = [
                SystemMessage(content="You are a helpful AI assistant."),
                HumanMessage(content=final_prompt)
            ]
            
            response = self.llm.invoke(messages)
            answer = response.content.strip()
            
            return {
                "answer": answer,
                "retrieved_chunks": len(top_chunks),
                "prompt_type": prompt_type
            }
            
        except Exception as e:
            logger.error(f"Error: {str(e)}")
            return {
                "answer": f"Error: {str(e)}",
                "retrieved_chunks": 0,
                "prompt_type": prompt_type
            }