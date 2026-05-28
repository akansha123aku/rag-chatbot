import tempfile
import os
from typing import Dict, Any, List
from langchain_community.document_loaders import PyPDFLoader
from langchain_community.vectorstores import FAISS
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_core.documents import Document
from langchain_text_splitters import RecursiveCharacterTextSplitter
import numpy as np
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class RAGEngine:
    def __init__(self, groq_api_key: str):
        logger.info("Initializing RAG Engine...")
        
        self.embeddings = HuggingFaceEmbeddings(
            model_name="sentence-transformers/all-MiniLM-L6-v2",
            model_kwargs={'device': 'cpu'},
            encode_kwargs={'normalize_embeddings': True}
        )
        
        self.llm = ChatGroq(
            api_key=groq_api_key,
            model="llama-3.3-70b-versatile",
            temperature=0.2,
            max_tokens=500
        )
        
        self.vector_store = None
        
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

Example 2:
Question: Can employees work remotely?
Answer: The handbook states that remote work is permitted on Mondays and Fridays.

Now answer this question using the SAME format (start with "According to the document"):

Context: {context}

Question: {question}

Answer: According to the document,""",
            
            "chain_of_thought": """You are a reasoning assistant. Think step by step before answering.

Context: {context}

Question: {question}

Let me reason through this step by step:
1. First, I need to identify what the document says about this topic.
2. The relevant information from the context is: [find the key facts]
3. Based on these facts, the answer to the question is:

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
            
            text_splitter = RecursiveCharacterTextSplitter(
                chunk_size=500,
                chunk_overlap=50,
                separators=["\n\n", "\n", " ", ""]
            )
            chunks = text_splitter.split_documents(documents)
            logger.info(f"Created {len(chunks)} chunks")
            
            self.vector_store = FAISS.from_documents(chunks, self.embeddings)
            
            stats = {
                "num_chunks": int(len(chunks)),
                "total_pages": len(documents),
                "filename": pdf_file.filename
            }
            
            self.vector_store.save_local("faiss_index")
            
            return {"status": "success", "stats": stats}
            
        except Exception as e:
            logger.error(f"Ingestion failed: {str(e)}")
            raise
        finally:
            os.unlink(tmp_path)
    
    def ask(self, question: str, prompt_type: str = "zero_shot", k: int = 8) -> Dict[str, Any]:
        if not self.vector_store:
            return {
                "answer": "Please upload a PDF first.",
                "retrieved_chunks": 0,
                "prompt_type": prompt_type
            }
        
        try:
            docs = self.vector_store.similarity_search(question, k=k)
            
            if not docs:
                return {
                    "answer": "No relevant information found.",
                    "retrieved_chunks": 0,
                    "prompt_type": prompt_type
                }
            
            context = "\n\n---\n\n".join([doc.page_content for doc in docs])
            
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
                "retrieved_chunks": len(docs),
                "prompt_type": prompt_type
            }
            
        except Exception as e:
            logger.error(f"Error: {str(e)}")
            return {
                "answer": f"Error: {str(e)}",
                "retrieved_chunks": 0,
                "prompt_type": prompt_type
            }