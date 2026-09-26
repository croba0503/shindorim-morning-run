"use client";

import { useState, useEffect } from "react";
import {
  ShieldCheck,
  Lock,
  RefreshCw,
  Edit3,
  Check,
  X,
  Plus,
  Download,
  AlertTriangle,
  Clock,
  Search,
  CheckCircle2,
  Trash2,
  UserCheck,
  Calendar,
  LogOut,
  KeyRound,
  Sparkles,
  Ban,
} from "lucide-react";

interface TodaySession {
  id: string;
  date: string;
  dayOfWeek: string;
  sessionNumber: number;
  code: string;
  isOpen: boolean;
  maxCapacity: number;
  isDoubleMileage: boolean;
  status: "READY" | "OPEN" | "CLOSED" | "CANCELLED" | "OFF";
  cancelReason?: string;
  notice?: string;
  appliedCount?: number;
  certifiedCount?: number;
}

interface ApplicantRecord {
  id: string;
  sessionId: string;
  sessionDate: string;
  studentId: string;
  studentNumber: string;
  studentName: string;
  appliedAt: string;
  isCertified: boolean;
  distanceKm: number;
  durationSeconds: number;
  pace: string;
  mileage: number;
  certifiedAt?: string;
  note?: string;
}

export default function AdminPage() {
  // Authentication
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [authError, setAuthError] = useState("");

  // Data
  const [session, setSession] = useState<TodaySession | null>(null);
  const [applicants, setApplicants] = useState<ApplicantRecord[]>([]);
  const [stats, setStats] = useState({
    totalApplicants: 0,
    certifiedCount: 0,
    waitingCount: 0,
    maxCapacity: 30,
    remainingSlots: 30,
  });
  const [loading, setLoading] = useState(false);

  // Tab
  const [activeTab, setActiveTab] = useState<"desk" | "schedule" | "all">("desk");

  // Editing Code Modal / Inline
  const [editingCode, setEditingCode] = useState(false);
  const [newCodeInput, setNewCodeInput] = useState("");

  // Certification Modal
  const [certifyingRecord, setCertifyingRecord] = useState<ApplicantRecord | null>(null);
  const [certDistance, setCertDistance] = useState("2.0");
  const [certMinutes, setCertMinutes] = useState("12");
  const [certSeconds, setCertSeconds] = useState("00");
  const [certDoubleMileage, setCertDoubleMileage] = useState(false);
  const [certCustomMileage, setCertCustomMileage] = useState("");
  const [certNote, setCertNote] = useState("");
  const [certLoading, setCertLoading] = useState(false);

  // Manual Add Modal
  const [showManualAdd, setShowManualAdd] = useState(false);
  const [manualNum, setManualNum] = useState("");
  const [manualName, setManualName] = useState("");
  const [manualDist, setManualDist] = useState("2.0");
  const [manualMin, setManualMin] = useState("12");
  const [manualSec, setManualSec] = useState("00");
  const [manualDouble, setManualDouble] = useState(false);

  // All Records View
  const [allRecords, setAllRecords] = useState<ApplicantRecord[]>([]);
  const [allRecordsSearch, setAllRecordsSearch] = useState("");

  // Password Change Modal
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [newPinConfirm, setNewPinConfirm] = useState("");
  const [pwMsg, setPwMsg] = useState<{ text: string; isError: boolean } | null>(null);

  // Schedule Management
  const [scheduleList, setScheduleList] = useState<TodaySession[]>([]);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<TodaySession | null>(null);
  const [schedDate, setSchedDate] = useState("");
  const [schedDay, setSchedDay] = useState("월");
  const [schedNum, setSchedNum] = useState("");
  const [schedCode, setSchedCode] = useState("");
  const [schedMax, setSchedMax] = useState("30");
  const [schedDouble, setSchedDouble] = useState(false);
  const [schedStatus, setSchedStatus] = useState<"READY" | "OPEN" | "CLOSED" | "CANCELLED" | "OFF">("READY");
  const [schedNotice, setSchedNotice] = useState("");
  const [schedCancelReason, setSchedCancelReason] = useState("");
  const [scheduleMonthFilter, setScheduleMonthFilter] = useState("ALL");

  // Check login from sessionStorage
  useEffect(() => {
    const auth = sessionStorage.getItem("sdr_teacher_auth");
    if (auth === "true") {
      setIsAuthenticated(true);
      fetchAdminData();
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: pinInput }),
      });
      const data = await res.json();
      if (data.success) {
        setIsAuthenticated(true);
        sessionStorage.setItem("sdr_teacher_auth", "true");
        fetchAdminData();
      } else {
        setAuthError(data.message || "비밀번호가 올바르지 않습니다.");
      }
    } catch {
      setAuthError("인증 요청 실패");
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem("sdr_teacher_auth");
  };

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/session");
      const data = await res.json();
      if (data.success) {
        setSession(data.session);
        setApplicants(data.applicants);
        setStats(data.stats);
        setNewCodeInput(data.session.code);
        setCertDoubleMileage(data.session.isDoubleMileage);
      }
    } catch (err) {
      console.error("Admin fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllRecords = async () => {
    try {
      const res = await fetch(`/api/admin/records?search=${encodeURIComponent(allRecordsSearch)}`);
      const data = await res.json();
      if (data.success) {
        setAllRecords(data.records);
      }
    } catch (err) {
      console.error("All records error:", err);
    }
  };

  const fetchSchedules = async () => {
    try {
      const res = await fetch("/api/admin/schedule");
      const data = await res.json();
      if (data.success) {
        setScheduleList(data.sessions);
      }
    } catch (err) {
      console.error("Schedules fetch error:", err);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      if (activeTab === "all") {
        fetchAllRecords();
      } else if (activeTab === "schedule") {
        fetchSchedules();
      }
    }
  }, [isAuthenticated, activeTab, allRecordsSearch]);

  // Session Control Actions
  const toggleApplicationOpen = async () => {
    if (!session) return;
    const newOpenState = !session.isOpen;
    try {
      const res = await fetch("/api/admin/session", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isOpen: newOpenState }),
      });
      const data = await res.json();
      if (data.success) {
        setSession(data.session);
      }
    } catch {
      alert("상태 변경에 실패했습니다.");
    }
  };

  const toggleDoubleMileage = async () => {
    if (!session) return;
    const newDouble = !session.isDoubleMileage;
    try {
      const res = await fetch("/api/admin/session", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isDoubleMileage: newDouble }),
      });
      const data = await res.json();
      if (data.success) {
        setSession(data.session);
      }
    } catch {
      alert("마일리지 설정 변경에 실패했습니다.");
    }
  };

  const handleUpdateCode = async () => {
    if (!/^\d{4}$/.test(newCodeInput.trim())) {
      alert("참가코드는 4자리 숫자여야 합니다.");
      return;
    }
    try {
      const res = await fetch("/api/admin/session", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: newCodeInput.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setSession(data.session);
        setEditingCode(false);
        alert(`참가코드가 ${newCodeInput.trim()}(으)로 변경되었습니다.`);
      }
    } catch {
      alert("코드 변경 실패");
    }
  };

  const handleGenerateRandomCode = async () => {
    const randomCode = Math.floor(1000 + Math.random() * 9000).toString();
    try {
      const res = await fetch("/api/admin/session", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: randomCode }),
      });
      const data = await res.json();
      if (data.success) {
        setSession(data.session);
        setNewCodeInput(randomCode);
        alert(`새 참가코드 [${randomCode}]가 발급되었습니다.`);
      }
    } catch {
      alert("랜덤 코드 생성 실패");
    }
  };

  const handleWeatherCancel = async () => {
    const reason = prompt(
      "취소 사유를 입력하세요 (예: 우천으로 인한 안전 취소, 미세먼지 '매우나쁨' 경보):",
      "우천으로 인한 당일 취소"
    );
    if (!reason) return;

    try {
      const res = await fetch("/api/admin/notice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CANCEL_TODAY",
          reason,
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        fetchAdminData();
      }
    } catch {
      alert("취소 처리 실패");
    }
  };

  const handleRestoreSession = async () => {
    if (!confirm("오늘 아침달리기를 정상 신청 진행 상태로 복구하시겠습니까?")) return;
    try {
      const res = await fetch("/api/admin/notice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "RESTORE_TODAY" }),
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        fetchAdminData();
      }
    } catch {
      alert("복구 실패");
    }
  };

  // Open Certification Modal
  const openCertification = (record: ApplicantRecord) => {
    setCertifyingRecord(record);
    setCertDistance(record.distanceKm > 0 ? String(record.distanceKm) : "2.0");
    const totalSec = record.durationSeconds || 720;
    setCertMinutes(String(Math.floor(totalSec / 60)));
    setCertSeconds(String(totalSec % 60).padStart(2, "0"));
    setCertDoubleMileage(session?.isDoubleMileage || false);
    setCertCustomMileage("");
    setCertNote(record.note || "");
  };

  // Complete Certification
  const handleCertifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!certifyingRecord) return;

    setCertLoading(true);
    try {
      const res = await fetch("/api/admin/certify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recordId: certifyingRecord.id,
          distanceKm: certDistance,
          durationMinutes: certMinutes,
          durationSeconds: certSeconds,
          isDoubleMileage: certDoubleMileage,
          customMileage: certCustomMileage || undefined,
          note: certNote,
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        setCertifyingRecord(null);
        fetchAdminData();
      } else {
        alert(data.message || "인증 처리 실패");
      }
    } catch {
      alert("인증 요청 오류");
    } finally {
      setCertLoading(false);
    }
  };

  // Manual Add Student
  const handleManualAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualNum.trim() || !manualName.trim()) {
      alert("학번과 이름을 입력해주세요.");
      return;
    }

    try {
      const res = await fetch("/api/admin/manual-add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentNumber: manualNum.trim(),
          name: manualName.trim(),
          distanceKm: manualDist,
          durationMinutes: manualMin,
          durationSeconds: manualSec,
          isDoubleMileage: manualDouble,
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        setShowManualAdd(false);
        setManualNum("");
        setManualName("");
        fetchAdminData();
      } else {
        alert(data.message || "수동 등록 실패");
      }
    } catch {
      alert("수동 등록 요청 오류");
    }
  };

  // Delete record
  const handleDeleteRecord = async (id: string, name: string) => {
    if (!confirm(`정말 ${name} 학생의 기록을 삭제하시겠습니까?`)) return;
    try {
      const res = await fetch(`/api/admin/records?id=${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        fetchAdminData();
        if (activeTab === "all") fetchAllRecords();
      }
    } catch {
      alert("기록 삭제 오류");
    }
  };

  // Change Password Submit
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwMsg(null);

    if (newPin !== newPinConfirm) {
      setPwMsg({ text: "새 비밀번호가 일치하지 않습니다.", isError: true });
      return;
    }

    try {
      const res = await fetch("/api/admin/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPin,
          newPin,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setPwMsg({ text: data.message, isError: false });
        setTimeout(() => {
          setShowPasswordModal(false);
          setCurrentPin("");
          setNewPin("");
          setNewPinConfirm("");
          setPwMsg(null);
        }, 1200);
      } else {
        setPwMsg({ text: data.message || "비밀번호 변경 실패", isError: true });
      }
    } catch {
      setPwMsg({ text: "서버 오류가 발생했습니다.", isError: true });
    }
  };

  // Open Schedule Add Modal
  const openAddSchedule = (isOff: boolean = false) => {
    setEditingSchedule(null);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().slice(0, 10);
    const days = ["일", "월", "화", "수", "목", "금", "토"];
    setSchedDate(dateStr);
    setSchedDay(days[tomorrow.getDay()]);
    setSchedNum(String(scheduleList.filter((s) => s.status !== "OFF").length + 1));
    setSchedCode(isOff ? "-" : Math.floor(1000 + Math.random() * 9000).toString());
    setSchedMax(isOff ? "0" : "30");
    setSchedDouble(false);
    setSchedStatus(isOff ? "OFF" : "READY");
    setSchedNotice("");
    setSchedCancelReason(isOff ? "추석 연휴 휴무" : "");
    setShowScheduleModal(true);
  };

  // Open Schedule Edit Modal
  const openEditSchedule = (s: TodaySession) => {
    setEditingSchedule(s);
    setSchedDate(s.date);
    setSchedDay(s.dayOfWeek);
    setSchedNum(String(s.sessionNumber));
    setSchedCode(s.code);
    setSchedMax(String(s.maxCapacity || 30));
    setSchedDouble(s.isDoubleMileage);
    setSchedStatus(s.status);
    setSchedNotice(s.notice || "");
    setSchedCancelReason(s.cancelReason || "");
    setShowScheduleModal(true);
  };

  // Save Schedule Submit
  const handleSaveSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schedDate) {
      alert("날짜를 입력해주세요.");
      return;
    }

    const isOffOrCancelled = schedStatus === "OFF" || schedStatus === "CANCELLED";
    const reasonToSend = isOffOrCancelled
      ? (schedCancelReason || (schedStatus === "OFF" ? "휴무일" : "기상 악화로 인한 취소"))
      : undefined;

    try {
      if (editingSchedule) {
        // Edit
        const res = await fetch("/api/admin/schedule", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingSchedule.id,
            date: schedDate,
            dayOfWeek: schedDay,
            sessionNumber: schedStatus === "OFF" ? 0 : schedNum,
            code: schedStatus === "OFF" ? "-" : schedCode,
            maxCapacity: schedStatus === "OFF" ? 0 : schedMax,
            isDoubleMileage: schedStatus === "OFF" ? false : schedDouble,
            status: schedStatus,
            notice: schedNotice,
            cancelReason: reasonToSend,
          }),
        });
        const data = await res.json();
        if (data.success) {
          alert(data.message);
          setShowScheduleModal(false);
          fetchSchedules();
          fetchAdminData();
        } else {
          alert(data.message || "수정 실패");
        }
      } else {
        // Add
        const res = await fetch("/api/admin/schedule", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            date: schedDate,
            dayOfWeek: schedDay,
            sessionNumber: schedStatus === "OFF" ? 0 : schedNum,
            code: schedStatus === "OFF" ? "-" : schedCode,
            maxCapacity: schedStatus === "OFF" ? 0 : schedMax,
            isDoubleMileage: schedStatus === "OFF" ? false : schedDouble,
            status: schedStatus,
            notice: schedNotice,
            cancelReason: reasonToSend,
          }),
        });
        const data = await res.json();
        if (data.success) {
          alert(data.message);
          setShowScheduleModal(false);
          fetchSchedules();
          fetchAdminData();
        } else {
          alert(data.message || "추가 실패");
        }
      }
    } catch {
      alert("일정 저장 오류");
    }
  };

  // Delete Schedule
  const handleDeleteSchedule = async (id: string, date: string) => {
    if (!confirm(`정말 ${date} 일정을 삭제하시겠습니까?`)) return;
    try {
      const res = await fetch(`/api/admin/schedule?id=${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        fetchSchedules();
      } else {
        alert(data.message || "삭제 실패");
      }
    } catch {
      alert("일정 삭제 오류");
    }
  };

  // Live calculation helpers for modal
  const distNum = parseFloat(certDistance) || 0;
  const totalSecCalc = (parseInt(certMinutes) || 0) * 60 + (parseInt(certSeconds) || 0);
  const calculatedPace =
    distNum > 0 && totalSecCalc > 0
      ? `${Math.floor(totalSecCalc / distNum / 60)}'${String(
          Math.round((totalSecCalc / distNum) % 60)
        ).padStart(2, "0")}"`
      : "-";
  const calculatedMileage = certDoubleMileage
    ? Math.round(distNum * 2 * 10) / 10
    : Math.round(distNum * 10) / 10;

  // Login view
  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto px-4 py-16">
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl space-y-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-blue-600/30">
            <Lock className="w-7 h-7" />
          </div>

          <div className="space-y-1">
            <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">
              TEACHER PORTAL
            </span>
            <h1 className="text-2xl font-black text-slate-900">
              교사용 관리자 로그인
            </h1>
            <p className="text-xs text-slate-500">
              신도림중 건강안전부 관리자 비밀번호를 입력해주세요.
            </p>
          </div>

          {authError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-700">
              {authError}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              placeholder="관리자 핀번호를 입력하세요"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 text-center text-sm font-bold tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm shadow-md transition-all active:scale-95"
            >
              관리자 모드 접속
            </button>
          </form>

          <p className="text-[11px] text-slate-400">
            * 비밀번호 분실 시 시스템 관리자에게 문의하세요.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900 text-white text-xs font-bold mb-1">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
            신도림중 건강안전부 교사용 컨트롤 타워
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
            아침달리기 프로젝트 본부석 데스크
          </h1>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          <button
            onClick={() => setShowPasswordModal(true)}
            className="px-3 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 font-bold text-xs flex items-center gap-1.5 transition-colors"
            title="관리자 비밀번호 변경"
          >
            <KeyRound className="w-3.5 h-3.5 text-blue-600" />
            비밀번호 변경
          </button>
          <button
            onClick={fetchAdminData}
            disabled={loading}
            className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
            title="새로고침"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <a
            href="/api/admin/export?type=summary"
            download
            className="px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
          >
            <Download className="w-4 h-4" />
            학생별 누적 엑셀(CSV)
          </a>
          <button
            onClick={handleLogout}
            className="p-2.5 rounded-xl border border-slate-200 text-rose-600 hover:bg-rose-50 transition-colors"
            title="로그아웃"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Control Tower Cards */}
      {session && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: 4-digit code */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500">
              <span>오늘의 본부석 참가코드</span>
              <span className="text-[11px] text-blue-600 font-extrabold">
                {session.date} ({session.dayOfWeek})
              </span>
            </div>

            <div className="flex items-center justify-between bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
              {editingCode ? (
                <div className="flex items-center gap-2 w-full">
                  <input
                    type="text"
                    maxLength={4}
                    value={newCodeInput}
                    onChange={(e) => setNewCodeInput(e.target.value.replace(/\D/g, ""))}
                    className="w-24 px-2 py-1 text-xl font-black text-center tracking-widest border border-blue-500 rounded-lg focus:outline-none"
                  />
                  <button
                    onClick={handleUpdateCode}
                    className="p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setEditingCode(false)}
                    className="p-2 rounded-lg bg-slate-200 text-slate-700 hover:bg-slate-300"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <>
                  <div className="text-3xl font-black tracking-widest text-slate-900">
                    {session.code}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setEditingCode(true)}
                      className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition-colors"
                      title="코드 직접 수정"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleGenerateRandomCode}
                      className="p-2 rounded-xl text-blue-600 hover:bg-blue-50 transition-colors"
                      title="랜덤 4자리 재발급"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </div>
                </>
              )}
            </div>
            <p className="text-[11px] text-slate-400">
              * 학생들은 본부석에서 이 코드를 확인하고 모바일 신청을 합니다.
            </p>
          </div>

          {/* Card 2: Application Open / Close Toggle */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500">
              <span>참가 신청 접수 제어</span>
              <span
                className={`text-[11px] font-black px-2 py-0.5 rounded-full ${
                  session.isOpen
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-slate-200 text-slate-600"
                }`}
              >
                {session.isOpen ? "접수 진행 중" : "신청 마감됨"}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={toggleApplicationOpen}
                className={`w-full py-3.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all ${
                  session.isOpen
                    ? "bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200"
                    : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20"
                }`}
              >
                {session.isOpen ? (
                  <>
                    <X className="w-4 h-4" />
                    신청 마감하기 (정지)
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    지금 신청 시작하기 (오픈)
                  </>
                )}
              </button>
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-xs font-bold text-slate-600">
                마일리지 2배(x2) 보너스:
              </span>
              <button
                onClick={toggleDoubleMileage}
                className={`text-xs font-black px-3 py-1 rounded-full transition-colors ${
                  session.isDoubleMileage
                    ? "bg-purple-600 text-white"
                    : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                }`}
              >
                {session.isDoubleMileage ? "⚡ 2배 적용 중" : "일반(1배)"}
              </button>
            </div>
          </div>

          {/* Card 3: Realtime Status & Emergency Cancellation */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500">
              <span>오늘 선착순 신청 인원</span>
              <span className="font-extrabold text-blue-600">
                {stats.totalApplicants} / 30명
              </span>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold text-slate-700">
                <span>완주 인증: {stats.certifiedCount}명</span>
                <span>대기: {stats.waitingCount}명</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden p-0.5 border border-slate-200">
                <div
                  className="bg-blue-600 h-full rounded-full transition-all"
                  style={{
                    width: `${Math.min(100, (stats.totalApplicants / 30) * 100)}%`,
                  }}
                />
              </div>
            </div>

            <div className="pt-1">
              {session.status === "CANCELLED" ? (
                <button
                  onClick={handleRestoreSession}
                  className="w-full py-2 px-3 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors"
                >
                  취소 철회 및 정상 진행으로 복구
                </button>
              ) : (
                <button
                  onClick={handleWeatherCancel}
                  className="w-full py-2 px-3 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  우천/미세먼지 긴급 취소 발령
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-2 sm:gap-4 overflow-x-auto">
        <button
          onClick={() => setActiveTab("desk")}
          className={`pb-3 text-xs sm:text-sm font-black transition-colors flex items-center gap-1.5 border-b-2 whitespace-nowrap ${
            activeTab === "desk"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <UserCheck className="w-4 h-4" />
          오늘 신청자 완주 인증 데스크 ({applicants.length}명)
        </button>
        <button
          onClick={() => setActiveTab("schedule")}
          className={`pb-3 text-xs sm:text-sm font-black transition-colors flex items-center gap-1.5 border-b-2 whitespace-nowrap ${
            activeTab === "schedule"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <Calendar className="w-4 h-4" />
          운영 일정 관리 (추가/수정)
        </button>
        <button
          onClick={() => setActiveTab("all")}
          className={`pb-3 text-xs sm:text-sm font-black transition-colors flex items-center gap-1.5 border-b-2 whitespace-nowrap ${
            activeTab === "all"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-slate-500 hover:text-slate-900"
          }`}
        >
          <Search className="w-4 h-4" />
          전체 누적 기록 및 학생 관리
        </button>
      </div>

      {/* Tab Content 1: Today's Certification Desk */}
      {activeTab === "desk" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <p className="text-xs sm:text-sm text-slate-600">
              학생의 <strong>나이키런 앱 화면</strong>(2km 이상 완주)을 확인하고 명단에서 학생을 클릭하여 기록을 인증해주세요.
            </p>

            <button
              onClick={() => setShowManualAdd(true)}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              현장 미신청 학생 수동 추가
            </button>
          </div>

          {applicants.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center text-slate-400 border border-slate-200">
              오늘 신청한 학생이 아직 없습니다. 본부석 참가코드를 확인하여 학생들에게 안내해주세요.
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                    <tr>
                      <th className="py-3 px-4">번호</th>
                      <th className="py-3 px-4">학번</th>
                      <th className="py-3 px-4">이름</th>
                      <th className="py-3 px-4">신청시각</th>
                      <th className="py-3 px-4">상태</th>
                      <th className="py-3 px-4">거리 / 시간 / 페이스</th>
                      <th className="py-3 px-4">마일리지</th>
                      <th className="py-3 px-4 text-center">인증 처리</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {applicants.map((item, idx) => (
                      <tr
                        key={item.id}
                        className={`hover:bg-slate-50/80 transition-colors ${
                          item.isCertified ? "bg-emerald-50/20" : ""
                        }`}
                      >
                        <td className="py-3.5 px-4 font-black text-slate-400">
                          #{idx + 1}
                        </td>
                        <td className="py-3.5 px-4 font-extrabold text-slate-900">
                          {item.studentNumber}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-800">
                          {item.studentName}
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 text-xs">
                          {item.appliedAt.slice(11, 16)}
                        </td>
                        <td className="py-3.5 px-4">
                          {item.isCertified ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                              <CheckCircle2 className="w-3 h-3" />
                              완주 인증
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                              <Clock className="w-3 h-3" />
                              완주 대기
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-700">
                          {item.isCertified ? (
                            <span>
                              {item.distanceKm}km • {Math.floor(item.durationSeconds / 60)}분 • {item.pace}/km
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          {item.isCertified ? (
                            <span className="font-black text-emerald-600">
                              +{item.mileage} P
                            </span>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <button
                            onClick={() => openCertification(item)}
                            className={`px-3 py-1.5 rounded-xl font-black text-xs transition-all ${
                              item.isCertified
                                ? "bg-slate-100 text-slate-700 hover:bg-slate-200"
                                : "bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                            }`}
                          >
                            {item.isCertified ? "기록 수정" : "완주 인증"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab Content 2: Schedule Management (NEW!) */}
      {activeTab === "schedule" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <p className="text-xs sm:text-sm text-slate-600">
              아침달리기 운영 차시를 추가하거나, <strong>미운영일(휴무/시험 등)</strong>을 등록하여 학생들에게 안내할 수 있습니다.
            </p>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => openAddSchedule(false)}
                className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
              >
                <Plus className="w-4 h-4" />
                새 차시 추가
              </button>
              <button
                onClick={() => openAddSchedule(true)}
                className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
              >
                <Ban className="w-4 h-4" />
                미운영일(휴무) 등록
              </button>
            </div>
          </div>

          {/* Month Filter */}
          <div className="flex items-center justify-between gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-200 text-xs">
            <span className="font-bold text-slate-600">월별 필터:</span>
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                onClick={() => setScheduleMonthFilter("ALL")}
                className={`px-3 py-1 rounded-lg font-bold transition-all ${
                  scheduleMonthFilter === "ALL"
                    ? "bg-slate-900 text-white shadow-sm"
                    : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                }`}
              >
                전체 ({scheduleList.length})
              </button>
              {Array.from(new Set(scheduleList.map((s) => s.date.slice(0, 7))))
                .sort()
                .reverse()
                .map((ym) => (
                  <button
                    key={ym}
                    onClick={() => setScheduleMonthFilter(ym)}
                    className={`px-3 py-1 rounded-lg font-bold transition-all ${
                      scheduleMonthFilter === ym
                        ? "bg-blue-600 text-white shadow-sm"
                        : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    {ym.replace("-", "년 ")}월
                  </button>
                ))}
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                  <tr>
                    <th className="py-3 px-4">차시</th>
                    <th className="py-3 px-4">날짜 (요일)</th>
                    <th className="py-3 px-4">참가코드</th>
                    <th className="py-3 px-4">신청 및 완주 현황</th>
                    <th className="py-3 px-4">마일리지 혜택</th>
                    <th className="py-3 px-4">진행 상태</th>
                    <th className="py-3 px-4">안내 메모 / 취소 및 미운영 사유</th>
                    <th className="py-3 px-4 text-center">차시 현황 관리</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {scheduleList
                    .filter((s) => scheduleMonthFilter === "ALL" || s.date.startsWith(scheduleMonthFilter))
                    .map((s) => {
                      const isOff = s.status === "OFF";

                      return (
                        <tr
                          key={s.id}
                          className={`hover:bg-slate-50 transition-colors ${
                            isOff ? "bg-amber-50/20" : ""
                          }`}
                        >
                          <td className="py-3.5 px-4 font-black">
                            {isOff ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-black text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md">
                                <Ban className="w-3 h-3 text-amber-600" />
                                미운영일
                              </span>
                            ) : (
                              <span className="text-blue-700">제 {s.sessionNumber}차시</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 font-extrabold text-slate-900">
                            {s.date} ({s.dayOfWeek})
                          </td>
                          <td className="py-3.5 px-4 font-black tracking-widest text-slate-800">
                            {isOff ? <span className="text-slate-400 font-normal">-</span> : s.code}
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-slate-700">
                            {isOff ? (
                              <span className="text-slate-400 font-normal">미운영</span>
                            ) : (
                              <>
                                신청 <strong className="text-blue-600">{s.appliedCount || 0}</strong> / {s.maxCapacity || 30}명
                                <span className="text-emerald-600 ml-1.5 font-bold">
                                  (완주 {s.certifiedCount || 0}명)
                                </span>
                              </>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            {isOff ? (
                              <span className="text-slate-400 font-normal">-</span>
                            ) : s.isDoubleMileage ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-black text-purple-700 bg-purple-100 px-2.5 py-0.5 rounded-full">
                                <Sparkles className="w-3 h-3 text-purple-600" />
                                2배 데이(x2)
                              </span>
                            ) : (
                              <span className="text-slate-400 text-xs">일반(1배)</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            {isOff ? (
                              <span className="text-[11px] font-bold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full">
                                🚫 미운영
                              </span>
                            ) : s.status === "OPEN" ? (
                              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                                신청 접수 중
                              </span>
                            ) : s.status === "CANCELLED" ? (
                              <span className="text-[11px] font-bold text-rose-700 bg-rose-100 px-2.5 py-0.5 rounded-full">
                                취소됨
                              </span>
                            ) : s.status === "CLOSED" ? (
                              <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full">
                                진행 완료
                              </span>
                            ) : (
                              <span className="text-[11px] font-bold text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full">
                                준비 중
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-xs text-slate-500 max-w-xs truncate">
                            {isOff ? (
                              <span className="text-amber-800 font-bold">
                                🚫 {s.cancelReason || "학교 학사 일정 및 휴무"}
                              </span>
                            ) : s.status === "CANCELLED" && s.cancelReason ? (
                              <span className="text-rose-600 font-bold">⚠️ {s.cancelReason}</span>
                            ) : (
                              s.notice || "-"
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => openEditSchedule(s)}
                                className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-extrabold text-xs transition-colors"
                              >
                                차시 현황 수정
                              </button>
                              <button
                                onClick={() => handleDeleteSchedule(s.id, s.date)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                title="일정 삭제"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content 3: All Records & Management */}
      {activeTab === "all" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
            <div className="relative w-full sm:w-80">
              <input
                type="text"
                placeholder="학번 또는 이름 검색"
                value={allRecordsSearch}
                onChange={(e) => setAllRecordsSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            </div>

            <div className="flex items-center gap-2">
              <a
                href="/api/admin/export?type=history"
                download
                className="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs flex items-center gap-1.5 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                전체 세부 이력 엑셀(CSV)
              </a>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold">
                  <tr>
                    <th className="py-3 px-4">날짜</th>
                    <th className="py-3 px-4">학번</th>
                    <th className="py-3 px-4">이름</th>
                    <th className="py-3 px-4">상태</th>
                    <th className="py-3 px-4">달린 거리</th>
                    <th className="py-3 px-4">시간</th>
                    <th className="py-3 px-4">페이스</th>
                    <th className="py-3 px-4">마일리지</th>
                    <th className="py-3 px-4 text-center">관리</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {allRecords.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50">
                      <td className="py-3 px-4 font-semibold text-slate-700">
                        {r.sessionDate}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {r.studentNumber}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-800">
                        {r.studentName}
                      </td>
                      <td className="py-3 px-4">
                        {r.isCertified ? (
                          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                            완주
                          </span>
                        ) : (
                          <span className="text-[11px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                            미완주
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {r.distanceKm}km
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {Math.floor(r.durationSeconds / 60)}분 {r.durationSeconds % 60}초
                      </td>
                      <td className="py-3 px-4 text-slate-600">{r.pace}/km</td>
                      <td className="py-3 px-4 font-extrabold text-emerald-600">
                        {r.mileage}P
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => handleDeleteRecord(r.id, r.studentName)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors"
                          title="기록 삭제"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-200 animate-scale-up">
            <div className="bg-slate-900 p-5 text-white flex justify-between items-center">
              <div>
                <span className="text-xs font-bold text-blue-400">보안 설정</span>
                <h3 className="text-lg font-black">교사 비밀번호 변경</h3>
              </div>
              <button
                onClick={() => setShowPasswordModal(false)}
                className="p-1 rounded-lg hover:bg-white/20 text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleChangePassword} className="p-6 space-y-4">
              {pwMsg && (
                <div
                  className={`p-3 rounded-xl text-xs font-bold ${
                    pwMsg.isError
                      ? "bg-rose-50 text-rose-700 border border-rose-200"
                      : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  }`}
                >
                  {pwMsg.text}
                </div>
              )}

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">
                  현재 비밀번호
                </label>
                <input
                  type="password"
                  placeholder="현재 비밀번호 입력"
                  value={currentPin}
                  onChange={(e) => setCurrentPin(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">
                  새 비밀번호 (4자리 이상)
                </label>
                <input
                  type="password"
                  placeholder="새 비밀번호 입력"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">
                  새 비밀번호 확인
                </label>
                <input
                  type="password"
                  placeholder="새 비밀번호 다시 입력"
                  value={newPinConfirm}
                  onChange={(e) => setNewPinConfirm(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  required
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="w-1/3 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="w-2/3 py-2.5 rounded-xl bg-blue-600 text-white font-black text-xs hover:bg-blue-700"
                >
                  비밀번호 변경
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Schedule Add / Edit Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-200 animate-scale-up">
            <div className="bg-gradient-to-r from-blue-700 to-indigo-700 p-5 text-white flex justify-between items-center">
              <div>
                <span className="text-xs font-bold text-blue-200">
                  {editingSchedule ? "차시 일정 수정" : "새 차시 일정 추가"}
                </span>
                <h3 className="text-lg font-black">
                  {schedDate ? `${schedDate} (${schedDay})` : "일정 설정"}
                </h3>
              </div>
              <button
                onClick={() => setShowScheduleModal(false)}
                className="p-1 rounded-lg hover:bg-white/20 text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSchedule} className="p-6 space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">
                    날짜 (YYYY-MM-DD) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={schedDate}
                    onChange={(e) => {
                      setSchedDate(e.target.value);
                      if (e.target.value) {
                        const days = ["일", "월", "화", "수", "목", "금", "토"];
                        const d = new Date(e.target.value);
                        setSchedDay(days[d.getDay()]);
                      }
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold focus:outline-none"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">
                    요일
                  </label>
                  <select
                    value={schedDay}
                    onChange={(e) => setSchedDay(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold focus:outline-none"
                  >
                    <option value="월">월요일</option>
                    <option value="화">화요일</option>
                    <option value="수">수요일</option>
                    <option value="목">목요일</option>
                    <option value="금">금요일</option>
                    <option value="토">토요일</option>
                    <option value="일">일요일</option>
                  </select>
                </div>
              </div>

              {/* Status Selector */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">
                  일정 구분 및 상태
                </label>
                <select
                  value={schedStatus}
                  onChange={(e) => setSchedStatus(e.target.value as any)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-extrabold focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="READY">🏃 정규 운영 - 준비 중 (예정)</option>
                  <option value="OPEN">🏃 정규 운영 - 신청 접수 중</option>
                  <option value="CLOSED">🏃 정규 운영 - 진행 완료</option>
                  <option value="CANCELLED">⚠️ 당일 취소 (우천/미세먼지)</option>
                  <option value="OFF">🚫 아침달리기 미운영일 (휴무/시험/공휴일 등)</option>
                </select>
              </div>

              {/* OFF Status Reason Box */}
              {schedStatus === "OFF" && (
                <div className="space-y-2 p-4 bg-amber-50 border border-amber-200 rounded-2xl animate-fade-in">
                  <label className="block text-xs font-bold text-amber-900">
                    미운영 사유 (학생 캘린더 안내용) <span className="text-rose-500">*</span>
                  </label>
                  <div className="flex flex-wrap gap-1.5 mb-1">
                    {["추석 연휴", "중간고사 시험 기간", "기말고사 시험 기간", "재량휴업일", "개교기념일", "학교 축제/체육대회", "방학"].map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => setSchedCancelReason(tag)}
                        className="px-2 py-0.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 text-[11px] font-bold transition-colors"
                      >
                        +{tag}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    placeholder="예: 추석 연휴 휴무, 중간고사 시험 기간 등"
                    value={schedCancelReason}
                    onChange={(e) => setSchedCancelReason(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-amber-300 text-xs font-bold text-amber-900 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    required
                  />
                  <p className="text-[11px] text-amber-700">
                    * 미운영일로 지정 시 학생들은 캘린더에서 휴무 사유를 확인하고 신청할 수 없습니다.
                  </p>
                </div>
              )}

              {/* Normal Run Fields (only shown when not OFF) */}
              {schedStatus !== "OFF" && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-slate-700">
                        차시 번호
                      </label>
                      <input
                        type="number"
                        placeholder="예: 6"
                        value={schedNum}
                        onChange={(e) => setSchedNum(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-slate-700">
                        참가코드 (4자리)
                      </label>
                      <input
                        type="text"
                        maxLength={4}
                        placeholder="예: 5678"
                        value={schedCode}
                        onChange={(e) => setSchedCode(e.target.value.replace(/\D/g, ""))}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-extrabold tracking-widest text-center"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="block text-xs font-bold text-slate-700">
                        선착순 정원
                      </label>
                      <input
                        type="number"
                        value={schedMax}
                        onChange={(e) => setSchedMax(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-center"
                      />
                    </div>

                    <div className="flex items-center gap-2 pt-5">
                      <input
                        type="checkbox"
                        id="schedDouble"
                        checked={schedDouble}
                        onChange={(e) => setSchedDouble(e.target.checked)}
                        className="w-4 h-4 text-purple-600 rounded"
                      />
                      <label
                        htmlFor="schedDouble"
                        className="text-xs font-bold text-slate-700 cursor-pointer"
                      >
                        ⚡ 마일리지 2배(x2) 데이
                      </label>
                    </div>
                  </div>
                </>
              )}

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">
                  안내 메모 (선택 사항)
                </label>
                <input
                  type="text"
                  placeholder="예: 수요일 마일리지 2배 보너스 데이!"
                  value={schedNotice}
                  onChange={(e) => setSchedNotice(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              {schedStatus === "CANCELLED" && (
                <div className="space-y-1 p-3 bg-rose-50 border border-rose-200 rounded-xl animate-fade-in">
                  <label className="block text-xs font-bold text-rose-700">
                    취소 사유 입력 (학생 공지용)
                  </label>
                  <input
                    type="text"
                    placeholder="예: 우천으로 인한 안전 취소, 미세먼지 '매우나쁨' 등"
                    value={schedCancelReason}
                    onChange={(e) => setSchedCancelReason(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-rose-300 text-xs font-bold text-rose-900 bg-white focus:outline-none focus:ring-2 focus:ring-rose-400"
                    required
                  />
                </div>
              )}

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  className="w-1/3 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="w-2/3 py-2.5 rounded-xl bg-blue-600 text-white font-black text-xs hover:bg-blue-700"
                >
                  {editingSchedule ? "수정 내용 저장" : "새 차시 등록"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Certification Modal */}
      {certifyingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-200 animate-scale-up">
            <div className="bg-gradient-to-r from-blue-700 to-indigo-700 p-5 text-white flex justify-between items-center">
              <div>
                <span className="text-xs font-bold text-blue-200">
                  나이키런 앱 완주 기록 확인
                </span>
                <h3 className="text-lg font-black">
                  {certifyingRecord.studentName} 학생 ({certifyingRecord.studentNumber})
                </h3>
              </div>
              <button
                onClick={() => setCertifyingRecord(null)}
                className="p-1 rounded-lg hover:bg-white/20 text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCertifySubmit} className="p-6 space-y-4">
              {/* Distance */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">
                  달린 거리 (km) <span className="text-rose-500">* (2.0km 이상)</span>
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="20"
                  value={certDistance}
                  onChange={(e) => setCertDistance(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  required
                />
              </div>

              {/* Duration (Min + Sec) */}
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">
                  달린 시간 (분:초) <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min="0"
                      max="120"
                      placeholder="분"
                      value={certMinutes}
                      onChange={(e) => setCertMinutes(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-bold text-center focus:outline-none"
                    />
                    <span className="text-xs font-bold text-slate-500">분</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min="0"
                      max="59"
                      placeholder="초"
                      value={certSeconds}
                      onChange={(e) => setCertSeconds(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-bold text-center focus:outline-none"
                    />
                    <span className="text-xs font-bold text-slate-500">초</span>
                  </div>
                </div>
              </div>

              {/* Realtime Calculated Pace & Mileage Box */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 grid grid-cols-2 gap-3 text-center">
                <div>
                  <span className="text-[11px] font-bold text-slate-400 block">
                    자동 환산 페이스
                  </span>
                  <span className="text-lg font-black text-slate-800">
                    {calculatedPace}
                    <span className="text-xs font-normal text-slate-500 ml-0.5">/km</span>
                  </span>
                </div>
                <div>
                  <span className="text-[11px] font-bold text-slate-400 block">
                    지급 마일리지
                  </span>
                  <span className="text-lg font-black text-emerald-600">
                    {certCustomMileage ? certCustomMileage : calculatedMileage}
                    <span className="text-xs font-bold text-emerald-600 ml-0.5">P</span>
                  </span>
                </div>
              </div>

              {/* Bonus Double Mileage Toggle */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="doubleMileageModal"
                  checked={certDoubleMileage}
                  onChange={(e) => setCertDoubleMileage(e.target.checked)}
                  className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                />
                <label
                  htmlFor="doubleMileageModal"
                  className="text-xs font-bold text-slate-700 cursor-pointer"
                >
                  ⚡ 마일리지 2배(x2) 보너스 적용
                </label>
              </div>

              {/* Custom Mileage Override (Optional) */}
              <div className="space-y-1 pt-1">
                <label className="block text-[11px] font-bold text-slate-500">
                  마일리지 직접 수정 (선택 시 자동계산 대신 적용)
                </label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="직접 입력할 경우에만 기재 (예: 5.0)"
                  value={certCustomMileage}
                  onChange={(e) => setCertCustomMileage(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setCertifyingRecord(null)}
                  className="w-1/3 py-3 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-50"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={certLoading}
                  className="w-2/3 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs shadow-md transition-all active:scale-95"
                >
                  {certLoading ? "인증 중..." : "완주 인증 및 마일리지 지급"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manual Add Student Modal */}
      {showManualAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-200 animate-scale-up">
            <div className="bg-slate-900 p-5 text-white flex justify-between items-center">
              <div>
                <span className="text-xs font-bold text-blue-400">현장 본부석</span>
                <h3 className="text-lg font-black">미신청 학생 수동 등록 & 인증</h3>
              </div>
              <button
                onClick={() => setShowManualAdd(false)}
                className="p-1 rounded-lg hover:bg-white/20 text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleManualAddSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">
                    학번 (5자리)
                  </label>
                  <input
                    type="text"
                    placeholder="10101"
                    value={manualNum}
                    onChange={(e) => setManualNum(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-700">
                    이름
                  </label>
                  <input
                    type="text"
                    placeholder="홍길동"
                    value={manualName}
                    onChange={(e) => setManualName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">
                  달린 거리 (km)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={manualDist}
                  onChange={(e) => setManualDist(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700">
                  달린 시간
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    placeholder="분"
                    value={manualMin}
                    onChange={(e) => setManualMin(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-center"
                  />
                  <input
                    type="number"
                    placeholder="초"
                    value={manualSec}
                    onChange={(e) => setManualSec(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-center"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="manualDouble"
                  checked={manualDouble}
                  onChange={(e) => setManualDouble(e.target.checked)}
                  className="w-4 h-4 text-purple-600 rounded"
                />
                <label
                  htmlFor="manualDouble"
                  className="text-xs font-bold text-slate-700"
                >
                  ⚡ 마일리지 2배(x2) 적용
                </label>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowManualAdd(false)}
                  className="w-1/3 py-3 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs"
                >
                  닫기
                </button>
                <button
                  type="submit"
                  className="w-2/3 py-3 rounded-xl bg-slate-900 text-white font-black text-xs hover:bg-slate-800"
                >
                  현장 등록 및 인증 완료
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
