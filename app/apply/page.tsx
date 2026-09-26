"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import confetti from "canvas-confetti";
import {
  UserCheck,
  KeyRound,
  User,
  Hash,
  AlertCircle,
  CheckCircle2,
  Flame,
  ArrowRight,
  Clock,
  Sparkles,
  Ticket,
} from "lucide-react";

interface TodaySessionInfo {
  session: {
    id: string;
    date: string;
    dayOfWeek: string;
    sessionNumber: number;
    isOpen: boolean;
    maxCapacity: number;
    isDoubleMileage: boolean;
    status: string;
    cancelReason?: string;
    notice?: string;
  };
  stats: {
    applicantsCount: number;
    certifiedCount: number;
    maxCapacity: number;
    remainingSlots: number;
  };
  urgentNotice?: {
    title: string;
    content: string;
  };
}

interface TicketInfo {
  queueNumber: number;
  studentNumber: string;
  name: string;
  date: string;
  sessionNumber: number;
  isDoubleMileage: boolean;
}

export default function ApplyPage() {
  const [data, setData] = useState<TodaySessionInfo | null>(null);
  const [loading, setLoading] = useState(true);

  // Form states
  const [studentNumber, setStudentNumber] = useState("");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Ticket modal after success
  const [ticket, setTicket] = useState<TicketInfo | null>(null);

  const fetchTodaySession = async () => {
    try {
      const res = await fetch("/api/session/today");
      const json = await res.json();
      if (json.success) {
        setData(json);
      }
    } catch (err) {
      console.error("Failed to load session:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTodaySession();
    // Remember studentNumber and name from localStorage
    const savedNum = localStorage.getItem("sdr_student_number");
    const savedName = localStorage.getItem("sdr_student_name");
    if (savedNum) setStudentNumber(savedNum);
    if (savedName) setName(savedName);
  }, []);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!studentNumber.trim()) {
      setErrorMsg("학번을 입력해주세요. (예: 10301)");
      return;
    }
    if (!name.trim()) {
      setErrorMsg("이름을 입력해주세요.");
      return;
    }
    if (!code.trim() || code.trim().length !== 4) {
      setErrorMsg("선생님께 받은 4자리 숫자 참가코드를 입력해주세요.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentNumber: studentNumber.trim(),
          name: name.trim(),
          code: code.trim(),
        }),
      });

      const result = await res.json();
      if (result.success) {
        // Save to localStorage
        localStorage.setItem("sdr_student_number", studentNumber.trim());
        localStorage.setItem("sdr_student_name", name.trim());

        // Confetti!
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
        });

        setTicket(result.ticket);
        fetchTodaySession();
      } else {
        setErrorMsg(result.message || "신청에 실패했습니다.");
      }
    } catch (err) {
      console.error("Apply error:", err);
      setErrorMsg("네트워크 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setSubmitting(false);
    }
  };

  const isOpen = data?.session.isOpen && data?.session.status === "OPEN";
  const remaining = data?.stats.remainingSlots ?? 30;
  const isFull = remaining <= 0;

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Title */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold">
          <UserCheck className="w-3.5 h-3.5" />
          선착순 30명 아침달리기
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
          오늘의 참가신청
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          운동장 본부석에서 선생님께 4자리 코드를 확인한 후 신청서를 제출하세요!
        </p>
      </div>

      {/* Session Status & Capacity Card */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-600" />
            <span className="font-extrabold text-sm sm:text-base text-slate-800">
              {data ? `${data.session.date} (${data.session.dayOfWeek})` : "차시 확인 중..."}
            </span>
            {data?.session.sessionNumber && (
              <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                제 {data.session.sessionNumber}차시
              </span>
            )}
          </div>

          <div>
            {loading ? (
              <span className="text-xs text-slate-400">확인 중...</span>
            ) : isOpen && !isFull ? (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                신청 접수 중
              </span>
            ) : isFull ? (
              <span className="text-xs font-bold text-rose-700 bg-rose-100 px-3 py-1 rounded-full">
                선착순 30명 마감
              </span>
            ) : (
              <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
                {data?.session.status === "CANCELLED"
                  ? `취소됨 (${data.session.cancelReason || "기상 악화"})`
                  : data?.session.status === "OFF"
                  ? `🚫 미운영 (${data.session.cancelReason || "휴무"})`
                  : "신청 준비 중"}
              </span>
            )}
          </div>
        </div>

        {/* Bonus Badge */}
        {data?.session.isDoubleMileage && (
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 flex items-center gap-2 text-xs sm:text-sm text-purple-900 font-bold">
            <Sparkles className="w-4 h-4 text-purple-600 flex-shrink-0" />
            <span>오늘은 완주 시 마일리지 2배(x2) 적립 보너스 데이입니다!</span>
          </div>
        )}

        {/* Realtime Quota Bar */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs font-bold">
            <span className="text-slate-600">선착순 정원 현황</span>
            <span className="text-slate-900">
              현재 <strong className="text-blue-600 text-sm font-extrabold">{data ? data.stats.applicantsCount : 0}</strong> / 30명
              <span className="text-emerald-600 ml-1.5 font-bold">
                (잔여 {data ? data.stats.remainingSlots : 30}자리)
              </span>
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-3.5 overflow-hidden p-0.5 border border-slate-200">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                isFull
                  ? "bg-rose-500"
                  : "bg-gradient-to-r from-blue-500 to-emerald-500"
              }`}
              style={{
                width: `${Math.min(
                  100,
                  ((data?.stats.applicantsCount || 0) / 30) * 100
                )}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Application Form */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-5">
        <h2 className="text-lg font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
          <Flame className="w-5 h-5 text-orange-500" />
          참가 정보 입력
        </h2>

        {errorMsg && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs sm:text-sm text-rose-700 font-semibold animate-shake">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleApply} className="space-y-4">
          {/* Student Number */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              학번 <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Hash className="w-4 h-4" />
              </div>
              <input
                type="text"
                placeholder="예: 10101 (1학년 1반 1번)"
                value={studentNumber}
                onChange={(e) => setStudentNumber(e.target.value)}
                maxLength={6}
                disabled={!isOpen || isFull || submitting}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:bg-slate-100 disabled:cursor-not-allowed"
              />
            </div>
            <p className="text-[11px] text-slate-400">
              * 학년, 반, 번호를 붙여서 5자리 숫자로 입력해주세요.
            </p>
          </div>

          {/* Name */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              이름 <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                placeholder="학생 본인 성명 (예: 홍길동)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={10}
                disabled={!isOpen || isFull || submitting}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:bg-slate-100 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          {/* 4-digit code */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="block text-xs font-bold text-slate-700">
                본부석 참가코드 (4자리) <span className="text-rose-500">*</span>
              </label>
              <span className="text-[11px] text-blue-600 font-bold">
                운동장 본부석 교사 확인
              </span>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <KeyRound className="w-4 h-4" />
              </div>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                placeholder="4자리 숫자 (예: 4821)"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                disabled={!isOpen || isFull || submitting}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-sm font-extrabold tracking-widest text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 disabled:bg-slate-100 disabled:cursor-not-allowed"
              />
            </div>
            <p className="text-[11px] text-slate-400">
              * 운동장 본부석에 계신 선생님께 확인한 일일 4자리 숫자를 입력하세요.
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!isOpen || isFull || submitting}
            className={`w-full py-3.5 rounded-xl font-black text-sm flex items-center justify-center gap-2 shadow-lg transition-all active:scale-[0.98] ${
              !isOpen || isFull
                ? "bg-slate-300 text-slate-500 cursor-not-allowed shadow-none"
                : "bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-500 hover:from-blue-700 hover:to-emerald-600 text-white shadow-blue-500/30"
            }`}
          >
            {submitting ? (
              <span>접수 처리 중...</span>
            ) : isFull ? (
              <span>선착순 30명 마감되었습니다</span>
            ) : data?.session.status === "OFF" ? (
              <span>🚫 오늘 아침달리기는 운영하지 않습니다 ({data?.session.cancelReason || "휴무"})</span>
            ) : !isOpen ? (
              <span>현재 참가 신청 접수 시간이 아닙니다</span>
            ) : (
              <>
                <UserCheck className="w-4 h-4" />
                선착순 참가신청 완료하기
              </>
            )}
          </button>
        </form>
      </div>

      {/* Ticket Modal Pop-up on Success */}
      {ticket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-200 animate-scale-up">
            {/* Ticket Header */}
            <div className="bg-gradient-to-br from-emerald-600 to-teal-700 p-6 text-white text-center relative">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md mx-auto flex items-center justify-center mb-3">
                <Ticket className="w-6 h-6 text-white" />
              </div>
              <span className="text-xs font-bold text-emerald-200 uppercase tracking-widest">
                SHINDORIM MORNING RUN
              </span>
              <h3 className="text-xl font-black mt-0.5">참가 신청 접수 완료!</h3>
              <p className="text-xs text-emerald-100 mt-1">
                신도림중 건강안전부 공식 참가 확인증
              </p>
            </div>

            {/* Ticket Body */}
            <div className="p-6 space-y-4">
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-2.5 text-xs sm:text-sm">
                <div className="flex justify-between items-center border-b border-slate-200/60 pb-2">
                  <span className="text-slate-500">선착순 접수번호</span>
                  <span className="text-base font-black text-emerald-600">
                    #{ticket.queueNumber}번 / 30명
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">신청 학생</span>
                  <span className="font-extrabold text-slate-800">
                    {ticket.name} ({ticket.studentNumber})
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">신청 일자</span>
                  <span className="font-bold text-slate-700">
                    {ticket.date} (제 {ticket.sessionNumber}차시)
                  </span>
                </div>
                {ticket.isDoubleMileage && (
                  <div className="flex justify-between items-center text-purple-700 font-bold">
                    <span>특별 혜택</span>
                    <span>마일리지 2배 데이(x2)!</span>
                  </div>
                )}
              </div>

              {/* Next step notice */}
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                  다음 단계 안내
                </p>
                <p>
                  1. <strong>나이키런 앱</strong>을 켜고 운동장 <strong>2km 이상</strong>을 완주하세요.<br />
                  2. 완주 후 본부석 선생님께 스마트폰 기록 화면을 보여주고 <strong>마일리지 인증</strong>을 받으세요!
                </p>
              </div>

              <div className="space-y-2 pt-1">
                <button
                  onClick={() => setTicket(null)}
                  className="w-full py-3 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-colors"
                >
                  확인 (창 닫기)
                </button>
                <Link
                  href="/my-record"
                  className="w-full py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-1 hover:bg-slate-50 transition-colors"
                >
                  나의 누적 기록 보러가기
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
