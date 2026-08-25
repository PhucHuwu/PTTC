from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # LLM Custom Provider Config
    LLM_BASE_URL: str = "http://14.225.217.25:8317/v1"
    LLM_API_KEY: Optional[str] = None
    LLM_MODEL: str = "gemini-3-flash"
    
    # Vector DB / Pinecone Config
    PINECONE_API_KEY: Optional[str] = None
    PINECONE_INDEX_NAME: str = "pttc-chinese"
    PINECONE_ENVIRONMENT: Optional[str] = None
    
    # Database
    DATABASE_URL: str = "sqlite:///./pttc_chatbot.db"
    
    # Embedding Model (Local SentenceTransformer)
    EMBEDDING_MODEL: str = "all-MiniLM-L6-v2"
    EMBEDDING_DIM: int = 384
    
    # Docs Directory
    DOCS_DIR: str = "../docs"

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
