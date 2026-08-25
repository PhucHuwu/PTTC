import os
import json
from typing import List, Dict, Any

def load_knowledge_chunks(docs_dir: str) -> List[Dict[str, Any]]:
    """Chỉ đọc và nạp duy nhất file docs/QA.json làm tri thức RAG"""
    chunks = []
    
    qa_path = os.path.join(docs_dir, "QA.json")
    if not os.path.exists(qa_path):
        # Fallback nếu truyền trực tiếp file hoặc đường dẫn tương đối khác
        if os.path.isfile(docs_dir) and docs_dir.endswith("QA.json"):
            qa_path = docs_dir

    if os.path.exists(qa_path):
        with open(qa_path, "r", encoding="utf-8") as f:
            qa_data = json.load(f)
            for item in qa_data:
                q_id = item.get("id")
                question = item.get("question", "").strip()
                answer = item.get("answer", "").strip()
                content = f"Câu hỏi: {question}\nTrả lời: {answer}"
                chunks.append({
                    "id": f"qa_{q_id}",
                    "content": content,
                    "metadata": {
                        "source": "QA.json",
                        "type": "qa_item",
                        "qa_id": q_id,
                        "question": question,
                        "answer": answer
                    }
                })
        print(f"Loaded {len(chunks)} Q&A items exclusively from {qa_path}")
    else:
        print(f"Warning: {qa_path} not found!")

    return chunks
