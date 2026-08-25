import React, { useState } from 'react';
import { UserCheck, X, CheckCircle, Sparkles } from 'lucide-react';

interface LeadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LeadModal({ isOpen, onClose }: LeadModalProps) {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [targetLevel, setTargetLevel] = useState('Combo HSK 1–3');
  const [university, setUniversity] = useState('PTIT');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !phone) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('http://127.0.0.1:8000/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName,
          phone,
          email,
          target_level: targetLevel,
          university,
          note,
        }),
      });
      if (res.ok) {
        setSubmitted(true);
        setTimeout(() => {
          setSubmitted(false);
          onClose();
        }, 2500);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-100">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
        >
          <X className="h-5 w-5" />
        </button>

        {submitted ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mb-4 animate-bounce">
              <CheckCircle className="h-10 w-10" />
            </div>
            <h3 className="text-xl font-bold text-slate-800">Đăng ký thành công!</h3>
            <p className="mt-2 text-sm text-slate-600 max-w-xs">
              Thầy cô tư vấn PTTC sẽ liên hệ với bạn trong thời gian sớm nhất để gửi ưu đãi và hỗ trợ chi tiết.
            </p>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-2 mb-2 text-red-600">
              <Sparkles className="h-5 w-5" />
              <span className="text-xs font-semibold uppercase tracking-wider">Đăng ký nhận học bổng & ưu đãi</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900">Nhận Tư Vấn Khóa Học Tiếng Trung PTTC</h2>
            <p className="text-xs text-slate-500 mt-1 mb-5">
              Để lại thông tin để nhận lộ trình HSK 1–3, ưu đãi dành riêng cho sinh viên PTIT và lịch khai giảng mới nhất.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Họ và tên <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Nguyễn Văn A"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-100"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Số điện thoại / Zalo <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="0987xxxxxx"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Mục tiêu cấp độ</label>
                  <select
                    value={targetLevel}
                    onChange={(e) => setTargetLevel(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-100 bg-white"
                  >
                    <option value="HSK 1 (Nền tảng)">HSK 1 (Người mới bắt đầu)</option>
                    <option value="HSK 2 (Mở rộng)">HSK 2 (Đã có nền tảng)</option>
                    <option value="HSK 3 (Ứng dụng)">HSK 3 (Nâng cao & Giao tiếp)</option>
                    <option value="Combo HSK 1–3">Trọn gói Combo HSK 1–3</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Trường / Đối tượng</label>
                  <select
                    value={university}
                    onChange={(e) => setUniversity(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-100 bg-white"
                  >
                    <option value="PTIT">Sinh viên PTIT (Học viện CNBCVT)</option>
                    <option value="Đại học khác">Sinh viên Đại học khác</option>
                    <option value="Người đi làm">Người đi làm / Tự do</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Ghi chú hoặc câu hỏi thêm</label>
                <textarea
                  rows={2}
                  placeholder="Ví dụ: Cần tư vấn lịch học buổi tối, chính sách học phí sinh viên..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-sm outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-100 resize-none"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 py-3 text-sm font-semibold text-white shadow-md shadow-red-500/20 hover:from-red-700 hover:to-red-800 transition disabled:opacity-50"
                >
                  <UserCheck className="h-4 w-4" />
                  {isSubmitting ? 'Đang gửi thông tin...' : 'Gửi Đăng Ký Tư Vấn Ngay'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
