import { NextResponse } from "next/server";
import { readDb, getOrCreateTodaySession, getTodayKST } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = await readDb();
    const { todayStr, dayOfWeek } = getTodayKST();

    // 1. DB에서 반드시 당일 일자(todayStr)와 일치하는 세션만 엄격 검색
    let session = db.sessions.find((s) => s.date === todayStr);
    if (!session) {
      session = await getOrCreateTodaySession(db);
    }

    // 2. 만약 오늘 날짜와 일치하지 않는 세션이 반환된 경우, 절대 이전 날짜 세션을 반환하지 않고 오늘 날짜 기본 세션 강제 보장
    if (session.date !== todayStr) {
      session = {
        id: `sess-${todayStr}`,
        date: todayStr,
        dayOfWeek,
        sessionNumber: db.sessions.filter((s) => s.status !== "OFF").length + 1,
        code: Math.floor(1000 + Math.random() * 9000).toString(),
        isOpen: false,
        maxCapacity: 30,
        isDoubleMileage: false,
        status: "READY",
      };
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

    // Active notices: 오늘 당일 세션이 실제로 CANCELLED 상태일 때만 긴급 공지를 활성화하여 과거 취소 공지 누출 차단
    const activeNotices = db.notices.filter((n) => n.isActive);
    let urgentNotice = null;
    if (session.status === "CANCELLED" && session.date === todayStr) {
      urgentNotice = activeNotices.find((n) => n.type === "URGENT") || null;
    }

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
