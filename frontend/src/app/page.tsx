'use client';

import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  Send, 
  Sparkles, 
  Bot, 
  User, 
  GraduationCap, 
  RotateCcw, 
  BookOpen, 
  DollarSign, 
  HelpCircle,
  Award,
  ChevronRight
} from 'lucide-react';
import SourceCitations from '@/components/SourceCitations';

interface Message {
  id?: number | string;
  role: 'user' | 'assistant';
  content: string;
  sources?: Array<{ id: string; source: string; snippet: string }>;
}

const QUICK_PROMPTS = [
  {
    icon: <BookOpen className="h-4 w-4 text-red-500" />,
    title: 'Lộ trình HSK 1 đến HSK 3',
    query: 'Lộ trình học tiếng Trung từ HSK 1 đến HSK 3 tại PTTC được thiết kế như thế nào?'
  },
  {
    icon: <DollarSign className="h-4 w-4 text-amber-500" />,
    title: 'Học phí & Ưu đãi PTIT',
    query: 'Tổng học phí khóa HSK 1–3 là bao nhiêu? Sinh viên PTIT có ưu đãi học bổng gì không?'
  },
  {
    icon: <HelpCircle className="h-4 w-4 text-blue-500" />,
    title: 'Chưa từng học có tham gia được?',
    query: 'Em chưa từng học tiếng Trung bao giờ thì có theo kịp khóa HSK 1 không? Có được luyện phát âm chuẩn không?'
  },
  {
    icon: <Award className="h-4 w-4 text-emerald-500" />,
    title: 'Định hướng chuẩn HSK 3.0',
    query: 'Chương trình của Trung tâm có chuẩn theo HSK 3.0 và chú trọng giao tiếp ứng dụng thực tế không?'
  }
];

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `**Xin chào bạn!** 👋\n\nTôi là **Trợ lý AI Tư vấn Tuyển sinh & Đào tạo Tiếng Trung** của Trung tâm Đào tạo Bưu chính Viễn thông (**PTTC** - Học viện CNBCVT).\n\nTôi có thể giúp bạn giải đáp mọi thông tin về:\n* 📘 **Lộ trình học HSK 1 – HSK 3** (chuẩn HSK 3.0 & Tiếng Trung Ứng dụng)\n* 💰 **Học phí & Chính sách học bổng / ưu đãi** dành cho sinh viên PTIT và nhóm bạn\n* 🕒 **Thời lượng, lịch học, hình thức đào tạo và cam kết đầu ra**\n\nBạn có thể chọn một trong các câu hỏi gợi ý bên dưới hoặc gửi thắc mắc của mình nhé!`
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [sessionId, setSessionId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize session ID
  useEffect(() => {
    const savedSession = localStorage.getItem('pttc_chat_session') || 'session_' + Math.random().toString(36).substring(2, 9);
    setSessionId(savedSession);
    localStorage.setItem('pttc_chat_session', savedSession);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || inputMessage.trim();
    if (!query || isLoading) return;

    setInputMessage('');
    const userMsg: Message = { role: 'user', content: query };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const endpoint = apiUrl ? `${apiUrl}/api/chat` : '/api/chat';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          message: query,
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error('API network error');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantMsg: Message = {
        role: 'assistant',
        content: '',
        sources: []
      };

      setMessages((prev) => [...prev, assistantMsg]);

      let buffer = '';
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.substring(6).trim();
            if (!dataStr) continue;

            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.type === 'meta') {
                assistantMsg.sources = parsed.sources;
                if (parsed.session_id) setSessionId(parsed.session_id);
              } else if (parsed.type === 'token') {
                assistantMsg.content += parsed.content;
              }

              // Update the last assistant message
              setMessages((prev) => {
                const copy = [...prev];
                copy[copy.length - 1] = { ...assistantMsg };
                return copy;
              });
            } catch (err) {
              console.error('SSE JSON parse error:', err);
            }
          }
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: '⚠️ Rất tiếc, đã có lỗi kết nối tạm thời tới hệ thống tư vấn AI. Vui lòng thử lại sau vài giây hoặc liên hệ trực tiếp với PTTC nhé!'
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetChat = () => {
    const newSession = 'session_' + Math.random().toString(36).substring(2, 9);
    setSessionId(newSession);
    localStorage.setItem('pttc_chat_session', newSession);
    setMessages([
      {
        id: 'welcome_reset',
        role: 'assistant',
        content: `**Đoạn hội thoại đã được làm mới!** ✨\n\nBạn đang quan tâm đến nội dung nào của khóa học Tiếng Trung PTTC (HSK 1-3, Học phí, Lịch học, Học bổng...)? Tôi luôn sẵn sàng hỗ trợ bạn!`
      }
    ]);
  };

  return (
    <div className="flex h-screen flex-col bg-slate-50 text-slate-800 font-sans">
      {/* Header */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-200/80 bg-white/90 px-4 py-3 backdrop-blur-md shadow-sm sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-red-600 to-red-700 text-white shadow-md shadow-red-500/20">
            <GraduationCap className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-slate-900 text-base sm:text-lg tracking-tight">
                Tiếng Trung PTTC
              </h1>
              <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                Online
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Trung tâm Đào tạo Bưu chính Viễn thông – PTIT
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleResetChat}
            className="flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 transition"
            title="Làm mới cuộc trò chuyện"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Làm mới</span>
          </button>
        </div>
      </header>

      {/* Main Chat Container */}
      <main className="flex-1 overflow-y-auto px-3 py-4 sm:px-6 lg:px-8 max-w-4xl w-full mx-auto space-y-4">
        {/* Banner Highlight */}
        <div className="rounded-2xl bg-gradient-to-r from-red-50 via-orange-50 to-amber-50 p-4 border border-red-100 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-red-600/10 p-2 text-red-600 mt-0.5">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="flex-1 text-xs text-slate-700">
              <span className="font-bold text-red-700 text-sm block mb-0.5">
                Chương trình Tiếng Trung Ứng dụng & Lộ trình HSK 1–3 PTTC
              </span>
              Học chuẩn HSK 3.0 kết hợp giao tiếp thực tế và ứng dụng công việc. Ưu đãi học phí và học bổng theo từng đợt tuyển sinh dành cho sinh viên PTIT.
            </div>
          </div>
        </div>

        {/* Message List */}
        <div className="space-y-4 pt-2">
          {messages.map((msg, index) => {
            const isBot = msg.role === 'assistant';
            return (
              <div
                key={index}
                className={`flex gap-3 ${isBot ? 'justify-start' : 'justify-end'} animate-in fade-in duration-300`}
              >
                {isBot && (
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-red-600 to-red-700 text-white shadow-sm">
                    <Bot className="h-5 w-5" />
                  </div>
                )}

                <div
                  className={`relative max-w-[88%] sm:max-w-[78%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                    isBot
                      ? 'bg-white text-slate-800 border border-slate-200/80 rounded-tl-sm'
                      : 'bg-gradient-to-tr from-red-600 to-red-700 text-white rounded-tr-sm'
                  }`}
                >
                  {isBot ? (
                    <div className="prose prose-sm prose-slate max-w-none prose-p:leading-relaxed prose-pre:bg-slate-900 prose-pre:text-slate-100">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {msg.content}
                      </ReactMarkdown>
                      {msg.sources && msg.sources.length > 0 && (
                        <SourceCitations sources={msg.sources} />
                      )}
                    </div>
                  ) : (
                    <div className="whitespace-pre-wrap leading-relaxed font-normal">
                      {msg.content}
                    </div>
                  )}
                </div>

                {!isBot && (
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-800 text-white shadow-sm">
                    <User className="h-5 w-5" />
                  </div>
                )}
              </div>
            );
          })}

          {isLoading && (
            <div className="flex gap-3 justify-start items-center">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-600 text-white animate-pulse">
                <Bot className="h-5 w-5" />
              </div>
              <div className="rounded-2xl bg-white border border-slate-200 px-4 py-3 text-sm shadow-sm flex items-center gap-2 text-slate-500">
                <span className="h-2 w-2 rounded-full bg-red-500 animate-ping" />
                <span>AI đang tìm kiếm tài liệu và soạn phản hồi...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Prompts Suggestions (Show when only initial greeting is present) */}
        {messages.length <= 1 && (
          <div className="pt-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
              Câu hỏi thường gặp gợi ý:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {QUICK_PROMPTS.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(item.query)}
                  className="flex items-center justify-between rounded-xl bg-white border border-slate-200/90 p-3 text-left shadow-xs hover:border-red-300 hover:bg-red-50/40 transition group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-slate-100 group-hover:bg-white transition">
                      {item.icon}
                    </div>
                    <span className="text-xs font-medium text-slate-700 group-hover:text-red-700 transition">
                      {item.title}
                    </span>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-red-500 transition" />
                </button>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Input Area */}
      <footer className="sticky bottom-0 z-20 border-t border-slate-200/80 bg-white/95 px-3 py-3 backdrop-blur-md sm:px-6">
        <div className="max-w-4xl mx-auto">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Đặt câu hỏi về khóa học tiếng Trung PTTC (ví dụ: Lộ trình HSK, học phí, ưu đãi...)"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                disabled={isLoading}
                className="w-full rounded-2xl border border-slate-300 bg-slate-50/70 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-red-500 focus:bg-white focus:ring-2 focus:ring-red-100 disabled:opacity-50"
              />
            </div>

            <button
              type="submit"
              disabled={!inputMessage.trim() || isLoading}
              className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-r from-red-600 to-red-700 text-white shadow-md shadow-red-500/20 hover:from-red-700 hover:to-red-800 transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Send className="h-5 w-5" />
            </button>
          </form>

          <p className="mt-2 text-center text-[11px] text-slate-400">
            Thông tin được AI tổng hợp dựa trên cơ sở tri thức đào tạo và Q&A chính thức của Trung tâm Đào tạo Bưu chính Viễn thông.
          </p>
        </div>
      </footer>
    </div>
  );
}
