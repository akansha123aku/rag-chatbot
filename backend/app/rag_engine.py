import tempfile
import os
from typing import Dict, Any, List
from langchain_community.document_loaders import PyPDFLoader
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class RAGEngine:
    def __init__(self, groq_api_key: str):
        logger.info("Initializing RAG Engine...")
        
        self.llm = ChatGroq(
            api_key=groq_api_key,
            model="llama-3.3-70b-versatile",
            temperature=0.2,
            max_tokens=500
        )
        
        self.chunks = []
        self.vector_store = None
        
        self.prompts = {
            "zero_shot": """You are a strict assistant. Answer ONLY using the provided context below.
If the answer is NOT explicitly stated in the context, say "I don't have enough information in the document to answer that question."
Do NOT use your own knowledge. Do NOT make up answers.

Context: {context}

Question: {question}

Answer:""",
            
            "few_shot": """Examples:
Q: What is the leave policy?
A: According to the document, employees receive 20 paid leave days.

Now answer using the SAME format:
Context: {context}
Question: {question}
Answer: According to the document,""",
            
            "chain_of_thought": """Reason step by step.

Context: {context}
Question: {question}

Let me think step by step:
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
            
            # Smaller chunks to avoid token limits
            text_splitter = RecursiveCharacterTextSplitter(
                chunk_size=300,
                chunk_overlap=50,
                separators=["\n\n", "\n", " ", ""]
            )
            chunks = text_splitter.split_documents(documents)
            
            self.chunks = chunks
            self.vector_store = type('Dummy', (), {'__bool__': lambda self: True})()
            
            stats = {
                "num_chunks": len(chunks),
                "total_pages": len(documents),
                "filename": pdf_file.filename
            }
            
            return {"status": "success", "stats": stats}
            
        except Exception as e:
            logger.error(f"Ingestion failed: {e}")
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
            question_words = set(question.lower().split())
            scored = []
            
            for chunk in self.chunks:
                chunk_text = chunk.page_content.lower()
                score = sum(1 for word in question_words if word in chunk_text)
                scored.append((score, chunk))
            
            scored.sort(reverse=True, key=lambda x: x[0])
            top_chunks = [chunk for _, chunk in scored[:k]]
            
            context = "\n\n---\n\n".join([c.page_content for c in top_chunks])
            
            template = self.prompts.get(prompt_type, self.prompts["zero_shot"])
            final_prompt = template.format(context=context, question=question)
            
            messages = [
                SystemMessage(content="You are a helpful assistant."),
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
            logger.error(f"Ask failed: {e}")
            return {
                "answer": f"Error: {str(e)}",
                "retrieved_chunks": 0,
                "prompt_type": prompt_type
            }