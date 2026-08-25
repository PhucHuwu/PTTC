import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Trợ lý AI Tư Vấn Tiếng Trung PTTC - PTIT',
  description: 'Chatbot AI tư vấn lộ trình học tiếng Trung ứng dụng HSK 1 - HSK 3 của Trung tâm Đào tạo Bưu chính Viễn thông (PTTC)',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body className="antialiased selection:bg-red-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
