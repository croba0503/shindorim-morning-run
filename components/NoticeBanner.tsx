"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

interface SessionData {
  id: string;
  date: string;
  status: "READY" | "OPEN" | "CLOSED" | "CANCELLED" | "OFF";
  cancelReason?: string;
}

export default function NoticeBanner() {
  const [session, setSession] = useState<SessionData | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    fetch("/api/session/today")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.session) {
          const todayKST = new Intl.DateTimeFormat("en-CA", {
            timeZone: "Asia/Seoul",
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
          }).format(new Date());

          if (data.session.date === todayKST) {
            setSession(data.session);
          }
        }
      })
      .catch((err) => console.error("Notice banner error:", err));
  }, []);

  if (!session || dismissed) return null;

  if (session.status === "CANCELLED") {
    return (
      <div className="bg-gradient-to-r from-rose-600 to-red-600 text-white py-2.5 px-4 text-xs sm:text-sm font-black shadow-md flex items-center justify-between gap-2 z-50 sticky top-0">
        <div className="flex items-center gap-2 max-w-6xl mx-auto flex-1 justify-center sm:justify-start">
          <span>
            🌧️ 긴급 공지: 오늘({session.date}) 아침달리기는 우천(기상 악화)으로 인해 취소되었습니다. ({session.cancelReason || "안전사고 예방"})
          </span>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="p-1 rounded-lg hover:bg-white/20 transition-colors text-white/90 hover:text-white flex-shrink-0"
          title="배너 닫기"
          aria-label="배너 닫기"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  if (session.status === "OFF") {
    return (
      <div className="bg-gradient-to-r from-slate-700 via-slate-800 to-zinc-800 text-white py-2.5 px-4 text-xs sm:text-sm font-bold shadow-md border-b border-slate-600/50 flex items-center justify-between gap-2 z-50 sticky top-0">
        <div className="flex items-center gap-2 max-w-6xl mx-auto flex-1 justify-center sm:justify-start">
          <span>
            📢 안내: 오늘({session.date})은 아침달리기 정기 미운영일입니다. ({session.cancelReason || "주말 및 공휴일/학사일정"})
          </span>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="p-1 rounded-lg hover:bg-white/20 transition-colors text-white/90 hover:text-white flex-shrink-0"
          title="배너 닫기"
          aria-label="배너 닫기"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return null;
}
