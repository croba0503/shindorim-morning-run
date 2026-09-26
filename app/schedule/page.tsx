"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Users,
  Flame,
  Clock,
  Ban,
  CalendarDays,
  List,
  ArrowRight,
  Info,
} from "lucide-react";

interface SessionItem {
  id: string;
  date: string; // YYYY-MM-DD
  dayOfWeek: string;
  sessionNumber: number;
  isOpen: boolean;
  maxCapacity: number;
  isDoubleMileage: boolean;
  status: "READY" | "OPEN" | "CLOSED" | "CANCELLED" | "OFF";
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

  // Month navigation: default to today (or September 2026 if in demo)
  const [currentDate, setCurrentDate] = useState(() => {
    // If today is 2026, use today, otherwise use the date of the latest session
    return new Date();
  });

  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"calendar" | "list">("calendar");
  const [listFilter, setListFilter] = useState<"ALL" | "SESSION" | "OFF">("ALL");

  useEffect(() => {
    fetch("/api/schedule")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          const fetchedSessions: SessionItem[] = data.sessions || [];
          setSessions(fetchedSessions);
          setNotices(data.notices || []);

          // If there are sessions, set calendar view to the most relevant session month
          if (fetchedSessions.length > 0) {
            const todayStr = new Date().toISOString().slice(0, 10);
            const todaySession = fetchedSessions.find((s) => s.date === todayStr);
            if (todaySession) {
              setSelectedDateStr(todayStr);
            } else {
              // Select the latest session
              const sorted = [...fetchedSessions].sort((a, b) => b.date.localeCompare(a.date));
              setSelectedDateStr(sorted[0].date);
              const [y, m] = sorted[0].date.split("-").map(Number);
              setCurrentDate(new Date(y, m - 1, 1));
            }
          }
        }
      })
      .catch((err) => console.error("Schedule error:", err))
      .finally(() => setLoading(false));
  }, []);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed (0 = Jan, 8 = Sep)

  // Navigation handlers
  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleGoToday = () => {
    const now = new Date();
    setCurrentDate(new Date(now.getFullYear(), now.getMonth(), 1));
    const todayStr = now.toISOString().slice(0, 10);
    setSelectedDateStr(todayStr);
  };

  // Calendar calculations
  const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0 = Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();

  // Create grid cells
  const calendarDays: Array<{
    dateStr: string;
    dayNumber: number;
    isCurrentMonth: boolean;
    dayOfWeekIndex: number;
  }> = [];

  // Previous month trailing days
  for (let i = firstDayOfWeek - 1; i >= 0; i--) {
    const d = prevMonthDays - i;
    const prevM = month === 0 ? 12 : month;
    const prevY = month === 0 ? year - 1 : year;
    const dateStr = `${prevY}-${String(prevM).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    calendarDays.push({
      dateStr,
      dayNumber: d,
      isCurrentMonth: false,
      dayOfWeekIndex: new Date(prevY, prevM - 1, d).getDay(),
    });
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    calendarDays.push({
      dateStr,
      dayNumber: d,
      isCurrentMonth: true,
      dayOfWeekIndex: new Date(year, month, d).getDay(),
    });
  }

  // Next month leading days to complete 35 or 42 grid cells
  const remainingCells = (7 - (calendarDays.length % 7)) % 7;
  for (let d = 1; d <= remainingCells; d++) {
    const nextM = month === 11 ? 1 : month + 2;
    const nextY = month === 11 ? year + 1 : year;
    const dateStr = `${nextY}-${String(nextM).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    calendarDays.push({
      dateStr,
      dayNumber: d,
      isCurrentMonth: false,
      dayOfWeekIndex: new Date(nextY, nextM - 1, d).getDay(),
    });
  }

  // Quick Stats for current month
  const currentMonthStr = `${year}-${String(month + 1).padStart(2, "0")}`;
  const currentMonthSessions = sessions.filter((s) => s.date.startsWith(currentMonthStr));
  const activeRunCount = currentMonthSessions.filter((s) => s.status !== "OFF").length;
  const offRunCount = currentMonthSessions.filter((s) => s.status === "OFF").length;
  const doubleMileageCount = currentMonthSessions.filter((s) => s.isDoubleMileage && s.status !== "OFF").length;

  const todayStr = new Date().toISOString().slice(0, 10);
  const selectedSession = sessions.find((s) => s.date === selectedDateStr);

  // Filtered sessions for List View
  const filteredList = currentMonthSessions
    .sort((a, b) => a.date.localeCompare(b.date))
    .filter((s) => {
      if (listFilter === "SESSION") return s.status !== "OFF";
      if (listFilter === "OFF") return s.status === "OFF";
      return true;
    });

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold">
            <CalendarIcon className="w-3.5 h-3.5" />
            신도림중 아침달리기 월간 캘린더
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
            아침달리기 월별 일정
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            매주 <strong>월, 화, 수, 목요일 아침 07:50 ~ 08:25</strong> 운영 현황 및 미운영일을 확인하세요.
          </p>
        </div>

        {/* View Switcher */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl self-start sm:self-auto border border-slate-200">
          <button
            onClick={() => setViewMode("calendar")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
              viewMode === "calendar"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <CalendarDays className="w-4 h-4" />
            달력 보기
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
              viewMode === "list"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-slate-500 hover:text-slate-900"
            }`}
          >
            <List className="w-4 h-4" />
            목록 보기
          </button>
        </div>
      </div>

      {/* Month Navigator & Summary Stats */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Month Switcher */}
          <div className="flex items-center gap-3">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {year}년 {month + 1}월
            </h2>
            <div className="flex items-center gap-1">
              <button
                onClick={handlePrevMonth}
                className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
                title="이전 달"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNextMonth}
                className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
                title="다음 달"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={handleGoToday}
                className="px-2.5 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-extrabold text-blue-600 transition-colors ml-1"
              >
                오늘
              </button>
            </div>
          </div>

          {/* Quick Month Metrics */}
          <div className="flex items-center gap-2 flex-wrap text-xs font-bold">
            <span className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 border border-blue-100 flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-blue-600" />
              운영 차시: <strong>{activeRunCount}회</strong>
            </span>
            {doubleMileageCount > 0 && (
              <span className="px-3 py-1.5 rounded-xl bg-purple-50 text-purple-700 border border-purple-100 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                마일리지 2배: <strong>{doubleMileageCount}회</strong>
              </span>
            )}
            {offRunCount > 0 && (
              <span className="px-3 py-1.5 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1.5">
                <Ban className="w-3.5 h-3.5 text-amber-600" />
                미운영(휴무): <strong>{offRunCount}일</strong>
              </span>
            )}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 sm:gap-4 flex-wrap text-[11px] font-bold text-slate-500 pt-2 border-t border-slate-100">
          <span className="text-slate-400">범례:</span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            신청 접수 중
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
            마일리지 2배 데이
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
            운영 예정 / 진행 완료
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            우천/미세먼지 취소
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            🚫 미운영일 (휴무/시험 등)
          </span>
        </div>
      </div>

      {/* VIEW MODE 1: Monthly Calendar */}
      {viewMode === "calendar" && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
            {/* Day of Week Header */}
            <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-200 text-center py-2.5 text-xs font-black">
              <span className="text-rose-600">일</span>
              <span className="text-slate-700">월</span>
              <span className="text-slate-700">화</span>
              <span className="text-slate-700">수</span>
              <span className="text-slate-700">목</span>
              <span className="text-slate-700">금</span>
              <span className="text-blue-600">토</span>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 divide-x divide-y divide-slate-100">
              {calendarDays.map((item, idx) => {
                const session = sessions.find((s) => s.date === item.dateStr);
                const isSelected = selectedDateStr === item.dateStr;
                const isToday = item.dateStr === todayStr;
                const isWeekend = item.dayOfWeekIndex === 0 || item.dayOfWeekIndex === 6;
                const isFriday = item.dayOfWeekIndex === 5;
                const isRegularNonRunDay = isWeekend || isFriday;

                const isOff = session?.status === "OFF";
                const isOpen = session?.status === "OPEN";
                const isCancelled = session?.status === "CANCELLED";
                const isClosed = session?.status === "CLOSED";
                const isReady = session?.status === "READY";
                const isDouble = session?.isDoubleMileage;

                return (
                  <div
                    key={idx}
                    onClick={() => {
                      setSelectedDateStr(item.dateStr);
                    }}
                    className={`min-h-[92px] sm:min-h-[110px] p-1.5 sm:p-2.5 flex flex-col justify-between cursor-pointer transition-all ${
                      !item.isCurrentMonth
                        ? "bg-slate-50/60 opacity-40"
                        : isSelected
                        ? "bg-blue-50/70 ring-2 ring-blue-600 z-10"
                        : "hover:bg-slate-50/80 bg-white"
                    }`}
                  >
                    {/* Top: Day Number & Badges */}
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs sm:text-sm font-black w-6 h-6 flex items-center justify-center rounded-full ${
                          isToday
                            ? "bg-blue-600 text-white shadow-sm"
                            : item.dayOfWeekIndex === 0
                            ? "text-rose-600"
                            : item.dayOfWeekIndex === 6
                            ? "text-blue-600"
                            : "text-slate-800"
                        }`}
                      >
                        {item.dayNumber}
                      </span>

                      {/* Bonus Icon */}
                      {isDouble && !isOff && (
                        <span className="p-0.5 rounded-full bg-purple-100 text-purple-700" title="마일리지 2배 데이">
                          <Sparkles className="w-3 h-3 text-purple-600" />
                        </span>
                      )}
                    </div>

                    {/* Middle & Bottom: Status Info */}
                    <div className="mt-1 space-y-1">
                      {session ? (
                        <>
                          {isOff ? (
                            <div className="p-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-800">
                              <span className="block text-[10px] sm:text-[11px] font-black leading-tight truncate">
                                🚫 미운영
                              </span>
                              <span className="hidden sm:block text-[9px] text-amber-700 truncate font-semibold">
                                {session.cancelReason || "휴무"}
                              </span>
                            </div>
                          ) : isOpen ? (
                            <div className="p-1 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-800 animate-pulse">
                              <span className="block text-[10px] sm:text-[11px] font-black leading-tight truncate flex items-center gap-0.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                                제{session.sessionNumber}차 접수중
                              </span>
                              <span className="hidden sm:block text-[9px] text-emerald-700 font-bold truncate">
                                {session.appliedCount}/30명
                              </span>
                            </div>
                          ) : isCancelled ? (
                            <div className="p-1 rounded-lg bg-rose-50 border border-rose-200 text-rose-700">
                              <span className="block text-[10px] sm:text-[11px] font-black leading-tight truncate">
                                ⚠️ 취소
                              </span>
                              <span className="hidden sm:block text-[9px] text-rose-600 truncate">
                                {session.cancelReason || "우천"}
                              </span>
                            </div>
                          ) : isClosed ? (
                            <div className="p-1 rounded-lg bg-slate-100 text-slate-700">
                              <span className="block text-[10px] sm:text-[11px] font-bold leading-tight truncate">
                                제{session.sessionNumber}차 완료
                              </span>
                              <span className="hidden sm:block text-[9px] text-slate-500 truncate">
                                완주 {session.certifiedCount}명
                              </span>
                            </div>
                          ) : isReady ? (
                            <div className="p-1 rounded-lg bg-blue-50 border border-blue-100 text-blue-700">
                              <span className="block text-[10px] sm:text-[11px] font-bold leading-tight truncate">
                                제{session.sessionNumber}차 예정
                              </span>
                              <span className="hidden sm:block text-[9px] text-blue-500 truncate">
                                07:50 시작
                              </span>
                            </div>
                          ) : null}
                        </>
                      ) : (
                        <div className="hidden sm:block">
                          {isRegularNonRunDay ? (
                            <span className="text-[10px] font-medium text-slate-300 block truncate">
                              정기 미운영
                            </span>
                          ) : (
                            <span className="text-[10px] font-medium text-slate-400 block truncate">
                              운영 예정
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected Date Detail Drawer / Card */}
          {selectedDateStr && (
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-3xl p-6 text-white shadow-xl space-y-4 animate-scale-up">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
                <div>
                  <span className="text-xs font-bold text-blue-400 uppercase tracking-wider block">
                    선택 일자 세부 운영 현황
                  </span>
                  <h3 className="text-xl sm:text-2xl font-black flex items-center gap-2">
                    {selectedDateStr}
                    {selectedSession ? ` (${selectedSession.dayOfWeek}요일)` : ""}
                  </h3>
                </div>

                <div>
                  {selectedSession ? (
                    selectedSession.status === "OFF" ? (
                      <span className="px-3.5 py-1.5 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 font-black text-xs inline-flex items-center gap-1.5">
                        <Ban className="w-3.5 h-3.5" />
                        아침달리기 미운영일
                      </span>
                    ) : selectedSession.status === "OPEN" ? (
                      <span className="px-3.5 py-1.5 rounded-full bg-emerald-500 text-white font-black text-xs inline-flex items-center gap-1.5 shadow-md shadow-emerald-500/30">
                        <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                        선착순 신청 접수 중
                      </span>
                    ) : selectedSession.status === "CANCELLED" ? (
                      <span className="px-3.5 py-1.5 rounded-full bg-rose-500/20 border border-rose-400 text-rose-300 font-black text-xs inline-flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5" />
                        기상 악화 취소
                      </span>
                    ) : selectedSession.status === "CLOSED" ? (
                      <span className="px-3.5 py-1.5 rounded-full bg-white/15 text-slate-200 font-bold text-xs inline-flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        진행 완료
                      </span>
                    ) : (
                      <span className="px-3.5 py-1.5 rounded-full bg-blue-500/20 text-blue-300 font-bold text-xs inline-flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        운영 준비 중
                      </span>
                    )
                  ) : (
                    <span className="px-3.5 py-1.5 rounded-full bg-white/10 text-slate-300 text-xs font-semibold">
                      별도 등록된 일정 없음
                    </span>
                  )}
                </div>
              </div>

              {selectedSession ? (
                selectedSession.status === "OFF" ? (
                  <div className="bg-white/10 rounded-2xl p-5 border border-white/10 space-y-2">
                    <div className="flex items-center gap-2 text-amber-300 font-extrabold text-sm sm:text-base">
                      <Ban className="w-5 h-5 text-amber-400" />
                      이 날은 아침달리기를 운영하지 않습니다.
                    </div>
                    <p className="text-sm text-slate-200 leading-relaxed">
                      미운영 사유:{" "}
                      <strong className="text-white underline decoration-amber-400 underline-offset-4">
                        {selectedSession.cancelReason || selectedSession.notice || "정기 휴무 및 학교 학사 일정"}
                      </strong>
                    </p>
                    <p className="text-xs text-slate-400">
                      * 운영일(월~목) 아침 07:50에 운동장에서 만나요!
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-white/10 rounded-2xl p-4 border border-white/10">
                      <span className="text-[11px] font-bold text-slate-400 block mb-1">
                        차시 정보 및 시간
                      </span>
                      <div className="text-lg font-black text-white">
                        제 {selectedSession.sessionNumber}차시
                      </div>
                      <div className="text-xs text-blue-300 font-medium mt-0.5">
                        07:50 ~ 08:25 (운동장)
                      </div>
                    </div>

                    <div className="bg-white/10 rounded-2xl p-4 border border-white/10">
                      <span className="text-[11px] font-bold text-slate-400 block mb-1">
                        참가 신청 / 완주 인원
                      </span>
                      <div className="text-lg font-black text-white">
                        신청 {selectedSession.appliedCount} / {selectedSession.maxCapacity || 30}명
                      </div>
                      <div className="text-xs text-emerald-400 font-medium mt-0.5">
                        완주 인증 {selectedSession.certifiedCount}명 완료
                      </div>
                    </div>

                    <div className="bg-white/10 rounded-2xl p-4 border border-white/10">
                      <span className="text-[11px] font-bold text-slate-400 block mb-1">
                        마일리지 혜택
                      </span>
                      <div className="text-lg font-black text-purple-300 flex items-center gap-1.5">
                        {selectedSession.isDoubleMileage ? (
                          <>
                            <Sparkles className="w-5 h-5 text-purple-400" />
                            마일리지 2배 데이!
                          </>
                        ) : (
                          "기본 1배 적립"
                        )}
                      </div>
                      <div className="text-xs text-slate-400 font-medium mt-0.5">
                        2km 완주 시 적립
                      </div>
                    </div>

                    {selectedSession.notice && (
                      <div className="sm:col-span-3 p-3.5 rounded-xl bg-purple-900/40 border border-purple-500/30 text-xs text-purple-200">
                        📢 {selectedSession.notice}
                      </div>
                    )}

                    {selectedSession.status === "OPEN" && (
                      <div className="sm:col-span-3 pt-2">
                        <Link
                          href="/apply"
                          className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/30 transition-all active:scale-95"
                        >
                          오늘 아침달리기 지금 바로 참가신청하기
                          <ArrowRight className="w-4 h-4" />
                        </Link>
                      </div>
                    )}
                  </div>
                )
              ) : (
                <div className="bg-white/5 rounded-2xl p-5 text-slate-400 text-xs sm:text-sm">
                  해당 날짜에 등록된 특이사항이 없습니다. 신도림중 아침달리기는 기본적으로 매주 월~목요일 아침에 진행됩니다.
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* VIEW MODE 2: Monthly List */}
      {viewMode === "list" && (
        <div className="space-y-4">
          {/* List Filter Tabs */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setListFilter("ALL")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                listFilter === "ALL"
                  ? "bg-slate-900 text-white"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              전체 일정 ({currentMonthSessions.length})
            </button>
            <button
              onClick={() => setListFilter("SESSION")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                listFilter === "SESSION"
                  ? "bg-blue-600 text-white"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              운영 차시만 ({activeRunCount})
            </button>
            <button
              onClick={() => setListFilter("OFF")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                listFilter === "OFF"
                  ? "bg-amber-600 text-white"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              미운영일만 ({offRunCount})
            </button>
          </div>

          {filteredList.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center text-slate-400 border border-slate-200">
              해당 월에 등록된 일정이 없습니다.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredList.map((session) => {
                const isOff = session.status === "OFF";
                const isOpen = session.status === "OPEN";
                const isCancelled = session.status === "CANCELLED";
                const isDouble = session.isDoubleMileage;

                return (
                  <div
                    key={session.id}
                    className={`bg-white rounded-2xl p-4 sm:p-5 border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                      isOff
                        ? "border-amber-200 bg-amber-50/20"
                        : isOpen
                        ? "border-emerald-300 ring-2 ring-emerald-500/20 shadow-md"
                        : isCancelled
                        ? "border-rose-200 bg-rose-50/20"
                        : "border-slate-200"
                    }`}
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        {isOff ? (
                          <span className="text-xs font-black text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-md flex items-center gap-1">
                            <Ban className="w-3 h-3 text-amber-600" />
                            미운영일
                          </span>
                        ) : (
                          <span className="text-xs font-black text-blue-700 bg-blue-100 px-2.5 py-0.5 rounded-md">
                            제 {session.sessionNumber}차시
                          </span>
                        )}

                        <span className="text-sm font-extrabold text-slate-900">
                          {session.date} ({session.dayOfWeek})
                        </span>

                        {isDouble && !isOff && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-black text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">
                            <Sparkles className="w-3 h-3 text-purple-600" />
                            마일리지 2배(x2)
                          </span>
                        )}

                        {isOff ? (
                          <span className="text-[11px] font-bold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full">
                            {session.cancelReason || "휴무"}
                          </span>
                        ) : isOpen ? (
                          <span className="text-[11px] font-extrabold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                            오늘 접수 중
                          </span>
                        ) : isCancelled ? (
                          <span className="text-[11px] font-bold text-rose-700 bg-rose-100 px-2.5 py-0.5 rounded-full">
                            취소됨 ({session.cancelReason || "기상 악화"})
                          </span>
                        ) : (
                          <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full">
                            진행 완료
                          </span>
                        )}
                      </div>

                      {isOff ? (
                        <p className="text-xs text-amber-900 font-medium">
                          🚫 미운영 사유: {session.cancelReason || "학교 학사 일정 및 휴무"}
                        </p>
                      ) : (
                        session.notice && (
                          <p className="text-xs text-purple-700 font-medium">
                            ✨ {session.notice}
                          </p>
                        )
                      )}
                    </div>

                    {!isOff && (
                      <div className="flex items-center gap-4 text-xs sm:text-sm font-semibold text-slate-600 border-t sm:border-t-0 pt-2 sm:pt-0">
                        <div className="flex items-center gap-1.5">
                          <Users className="w-4 h-4 text-slate-400" />
                          <span>
                            신청: <strong className="text-slate-900">{session.appliedCount}</strong> / {session.maxCapacity || 30}명
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>
                            완주: <strong className="text-emerald-700">{session.certifiedCount}</strong>명
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Notice box if available */}
      {notices.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-3xl p-5 space-y-2">
          <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
            <AlertCircle className="w-4 h-4 text-amber-600" />
            건강안전부 아침달리기 운영 안내
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
    </div>
  );
}
