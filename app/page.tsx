"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Flame,
  Award,
  Trophy,
  ArrowRight,
  Clock,
  MapPin,
  Users,
  Smartphone,
  CheckCircle2,
  Sparkles,
  Zap,
} from "lucide-react";

interface TodaySessionData {
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
}

export default function HomePage() {
  const [data, setData] = useState<TodaySessionData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/session/today")
      .then((res) => res.json())
      .then((res) => {
        if (res.success) {
          setData(res);
        }
      })
      .catch((err) => console.error("Error fetching session:", err))
      .finally(() => setLoading(false));
  }, []);

  const isOpen = data?.session.isOpen && data?.session.status === "OPEN";
  const remaining = data?.stats.remainingSlots ?? 30;
  const isFull = remaining <= 0;

  return (
    <div className="space-y-12 pb-10">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-900 text-white pt-12 pb-16 px-4 sm:px-6">
        {/* Background glow effects */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-blue-500/20 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-emerald-500/20 blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs sm:text-sm font-semibold text-emerald-300">
            <Sparkles className="w-4 h-4 text-emerald-400 animate-spin" style={{ animationDuration: "4s" }} />
            신도림중학교 건강안전부 특색 프로그램
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight sm:leading-tight">
            활기찬 아침, 상쾌한 질주! <br />
            <span className="bg-gradient-to-r from-blue-400 via-teal-300 to-emerald-400 bg-clip-text text-transparent">
              신도림중 아침달리기 프로젝트
            </span>
          </h1>

          <p className="text-slate-300 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            매주 월·화·수·목 아침, 나이키런(NRC) 앱과 함께 운동장 2km를 완주하고
            마일리지 적립과 명예의 전당 랭킹에 도전하세요!
          </p>

          {/* Today's Live Status Banner */}
          <div className="pt-2">
            <div className="inline-block w-full max-w-md bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 sm:p-5 shadow-2xl">
              <div className="flex items-center justify-between text-xs sm:text-sm font-bold border-b border-white/10 pb-3 mb-3">
                <span className="flex items-center gap-1.5 text-blue-200">
                  <Clock className="w-4 h-4 text-blue-400" />
                  오늘의 차시: {data ? `${data.session.date} (${data.session.dayOfWeek})` : "확인 중..."}
                </span>
                {loading ? (
                  <span className="text-slate-400">조회 중...</span>
                ) : isOpen && !isFull ? (
                  <span className="inline-flex items-center gap-1 text-emerald-300 bg-emerald-500/20 px-2.5 py-0.5 rounded-full font-bold">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    선착순 접수 중
                  </span>
                ) : isFull ? (
                  <span className="text-amber-300 bg-amber-500/20 px-2.5 py-0.5 rounded-full font-bold">
                    오늘 30명 마감
                  </span>
                ) : (
                  <span className="text-slate-400 bg-white/10 px-2.5 py-0.5 rounded-full font-bold">
                    접수 준비 중
                  </span>
                )}
              </div>

              {/* Quota Progress */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-300">실시간 접수 인원</span>
                  <span className="text-white font-extrabold">
                    {data ? `${data.stats.applicantsCount} / 30명` : "0 / 30명"}
                    <span className="text-emerald-400 ml-1.5">
                      (잔여 {data ? data.stats.remainingSlots : 30}자리)
                    </span>
                  </span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden p-0.5 border border-white/10">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-emerald-400 h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${Math.min(
                        100,
                        ((data?.stats.applicantsCount || 0) / 30) * 100
                      )}%`,
                    }}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2.5 mt-4">
                <Link
                  href="/apply"
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-sm flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/30 transition-all active:scale-95"
                >
                  <Flame className="w-4 h-4 fill-slate-950" />
                  지금 참가신청
                </Link>
                <Link
                  href="/my-record"
                  className="w-full py-2.5 px-4 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold text-sm flex items-center justify-center gap-1.5 border border-white/15 transition-all"
                >
                  <Award className="w-4 h-4 text-blue-300" />
                  나의 기록 확인
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4-Step Participation Guide */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center space-y-2 mb-8">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
            HOW TO JOIN
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
            아침달리기 참여 4단계
          </h2>
          <p className="text-sm text-slate-500">
            운동장에 도착해서 마일리지 적립까지 순서대로 따라해보세요!
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Step 1 */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 font-black flex items-center justify-center mb-4 text-lg group-hover:scale-110 transition-transform">
              1
            </div>
            <h3 className="font-extrabold text-base text-slate-900 mb-1.5 flex items-center gap-1.5">
              <span>본부석 참가코드 확인</span>
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              운동장 본부석에 계신 선생님께 매일 새롭게 부여되는 <span className="font-bold text-blue-600">4자리 참가코드</span>를 확인합니다.
            </p>
          </div>

          {/* Step 2 */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 font-black flex items-center justify-center mb-4 text-lg group-hover:scale-110 transition-transform">
              2
            </div>
            <h3 className="font-extrabold text-base text-slate-900 mb-1.5 flex items-center gap-1.5">
              <span>선착순 30명 모바일 신청</span>
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              웹사이트 [참가신청] 메뉴에서 <span className="font-bold text-emerald-600">학번, 이름, 4자리 참가코드</span>를 입력하여 선착순 접수를 완료합니다.
            </p>
          </div>

          {/* Step 3 */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 font-black flex items-center justify-center mb-4 text-lg group-hover:scale-110 transition-transform">
              3
            </div>
            <h3 className="font-extrabold text-base text-slate-900 mb-1.5 flex items-center gap-1.5">
              <span>나이키런 켜고 2km 완주</span>
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              나이키런(NRC) 앱 러닝을 시작하고 운동장을 달립니다. <span className="font-bold text-amber-600">2.0km 이상</span>을 완주하면 완주 인정 대상이 됩니다.
            </p>
          </div>

          {/* Step 4 */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 font-black flex items-center justify-center mb-4 text-lg group-hover:scale-110 transition-transform">
              4
            </div>
            <h3 className="font-extrabold text-base text-slate-900 mb-1.5 flex items-center gap-1.5">
              <span>본부석 인증 & 마일리지</span>
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              완주 화면을 본부석 선생님께 보여드리고 인증을 받습니다. 달린 거리만큼 <span className="font-bold text-rose-600">건강마일리지</span>가 적립됩니다!
            </p>
          </div>
        </div>
      </section>

      {/* Program Details Table & Info */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Details Card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Zap className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-extrabold text-slate-900">
                프로젝트 주요 운영 개요
              </h3>
            </div>
            <ul className="space-y-3.5 text-sm">
              <li className="flex items-start gap-3">
                <Clock className="w-4 h-4 text-blue-600 mt-1 flex-shrink-0" />
                <div>
                  <span className="font-bold text-slate-800">운영 일시: </span>
                  <span className="text-slate-600">
                    매주 <strong>월, 화, 수, 목 아침 07:50 ~ 08:25</strong> (수업 시작 전)
                  </span>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-emerald-600 mt-1 flex-shrink-0" />
                <div>
                  <span className="font-bold text-slate-800">운영 장소: </span>
                  <span className="text-slate-600">
                    신도림중학교 대운동장 (본부석: 스탠드 중앙)
                  </span>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Users className="w-4 h-4 text-amber-600 mt-1 flex-shrink-0" />
                <div>
                  <span className="font-bold text-slate-800">참가 대상: </span>
                  <span className="text-slate-600">
                    신도림중 전교생 중 희망자 (<strong>매 차시 선착순 30명</strong>)
                  </span>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="w-4 h-4 text-teal-600 mt-1 flex-shrink-0" />
                <div>
                  <span className="font-bold text-slate-800">완주 기준: </span>
                  <span className="text-slate-600">
                    나이키런 앱 기준 <strong>2.0km 이상</strong> 달리기 또는 빠른 걷기
                  </span>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Sparkles className="w-4 h-4 text-purple-600 mt-1 flex-shrink-0" />
                <div>
                  <span className="font-bold text-slate-800">보너스 혜택: </span>
                  <span className="text-slate-600">
                    수요일 등 특별 지정일 <strong>마일리지 2배(x2)</strong> 적립 및 학기말 우수 러너 시상
                  </span>
                </div>
              </li>
            </ul>
          </div>

          {/* Nike Run Club Guide & Safety */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-700 pb-3">
              <Smartphone className="w-5 h-5 text-emerald-400" />
              <h3 className="text-lg font-extrabold text-white">
                나이키런(NRC) 앱 사용 & 안전 수칙
              </h3>
            </div>
            <div className="space-y-3 text-xs sm:text-sm text-slate-300">
              <div className="p-3 bg-white/5 rounded-xl border border-white/10 space-y-1">
                <p className="font-bold text-emerald-400">📱 나이키런(NRC) 측정 꿀팁</p>
                <p>
                  1. 운동장 진입 직전 앱 실행 후 실외 러닝 모드로 [시작] 누르기<br />
                  2. 2.0km 도달 시 [일시정지] 또는 [종료]를 눌러 총 달린 거리 및 시간 화면 유지하기<br />
                  3. 본부석 선생님께 해당 화면을 보여드리고 인증받기
                </p>
              </div>

              <div className="p-3 bg-white/5 rounded-xl border border-white/10 space-y-1">
                <p className="font-bold text-amber-400">⚠️ 아침 운동 안전 수칙</p>
                <p>
                  • 러닝 전 본부석 주변에서 충분한 발목, 무릎 관절 스트레칭 필수<br />
                  • 호흡이 가쁘거나 어지러울 때는 무리하지 말고 가볍게 걷기로 전환<br />
                  • 우천 또는 미세먼지 경보 시 실내 공지에 따라 안전을 최우선으로 합니다.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Hall of Fame Teaser */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-800 rounded-3xl p-6 sm:p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="space-y-2 text-center md:text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-xs font-bold text-amber-300">
              <Trophy className="w-3.5 h-3.5" />
              명예의 전당 4대 랭킹
            </div>
            <h3 className="text-xl sm:text-2xl font-black">
              누가 신도림중 최고의 러너일까요?
            </h3>
            <p className="text-sm text-blue-100 max-w-xl">
              🏃 <strong>운동장지박령</strong> (최다 참여) • 🗺️ <strong>대지의 탐험가</strong> (최장 거리) • ⚡ <strong>에너자이저</strong> (최장 시간) • 🚀 <strong>스피드 러너</strong> (최속 페이스)
            </p>
          </div>
          <Link
            href="/ranking"
            className="px-6 py-3 rounded-xl bg-white text-blue-700 hover:bg-blue-50 font-black text-sm flex items-center gap-2 shadow-lg transition-transform active:scale-95 flex-shrink-0"
          >
            랭킹 명예의 전당 바로가기
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
