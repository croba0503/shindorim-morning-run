"use client";

import { useState, useEffect } from "react";
import {
  Award,
  Search,
  Flame,
  Calendar,
  Zap,
  TrendingUp,
  MapPin,
  Clock,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

interface RecordItem {
  id: string;
  sessionId: string;
  sessionDate: string;
  isCertified: boolean;
  distanceKm: number;
  durationSeconds: number;
  pace: string;
  mileage: number;
  certifiedAt?: string;
  note?: string;
}

interface MyRecordResponse {
  success: boolean;
  student: {
    studentNumber: string;
    name: string;
    grade: number;
  };
  stats: {
    totalRuns: number;
    totalDistance: number;
    totalDurationSeconds: number;
    formattedDuration: string;
    avgPace: string;
    totalMileage: number;
  };
  history: RecordItem[];
}

export default function MyRecordPage() {
  const [studentNumber, setStudentNumber] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MyRecordResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  const fetchRecords = async (num: string, studentName: string) => {
    if (!num.trim() || !studentName.trim()) {
      setErrorMsg("학번과 이름을 모두 입력해주세요.");
      return;
    }

    setLoading(true);
    setErrorMsg("");
    try {
      const params = new URLSearchParams({
        studentNumber: num.trim(),
        name: studentName.trim(),
      });
      const res = await fetch(`/api/records/my?${params.toString()}`);
      const data = await res.json();

      if (data.success) {
        setResult(data);
        localStorage.setItem("sdr_student_number", num.trim());
        localStorage.setItem("sdr_student_name", studentName.trim());
      } else {
        setResult(null);
        setErrorMsg(data.message || "기록을 찾을 수 없습니다.");
      }
    } catch (err) {
      console.error("Error fetching record:", err);
      setErrorMsg("서버 통신 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const savedNum = localStorage.getItem("sdr_student_number");
    const savedName = localStorage.getItem("sdr_student_name");
    if (savedNum && savedName) {
      setStudentNumber(savedNum);
      setName(savedName);
      fetchRecords(savedNum, savedName);
    } else {
      // Default sample view for quick exploration
      setStudentNumber("10101");
      setName("홍길동");
      fetchRecords("10101", "홍길동");
    }
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchRecords(studentNumber, name);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Title */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold">
          <Award className="w-3.5 h-3.5" />
          신도림중 아침달리기 대시보드
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
          나의 아침달리기 기록
        </h1>
        <p className="text-xs sm:text-sm text-slate-500">
          학번과 이름을 입력하여 참여 횟수, 총 달린 거리, 시간, 평균 페이스 및 마일리지를 확인하세요.
        </p>
      </div>

      {/* Search Bar */}
      <form
        onSubmit={handleSearch}
        className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3 items-center"
      >
        <div className="w-full sm:w-1/3">
          <label className="block text-[11px] font-bold text-slate-600 mb-1">
            학번 (예: 10101)
          </label>
          <input
            type="text"
            placeholder="예: 10101 (1학년 1반 1번)"
            value={studentNumber}
            onChange={(e) => setStudentNumber(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        <div className="w-full sm:w-1/3">
          <label className="block text-[11px] font-bold text-slate-600 mb-1">
            이름 (예: 홍길동)
          </label>
          <input
            type="text"
            placeholder="학생 본인 성명 (예: 홍길동)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        <div className="w-full sm:w-1/3 sm:self-end">
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm flex items-center justify-center gap-1.5 shadow-md shadow-blue-600/20 transition-all active:scale-95"
          >
            <Search className="w-4 h-4" />
            {loading ? "조회 중..." : "기록 조회하기"}
          </button>
        </div>
      </form>

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2.5 text-xs sm:text-sm text-rose-700 font-semibold">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Results View */}
      {result && (
        <div className="space-y-6 animate-fade-in">
          {/* Student Profile Card */}
          <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-emerald-600 rounded-3xl p-6 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs font-bold text-blue-200 bg-white/15 px-2.5 py-0.5 rounded-full">
                {result.student.grade}학년 러너
              </span>
              <h2 className="text-2xl font-black">
                {result.student.name} 러너님, 오늘도 나이스 런!
              </h2>
              <p className="text-xs text-blue-100">
                학번: {result.student.studentNumber} • 신도림중학교 건강안전부
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 text-center border border-white/20 flex-shrink-0">
              <span className="text-[11px] font-bold text-emerald-300 block">
                누적 건강마일리지
              </span>
              <span className="text-3xl font-black text-white">
                {result.stats.totalMileage}
                <span className="text-lg font-bold text-emerald-300 ml-1">P</span>
              </span>
            </div>
          </div>

          {/* 4 Core Summary Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* 1. 참여 횟수 */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">참여 횟수</span>
                <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
                  <Flame className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900">
                {result.stats.totalRuns}
                <span className="text-sm font-bold text-slate-500 ml-1">회</span>
              </div>
              <p className="text-[11px] text-slate-400">
                운동장지박령 랭킹 산정 기준
              </p>
            </div>

            {/* 2. 총 달린 거리 */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">총 달린 거리</span>
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                  <MapPin className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900">
                {result.stats.totalDistance.toFixed(1)}
                <span className="text-sm font-bold text-slate-500 ml-1">km</span>
              </div>
              <p className="text-[11px] text-slate-400">
                대지의 탐험가 랭킹 산정 기준
              </p>
            </div>

            {/* 3. 총 달린 시간 */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">총 달린 시간</span>
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-black text-slate-900 truncate">
                {result.stats.formattedDuration}
              </div>
              <p className="text-[11px] text-slate-400">
                에너자이저 랭킹 산정 기준
              </p>
            </div>

            {/* 4. 평균 페이스 */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">평균 페이스</span>
                <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
                  <Zap className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900">
                {result.stats.avgPace}
                <span className="text-xs font-bold text-slate-500 ml-1">/km</span>
              </div>
              <p className="text-[11px] text-slate-400">
                스피드 러너 랭킹 산정 기준
              </p>
            </div>
          </div>

          {/* Running History Timeline */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              나의 상세 달리기 이력 ({result.history.length}회차)
            </h3>

            {result.history.length === 0 ? (
              <p className="text-center py-8 text-xs text-slate-400">
                아직 완주 기록이 없습니다. 아침에 운동장에서 달려보세요!
              </p>
            ) : (
              <div className="space-y-3">
                {result.history.map((record) => (
                  <div
                    key={record.id}
                    className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      record.isCertified
                        ? "bg-slate-50/50 border-slate-200"
                        : "bg-amber-50/50 border-amber-200"
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-slate-800 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {record.sessionDate}
                        </span>
                        {record.isCertified ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                            <CheckCircle2 className="w-3 h-3" />
                            완주 인증 완료
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                            <Clock className="w-3 h-3" />
                            신청 완료 (완주 인증 대기)
                          </span>
                        )}
                      </div>

                      {record.note && (
                        <p className="text-xs text-slate-500">{record.note}</p>
                      )}
                    </div>

                    {record.isCertified ? (
                      <div className="flex items-center gap-4 text-xs font-semibold text-slate-600 border-t sm:border-t-0 pt-2 sm:pt-0">
                        <div>
                          <span className="text-slate-400 block text-[10px]">거리</span>
                          <span className="font-extrabold text-slate-900 text-sm">
                            {record.distanceKm.toFixed(1)} km
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">페이스</span>
                          <span className="font-extrabold text-slate-900 text-sm">
                            {record.pace}/km
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">시간</span>
                          <span className="font-extrabold text-slate-900 text-sm">
                            {Math.floor(record.durationSeconds / 60)}분 {record.durationSeconds % 60}초
                          </span>
                        </div>
                        <div className="bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-100 text-right">
                          <span className="text-emerald-700 block text-[10px] font-bold">마일리지</span>
                          <span className="font-black text-emerald-700 text-sm">
                            +{record.mileage} P
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs text-amber-700 font-medium">
                        2km 완주 후 본부석 선생님께 인증을 받아주세요!
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
