import httpx
import json
from typing import AsyncGenerator, List, Dict, Any
from config import settings

SYSTEM_PROMPT = """Bạn là Trợ lý AI Tư vấn Tuyển sinh & Khóa học Tiếng Trung của Trung tâm Đào tạo Bưu chính Viễn thông (PTTC) thuộc Học viện Công nghệ Bưu chính Viễn thông (PTIT).

Nhiệm vụ của bạn:
1. Tư vấn chuyên nghiệp, tận tâm, thân thiện và nhiệt tình cho học viên về chương trình Tiếng Trung Ứng dụng & Lộ trình HSK 1 – HSK 3.
2. Cung cấp thông tin chính xác dựa trên dữ liệu tham khảo được cung cấp bên dưới (Q&A 50 câu hỏi và định hướng của Trung tâm).
3. Luôn giữ phong thái lịch sự, rõ ràng, chia ý mạch lạc (sử dụng bullet points khi cần thiết).
4. Nếu người dùng quan tâm đến đăng ký hoặc nhận ưu đãi, hãy khuyến khích họ để lại thông tin (Họ tên, SĐT) qua form đăng ký nhanh để thầy cô PTTC liên hệ hỗ trợ trực tiếp.
5. Nếu câu hỏi nằm ngoài phạm vi thông tin đào tạo của Trung tâm, hãy trả lời khéo léo và hướng dẫn học viên liên hệ trực tiếp hotline/kênh tuyển sinh chính thức của PTTC.

DƯỚI ĐÂY LÀ DỮ LIỆU THÔNG TIN CHÍNH THỨC CỦA TRUNG TÂM PTTC:
---------------------
{context}
---------------------
"""

async def stream_chat_completion(
    messages: List[Dict[str, str]], 
    context: str
) -> AsyncGenerator[str, None]:
    """Gọi LLM streaming qua OpenAI-compatible API"""
    formatted_system = SYSTEM_PROMPT.format(context=context if context else "Không có ngữ cảnh bổ sung.")
    
    payload_messages = [{"role": "system", "content": formatted_system}] + messages
    
    payload = {
        "model": settings.LLM_MODEL,
        "messages": payload_messages,
        "temperature": 0.3,
        "stream": True
    }
    
    headers = {
        "Authorization": f"Bearer {settings.LLM_API_KEY}",
        "Content-Type": "application/json"
    }
    
    async with httpx.AsyncClient(timeout=60.0) as client:
        async with client.stream(
            "POST",
            f"{settings.LLM_BASE_URL}/chat/completions",
            json=payload,
            headers=headers
        ) as response:
            if response.status_code != 200:
                error_body = await response.aread()
                yield f"Lỗi kết nối AI Service ({response.status_code}): {error_body.decode('utf-8')}"
                return

            async for line in response.aiter_lines():
                if not line:
                    continue
                line_str = line.strip()
                if line_str.startswith("data: ") and not line_str.endswith("[DONE]"):
                    try:
                        data = json.loads(line_str[6:])
                        delta = data.get("choices", [{}])[0].get("delta", {}).get("content", "")
                        if delta:
                            yield delta
                    except Exception:
                        pass
