import { NextResponse } from "next/server";
import { readDb, getTodayKST } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = await readDb();
    const { todayStr } = getTodayKST();

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

    const sessionsWithStats = db.sessions.map((s) => {
      const records = db.records.filter((r) => r.sessionId === s.id);
      let status = s.status;
      let isOpen = s.isOpen;

      if (s.date === todayStr && status !== "OFF" && status !== "CANCELLED") {
        if (kstTimeStr < "07:40") {
          status = "READY";
          isOpen = false;
        } else if (kstTimeStr >= "08:30") {
          status = "CLOSED";
          isOpen = false;
        } else {
          if (records.length >= s.maxCapacity) {
            status = "CLOSED";
            isOpen = false;
          } else {
            status = "OPEN";
            isOpen = true;
          }
        }
      }

      return {
        ...s,
        status,
        isOpen,
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
