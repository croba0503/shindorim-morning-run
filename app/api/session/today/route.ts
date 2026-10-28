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

    // Calculate KST current time (HH:mm)
    const now = new Date();
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Seoul",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).formatToParts(now);
    const p = Object.fromEntries(parts.map((x) => [x.type, x.value]));
    const hour = (p.hour === "24" ? "00" : p.hour).padStart(2, "0");
    const minute = p.minute.padStart(2, "0");
    const kstTimeStr = `${hour}:${minute}`;

    let status = session.status;
    let isOpen = session.isOpen;
    let message = "";

    // Dynamic lifecycle based on KST when not OFF or CANCELLED
    if (status !== "OFF" && status !== "CANCELLED") {
      if (kstTimeStr < "07:40") {
        status = "READY";
        isOpen = false;
        message = "아침 07:40부터 참가신청이 시작됩니다.";
      } else if (kstTimeStr >= "08:30") {
        status = "CLOSED";
        isOpen = false;
        message = "오늘 아침달리기 운영 및 접수가 마감되었습니다.";
      } else {
        // Between 07:40 and 08:30
        if (applicantsCount >= session.maxCapacity) {
          status = "CLOSED";
          isOpen = false;
          message = `오늘 선착순 ${session.maxCapacity}명 신청이 마감되었습니다.`;
        } else {
          status = "OPEN";
          isOpen = true;
          message = "선착순 참가신청 접수 중입니다.";
        }
      }
    }

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
        isOpen,
        maxCapacity: session.maxCapacity,
        isDoubleMileage: session.isDoubleMileage,
        status,
        cancelReason: session.cancelReason,
        notice: session.notice,
      },
      stats: {
        applicantsCount,
        certifiedCount,
        maxCapacity: session.maxCapacity,
        remainingSlots: Math.max(0, session.maxCapacity - applicantsCount),
      },
      message,
      kstTimeStr,
      urgentNotice,
      notices: activeNotices,
    });
  } catch (error) {
    console.error("Error in GET /api/session/today:", error);
    return NextResponse.json({ success: false, message: "세션 정보를 불러오는 중 오류가 발생했습니다." }, { status: 500 });
  }
}
