import { NextResponse } from "next/server";
import { readDb, getOrCreateTodaySession, getTodayKST } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = await readDb();
    const { todayStr, dayOfWeek } = getTodayKST();

    // 당일 날짜(YYYY-MM-DD, Asia/Seoul 기준) 매칭 조건을 엄격히 점검하여 이전 날짜 세션 오매핑 차단
    let session = db.sessions.find((s) => s.date === todayStr);
    if (!session) {
      session = await getOrCreateTodaySession(db);
    }

    // 만약 여전히 날짜가 일치하지 않는 경우 당일 세션으로 안전하게 생성/초기화
    if (session.date !== todayStr) {
      session = await getOrCreateTodaySession(db);
    }

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

    let status = session.status || "READY";
    let isOpen = Boolean(session.isOpen);
    let message = "";

    // Dynamic lifecycle based on KST when not OFF or CANCELLED
    if (status !== "OFF" && status !== "CANCELLED") {
      if (session.isForceOpen) {
        status = "OPEN";
        isOpen = true;
        message = "선착순 정원 해제 - 추가 참가신청 접수 중입니다.";
      } else if (kstTimeStr < "07:40") {
        status = "READY";
        isOpen = false;
        message = "아침 07:40부터 참가신청이 시작됩니다.";
      } else if (kstTimeStr >= "08:30") {
        status = "CLOSED";
        isOpen = false;
        message = "오늘 아침달리기 운영 및 접수가 마감되었습니다.";
      } else if (session.isOpen === false && session.status === "CLOSED") {
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

    const remainingSlots = session.isForceOpen
      ? Math.max(5, session.maxCapacity - applicantsCount)
      : Math.max(0, session.maxCapacity - applicantsCount);

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
        isForceOpen: Boolean(session.isForceOpen),
      },
      stats: {
        applicantsCount,
        certifiedCount,
        maxCapacity: session.maxCapacity,
        remainingSlots,
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
