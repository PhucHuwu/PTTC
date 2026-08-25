import pytest
from fastapi.testclient import TestClient
import os
import sys

# Append backend directory to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from main import app
from ingestion import load_knowledge_chunks

client = TestClient(app)

def test_health_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "knowledge_chunks" in data

def test_qa_ingestion():
    docs_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "docs"))
    chunks = load_knowledge_chunks(docs_path)
    assert len(chunks) == 50
    assert chunks[0]["metadata"]["type"] == "qa_item"
    assert "HSK" in chunks[0]["content"]

def test_leads_lifecycle():
    # Submit lead
    lead_payload = {
        "full_name": "Test Student",
        "phone": "0912345678",
        "email": "test@ptit.edu.vn",
        "target_level": "Combo HSK 1–3",
        "university": "PTIT",
        "note": "Automated Unit Test"
    }
    res = client.post("/api/leads", json=lead_payload)
    assert res.status_code == 200
    res_data = res.json()
    assert res_data["status"] == "success"
    assert "lead_id" in res_data
