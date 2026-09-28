import { NextResponse } from "next/server";
import { readDb, getOrCreateTodaySession } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = await readDb();
    const session = await getOrCreateTodaySession(db);

    const todayRecords = db.records.filter((r) => r.sessionId === session.id);
    const applicantsCount = todayRecords.length;
    const certifiedCount = todayRecords.filter((r) => r.isCertified).length;

    // Active notices
    const activeNotices = db.notices.filter((n) => n.isActive);
    const urgentNotice = activeNotices.find((n) => n.type === "URGENT") || null;

    return NextResponse.json({
      success: true,
      session: {
        id: session.id,
        date: session.date,
        dayOfWeek: session.dayOfWeek,
        sessionNumber: session.sessionNumber,
        isOpen: session.isOpen,
        maxCapacity: session.maxCapacity,
        isDoubleMileage: session.isDoubleMileage,
        status: session.status,
        cancelReason: session.cancelReason,
        notice: session.notice,
      },
      stats: {
        applicantsCount,
        certifiedCount,
        maxCapacity: session.maxCapacity,
        remainingSlots: Math.max(0, session.maxCapacity - applicantsCount),
      },
      urgentNotice,
      notices: activeNotices,
    });
  } catch (error) {
    console.error("Error in GET /api/session/today:", error);
    return NextResponse.json({ success: false, message: "세션 정보를 불러오는 중 오류가 발생했습니다." }, { status: 500 });
  }
}
