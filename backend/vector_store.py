import os
import faiss
import numpy as np
from typing import List, Dict, Any, Optional
from sentence_transformers import SentenceTransformer
from config import settings

class VectorStoreManager:
    def __init__(self):
        print(f"Loading embedding model: {settings.EMBEDDING_MODEL}...")
        self.encoder = SentenceTransformer(settings.EMBEDDING_MODEL)
        self.dimension = settings.EMBEDDING_DIM
        self.chunks: List[Dict[str, Any]] = []
        self.faiss_index = None
        self.pinecone_index = None
        self.use_pinecone = False
        
        # Init Pinecone if key provided
        if settings.PINECONE_API_KEY:
            try:
                from pinecone import Pinecone
                pc = Pinecone(api_key=settings.PINECONE_API_KEY)
                self.pinecone_index = pc.Index(settings.PINECONE_INDEX_NAME)
                self.use_pinecone = True
                print("Pinecone Vector Store connected successfully.")
            except Exception as e:
                print(f"Pinecone init failed, falling back to local FAISS: {e}")

    def build_index(self, chunks: List[Dict[str, Any]]):
        """Index chunks into FAISS and optionally Pinecone"""
        self.chunks = chunks
        if not chunks:
            print("No chunks to index.")
            return

        texts = [c["content"] for c in chunks]
        embeddings = self.encoder.encode(texts, convert_to_numpy=True, normalize_embeddings=True)
        
        # 1. FAISS index (Always available as local / fallback)
        self.faiss_index = faiss.IndexFlatIP(self.dimension)
        self.faiss_index.add(embeddings.astype("float32"))
        print(f"Indexed {len(chunks)} chunks into FAISS vector store.")

        # 2. Pinecone index (nếu cấu hình)
        if self.use_pinecone and self.pinecone_index:
            try:
                vectors_to_upsert = []
                for i, chunk in enumerate(chunks):
                    vectors_to_upsert.append({
                        "id": chunk["id"],
                        "values": embeddings[i].tolist(),
                        "metadata": {
                            "content": chunk["content"],
                            "source": chunk["metadata"].get("source", ""),
                            "type": chunk["metadata"].get("type", "")
                        }
                    })
                self.pinecone_index.upsert(vectors=vectors_to_upsert)
                print(f"Upserted {len(vectors_to_upsert)} vectors to Pinecone.")
            except Exception as e:
                print(f"Failed to upsert to Pinecone: {e}")

    def search(self, query: str, top_k: int = 4) -> List[Dict[str, Any]]:
        """Tìm kiếm ngữ nghĩa các chunk phù hợp nhất"""
        if not self.chunks:
            return []
            
        query_vector = self.encoder.encode([query], convert_to_numpy=True, normalize_embeddings=True)
        
        # Search via Pinecone if enabled
        if self.use_pinecone and self.pinecone_index:
            try:
                res = self.pinecone_index.query(
                    vector=query_vector[0].tolist(),
                    top_k=top_k,
                    include_metadata=True
                )
                results = []
                for match in res.get("matches", []):
                    results.append({
                        "id": match["id"],
                        "score": match["score"],
                        "content": match["metadata"].get("content", ""),
                        "metadata": match["metadata"]
                    })
                return results
            except Exception as e:
                print(f"Pinecone search error, using FAISS: {e}")

        # Search via FAISS
        if self.faiss_index is not None:
            scores, indices = self.faiss_index.search(query_vector.astype("float32"), top_k)
            results = []
            for score, idx in zip(scores[0], indices[0]):
                if idx >= 0 and idx < len(self.chunks):
                    chunk = self.chunks[idx]
                    results.append({
                        "id": chunk["id"],
                        "score": float(score),
                        "content": chunk["content"],
                        "metadata": chunk["metadata"]
                    })
            return results

        return []

vector_store = VectorStoreManager()
