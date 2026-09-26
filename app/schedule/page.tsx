"use client";

import { useEffect, useState } from "react";
import {
  Calendar as CalendarIcon,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Users,
  Flame,
} from "lucide-react";

interface SessionItem {
  id: string;
  date: string;
  dayOfWeek: string;
  sessionNumber: number;
  isOpen: boolean;
  maxCapacity: number;
  isDoubleMileage: boolean;
  status: "READY" | "OPEN" | "CLOSED" | "CANCELLED";
  cancelReason?: string;
  notice?: string;
  appliedCount: number;
  certifiedCount: number;
}

interface NoticeItem {
  id: string;
  title: string;
  content: string;
  type: string;
}

export default function SchedulePage() {
  const [sessions, setSessions] = useState<SessionItem[]>([]);
  const [notices, setNotices] = useState<NoticeItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/schedule")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setSessions(data.sessions || []);
          setNotices(data.notices || []);
        }
      })
      .catch((err) => console.error("Schedule error:", err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold">
          <CalendarIcon className="w-3.5 h-3.5" />
          신도림중 아침달리기 캘린더
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
          운영 일정 및 차시별 현황
        </h1>
        <p className="text-sm text-slate-500">
          매주 <strong>월, 화, 수, 목요일 아침 07:50 ~ 08:25</strong>에 학교 운동장에서 진행됩니다.
        </p>
      </div>

      {/* Weekly Pattern Card */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {[
          { day: "월요일", time: "07:50 - 08:25", tag: "정규 러닝", color: "blue" },
          { day: "화요일", time: "07:50 - 08:25", tag: "정규 러닝", color: "blue" },
          { day: "수요일", time: "07:50 - 08:25", tag: "마일리지 x2 데이!", color: "purple", isBonus: true },
          { day: "목요일", time: "07:50 - 08:25", tag: "정규 러닝", color: "blue" },
        ].map((item, idx) => (
          <div
            key={idx}
            className={`p-4 rounded-2xl border text-center transition-all ${
              item.isBonus
                ? "bg-gradient-to-b from-purple-50 to-indigo-50/50 border-purple-200 shadow-sm"
                : "bg-white border-slate-200 shadow-sm"
            }`}
          >
            <span
              className={`inline-block text-[11px] font-bold px-2 py-0.5 rounded-full mb-1.5 ${
                item.isBonus
                  ? "bg-purple-100 text-purple-700 font-extrabold"
                  : "bg-blue-50 text-blue-700"
              }`}
            >
              {item.tag}
            </span>
            <h2 className="text-base font-black text-slate-900">{item.day}</h2>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">{item.time}</p>
          </div>
        ))}
      </div>

      {/* Notice box if available */}
      {notices.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 sm:p-5 space-y-2">
          <div className="flex items-center gap-2 text-amber-800 font-bold text-sm">
            <AlertCircle className="w-4 h-4 text-amber-600" />
            건강안전부 운영 공지사항
          </div>
          <div className="space-y-1.5 text-xs sm:text-sm text-amber-900">
            {notices.map((n) => (
              <p key={n.id} className="leading-relaxed">
                • <strong>{n.title}</strong>: {n.content}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Session History & Upcoming Sessions */}
      <div className="space-y-4">
        <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
          <Flame className="w-5 h-5 text-orange-500" />
          차시별 운영 현황 기록
        </h2>

        {loading ? (
          <div className="text-center py-12 text-slate-400">일정을 불러오는 중입니다...</div>
        ) : sessions.length === 0 ? (
          <div className="text-center py-12 text-slate-400">등록된 차시가 없습니다.</div>
        ) : (
          <div className="space-y-3">
            {sessions
              .slice()
              .reverse()
              .map((session) => {
                const isDouble = session.isDoubleMileage;
                const isCancelled = session.status === "CANCELLED";
                const isOpen = session.status === "OPEN";

                return (
                  <div
                    key={session.id}
                    className={`bg-white rounded-2xl p-4 sm:p-5 border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                      isOpen
                        ? "border-emerald-300 ring-2 ring-emerald-500/20 shadow-md"
                        : isCancelled
                        ? "border-rose-200 bg-rose-50/20"
                        : "border-slate-200"
                    }`}
                  >
                    {/* Left: Info */}
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-black text-blue-700 bg-blue-100 px-2.5 py-0.5 rounded-md">
                          제 {session.sessionNumber}차시
                        </span>
                        <span className="text-sm font-extrabold text-slate-900">
                          {session.date} ({session.dayOfWeek})
                        </span>

                        {isDouble && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-black text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">
                            <Sparkles className="w-3 h-3 text-purple-600" />
                            마일리지 2배(x2)
                          </span>
                        )}

                        {isOpen ? (
                          <span className="text-[11px] font-extrabold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                            오늘 접수 중
                          </span>
                        ) : isCancelled ? (
                          <span className="text-[11px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full">
                            취소됨 ({session.cancelReason || "기상 악화"})
                          </span>
                        ) : (
                          <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                            진행 완료
                          </span>
                        )}
                      </div>

                      {session.notice && (
                        <p className="text-xs text-purple-700 font-medium">
                          ✨ {session.notice}
                        </p>
                      )}
                    </div>

                    {/* Right: Stats */}
                    <div className="flex items-center gap-4 text-xs sm:text-sm font-semibold text-slate-600 border-t sm:border-t-0 pt-2 sm:pt-0">
                      <div className="flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-slate-400" />
                        <span>
                          신청: <strong className="text-slate-900">{session.appliedCount}</strong> / 30명
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>
                          완주 인증: <strong className="text-emerald-700">{session.certifiedCount}</strong>명
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
}
