# HƯỚNG DẪN KHỞI CHẠY HỆ THỐNG CHATBOT TƯ VẤN TIẾNG TRUNG PTTC (RAG)

Hệ thống Chatbot RAG sử dụng dữ liệu đầu vào duy nhất từ `docs/QA.json` (50 câu Q&A đào tạo tiếng Trung HSK 1–3 của Trung tâm PTTC).

---

## 1. Cấu hình hệ thống

### Backend (FastAPI + Pinecone + Custom LLM Provider):
* **LLM Provider:** `http://14.225.217.25:8317/v1` (Model `gemini-3-flash`)
* **Vector Database:** Pinecone (Index: `pttc-chinese`, Dimension: 384, Metric: Cosine)
* **Embedding Model:** `sentence-transformers/all-MiniLM-L6-v2`
* **Tri thức RAG:** `docs/QA.json` (Chỉ dùng duy nhất 50 cặp Hỏi - Đáp)

### Frontend (Next.js 14 + TailwindCSS + Lucide Icons):
* Hỗ trợ SSE Streaming response real-time.
* Hiển thị trích dẫn nguồn tài liệu tham khảo (Citations).
* Form đăng ký tư vấn nhận học bổng & ưu đãi sinh viên PTIT.

---

## 2. Các bước chạy hệ thống

### Bước 1: Khởi động Backend (FastAPI)
Mở terminal tại thư mục gốc của dự án:
```powershell
cd backend
python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```
API Backend sẽ chạy tại: `http://127.0.0.1:8000` (Swagger docs tại: `http://127.0.0.1:8000/docs`)

---

### Bước 2: Khởi động Frontend (Next.js)
Mở terminal thứ 2 tại thư mục `frontend`:
```powershell
cd frontend
npm run dev
```
Giao diện ứng dụng Chatbot sẽ chạy tại: `http://localhost:3000`
