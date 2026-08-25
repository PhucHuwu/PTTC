import React, { useState } from 'react';
import { ChevronDown, ChevronUp, BookOpen, ExternalLink } from 'lucide-react';

interface SourceItem {
  id: string;
  source: string;
  snippet: string;
}

interface SourceCitationsProps {
  sources: SourceItem[];
}

export default function SourceCitations({ sources }: SourceCitationsProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!sources || sources.length === 0) return null;

  return (
    <div className="mt-3 pt-2 border-t border-slate-100/80 text-xs">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-1.5 text-slate-500 hover:text-red-600 transition font-medium"
      >
        <BookOpen className="h-3.5 w-3.5" />
        <span>Trích xuất từ {sources.length} tài liệu chính thức PTTC</span>
        {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
      </button>

      {isExpanded && (
        <div className="mt-2 space-y-1.5 animate-in fade-in duration-200">
          {sources.map((src, i) => (
            <div
              key={i}
              className="rounded-lg bg-slate-50 border border-slate-100 p-2.5 text-slate-600 hover:bg-red-50/50 hover:border-red-100 transition"
            >
              <div className="flex items-center justify-between font-semibold text-slate-700 text-[11px] mb-1">
                <span className="text-red-600">📄 {src.source}</span>
                <span className="text-[10px] text-slate-400">ID: {src.id}</span>
              </div>
              <p className="line-clamp-2 text-slate-600 leading-relaxed text-[11px]">
                {src.snippet}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
