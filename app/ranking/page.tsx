"use client";

import { useEffect, useState } from "react";
import {
  Trophy,
  Flame,
  MapPin,
  Clock,
  Zap,
  Medal,
  Crown,
  Search,
  Sparkles,
} from "lucide-react";

interface RankItem {
  rank: number;
  studentNumber: string;
  name: string;
  grade: number;
  totalRuns: number;
  totalDistance: number;
  totalDurationSeconds: number;
  formattedAvgPace: string;
  formattedDuration: string;
  totalMileage: number;
  primaryValue: string;
  subValue: string;
}

interface RankingCategory {
  title: string;
  subtitle: string;
  unit: string;
  data: RankItem[];
}

interface RankingsData {
  ghost: RankingCategory;
  explorer: RankingCategory;
  energizer: RankingCategory;
  speed: RankingCategory;
}

export default function RankingPage() {
  const [rankings, setRankings] = useState<RankingsData | null>(null);
  const [activeTab, setActiveTab] = useState<keyof RankingsData>("ghost");
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetch("/api/ranking")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setRankings(data.rankings);
        }
      })
      .catch((err) => console.error("Ranking fetch error:", err))
      .finally(() => setLoading(false));
  }, []);

  const tabs: { key: keyof RankingsData; name: string; icon: React.ElementType; color: string }[] = [
    { key: "ghost", name: "운동장지박령", icon: Flame, color: "text-orange-500" },
    { key: "explorer", name: "대지의 탐험가", icon: MapPin, color: "text-blue-500" },
    { key: "energizer", name: "에너자이저", icon: Clock, color: "text-amber-500" },
    { key: "speed", name: "스피드 러너", icon: Zap, color: "text-purple-500" },
  ];

  const currentCategory = rankings ? rankings[activeTab] : null;

  const filteredData = (currentCategory?.data || []).filter(
    (item) =>
      item.name.includes(searchQuery.trim()) ||
      item.studentNumber.includes(searchQuery.trim())
  );

  const top1 = currentCategory?.data[0];
  const top2 = currentCategory?.data[1];
  const top3 = currentCategory?.data[2];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-bold">
          <Trophy className="w-3.5 h-3.5 text-amber-500" />
          신도림중 아침달리기 명예의 전당
        </div>
        <h1 className="text-2xl sm:text-4xl font-black text-slate-900">
          아침달리기 TOP 10 랭킹
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 max-w-lg mx-auto">
          참여 횟수, 총 거리, 총 시간, 페이스까지 4대 부문별 최고의 러너들을 소개합니다!
        </p>
      </div>

      {/* Category Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-100 p-1.5 rounded-2xl">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-xs sm:text-sm font-extrabold transition-all ${
                isActive
                  ? "bg-white text-slate-900 shadow-md scale-100"
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
              }`}
            >
              <Icon className={`w-4 h-4 ${tab.color}`} />
              <span>{tab.name}</span>
            </button>
          );
        })}
      </div>

      {/* Category Info Banner */}
      {currentCategory && (
        <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md">
          <div className="space-y-0.5">
            <h2 className="text-lg font-black flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-300" />
              {currentCategory.title} 랭킹
            </h2>
            <p className="text-xs text-blue-200">{currentCategory.subtitle}</p>
          </div>
          <div className="text-xs font-bold bg-white/10 px-3 py-1.5 rounded-full border border-white/15">
            기준 단위: {currentCategory.unit}
          </div>
        </div>
      )}

      {/* Top 3 Podium Cards */}
      {currentCategory && currentCategory.data.length >= 3 && (
        <div className="grid grid-cols-3 gap-2 sm:gap-4 items-end pt-6 pb-2">
          {/* 2nd Place (Silver) */}
          <div className="bg-white rounded-3xl p-3 sm:p-5 border border-slate-200 shadow-sm text-center space-y-2 relative order-1 hover:-translate-y-1 transition-transform">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-slate-200 text-slate-700 font-black text-sm sm:text-base flex items-center justify-center mx-auto shadow-inner">
              2
            </div>
            <div className="space-y-0.5">
              <span className="text-[10px] sm:text-xs font-bold text-slate-400">
                {top2?.grade}학년
              </span>
              <h3 className="text-xs sm:text-base font-black text-slate-800 truncate">
                {top2?.name}
              </h3>
              <p className="text-[10px] text-slate-400 truncate">
                {top2?.studentNumber}
              </p>
            </div>
            <div className="bg-slate-100 py-1.5 rounded-xl">
              <span className="text-xs sm:text-sm font-black text-slate-800">
                {top2?.primaryValue}
              </span>
            </div>
          </div>

          {/* 1st Place (Gold) - Elevated in center */}
          <div className="bg-gradient-to-b from-amber-50 to-amber-100/60 rounded-3xl p-4 sm:p-6 border-2 border-amber-300 shadow-xl text-center space-y-2.5 relative order-2 -mt-4 hover:-translate-y-1 transition-transform">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
              <Crown className="w-7 h-7 text-amber-500 fill-amber-400 animate-bounce" />
            </div>
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-300 text-amber-950 font-black text-base sm:text-lg flex items-center justify-center mx-auto shadow-lg shadow-amber-400/30">
              1
            </div>
            <div className="space-y-0.5">
              <span className="text-[10px] sm:text-xs font-extrabold text-amber-700 bg-amber-200/60 px-2 py-0.5 rounded-full">
                {top1?.grade}학년 챔피언
              </span>
              <h3 className="text-sm sm:text-lg font-black text-slate-900 truncate">
                {top1?.name}
              </h3>
              <p className="text-[10px] sm:text-xs text-amber-800/80 truncate font-semibold">
                {top1?.studentNumber}
              </p>
            </div>
            <div className="bg-amber-200/70 py-2 rounded-xl">
              <span className="text-sm sm:text-base font-black text-amber-950">
                {top1?.primaryValue}
              </span>
            </div>
          </div>

          {/* 3rd Place (Bronze) */}
          <div className="bg-white rounded-3xl p-3 sm:p-5 border border-slate-200 shadow-sm text-center space-y-2 relative order-3 hover:-translate-y-1 transition-transform">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-amber-100 text-amber-800 font-black text-sm sm:text-base flex items-center justify-center mx-auto shadow-inner">
              3
            </div>
            <div className="space-y-0.5">
              <span className="text-[10px] sm:text-xs font-bold text-slate-400">
                {top3?.grade}학년
              </span>
              <h3 className="text-xs sm:text-base font-black text-slate-800 truncate">
                {top3?.name}
              </h3>
              <p className="text-[10px] text-slate-400 truncate">
                {top3?.studentNumber}
              </p>
            </div>
            <div className="bg-slate-100 py-1.5 rounded-xl">
              <span className="text-xs sm:text-sm font-black text-slate-800">
                {top3?.primaryValue}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Top 10 Table */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-slate-100 pb-3">
          <h2 className="text-base font-black text-slate-900 flex items-center gap-1.5">
            <Medal className="w-4 h-4 text-blue-600" />
            TOP 10 랭킹 상세 명단
          </h2>

          {/* Search within ranking */}
          <div className="relative w-full sm:w-60">
            <input
              type="text"
              placeholder="학생 이름 또는 학번 검색"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-400 text-sm">
            랭킹 데이터를 집계하는 중입니다...
          </div>
        ) : filteredData.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-sm">
            조건을 만족하는 완주 학생이 없습니다.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredData.map((item) => (
              <div
                key={item.studentNumber}
                className="py-3 px-2 flex items-center justify-between gap-3 hover:bg-slate-50/80 rounded-xl transition-colors"
              >
                {/* Left: Rank & Student */}
                <div className="flex items-center gap-3">
                  <div
                    className={`w-7 h-7 rounded-lg font-black text-xs flex items-center justify-center flex-shrink-0 ${
                      item.rank === 1
                        ? "bg-amber-400 text-amber-950 shadow-sm"
                        : item.rank === 2
                        ? "bg-slate-300 text-slate-800"
                        : item.rank === 3
                        ? "bg-amber-200 text-amber-900"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {item.rank}
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-black text-sm text-slate-900">
                        {item.name}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        ({item.studentNumber})
                      </span>
                      <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-semibold">
                        {item.grade}학년
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">{item.subValue}</p>
                  </div>
                </div>

                {/* Right: Record Value */}
                <div className="text-right flex-shrink-0">
                  <span className="text-sm sm:text-base font-black text-blue-600 block">
                    {item.primaryValue}
                  </span>
                  <span className="text-[10px] text-emerald-600 font-bold">
                    마일리지 {item.totalMileage}P
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
