import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import NoticeBanner from "@/components/NoticeBanner";

export const metadata: Metadata = {
  title: "신도림중학교 아침달리기 프로젝트 | 건강안전부",
  description:
    "신도림중학교 건강안전부 주관 아침달리기 프로젝트 관리 시스템 (월~목 07:50~08:25 운동장, 선착순 30명, 나이키런 2km 완주 인증 및 마일리지 랭킹)",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans antialiased selection:bg-blue-500 selection:text-white">
        <NoticeBanner />
        <Navbar />
        <main className="flex-1 pb-20 md:pb-12">{children}</main>
        <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
          <div className="max-w-6xl mx-auto px-4 space-y-1.5">
            <p className="font-bold text-slate-700">
              신도림중학교 건강안전부 | 2026학년도 학생 건강체력 증진 아침달리기 프로젝트
            </p>
            <p>
              운영 시간: 매주 월, 화, 수, 목 07:50 ~ 08:25 | 장소: 학교 운동장 본부석 | 정원: 매 차시 선착순 30명
            </p>
            <p className="text-[11px] text-slate-400">
              본 시스템은 신도림중학교 학생 및 교사를 위한 공식 달리기 기록·마일리지 관리 웹 서비스입니다.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
