"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, X } from "lucide-react";

interface Notice {
  id: string;
  title: string;
  content: string;
  type: string;
}

export default function NoticeBanner() {
  const [urgentNotice, setUrgentNotice] = useState<Notice | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    fetch("/api/session/today")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.urgentNotice) {
          setUrgentNotice(data.urgentNotice);
        }
      })
      .catch((err) => console.error("Notice banner error:", err));
  }, []);

  if (!urgentNotice || dismissed) return null;

  return (
    <div className="bg-gradient-to-r from-amber-500 via-rose-500 to-red-600 text-white shadow-md animate-pulse">
      <div className="max-w-6xl mx-auto px-4 py-2.5 sm:px-6 flex items-center justify-between gap-3 text-xs sm:text-sm">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 text-amber-200 animate-bounce" />
          <div>
            <span className="font-extrabold mr-1.5 underline decoration-2">{urgentNotice.title}</span>
            <span>{urgentNotice.content}</span>
          </div>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="p-1 rounded-md hover:bg-white/20 transition-colors flex-shrink-0"
          aria-label="공지 닫기"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
