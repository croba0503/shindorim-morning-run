import { NextResponse } from "next/server";
import { readDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = await readDb();
    const sessionsWithStats = db.sessions.map((s) => {
      const records = db.records.filter((r) => r.sessionId === s.id);
      return {
        ...s,
        appliedCount: records.length,
        certifiedCount: records.filter((r) => r.isCertified).length,
      };
    });

    return NextResponse.json({
      success: true,
      sessions: sessionsWithStats,
      notices: db.notices.filter((n) => n.isActive),
    });
  } catch (error) {
    console.error("Error in GET /api/schedule:", error);
    return NextResponse.json(
      { success: false, message: "일정 정보를 불러오는 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
