import { NextResponse } from "next/server";
import { readDb, writeDb, getOrCreateTodaySession } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = await readDb();
    const session = await getOrCreateTodaySession(db);

    const todayRecords = db.records
      .filter((r) => r.sessionId === session.id)
      .sort((a, b) => a.appliedAt.localeCompare(b.appliedAt));

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

    // 07:40~08:30 운영 시간 자동 오픈 및 상태 동기화 (OFF 또는 CANCELLED가 아닐 때)
    if (session.status !== "OFF" && session.status !== "CANCELLED") {
      let status = session.status || "READY";
      let isOpen = Boolean(session.isOpen);

      if (session.isForceOpen) {
        status = "OPEN";
        isOpen = true;
      } else if (kstTimeStr < "07:40") {
        status = "READY";
        isOpen = false;
      } else if (kstTimeStr >= "08:30") {
        status = "CLOSED";
        isOpen = false;
      } else {
        // 07:40 ~ 08:30 사이
        if (todayRecords.length >= session.maxCapacity) {
          status = "CLOSED";
          isOpen = false;
        } else {
          status = "OPEN";
          isOpen = true;
        }
      }

      if (session.status !== status || session.isOpen !== isOpen) {
        session.status = status;
        session.isOpen = isOpen;
        await writeDb(db);
      }
    }

    const certifiedCount = todayRecords.filter((r) => r.isCertified).length;
    const waitingCount = todayRecords.filter((r) => !r.isCertified).length;

    return NextResponse.json({
      success: true,
      session,
      applicants: todayRecords,
      stats: {
        totalApplicants: todayRecords.length,
        certifiedCount,
        waitingCount,
        maxCapacity: session.maxCapacity,
        remainingSlots: Math.max(0, session.maxCapacity - todayRecords.length),
      },
    });
  } catch (error) {
    console.error("Error in GET /api/admin/session:", error);
    return NextResponse.json(
      { success: false, message: "관리자 세션 정보를 불러오는 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const db = await readDb();
    const session = await getOrCreateTodaySession(db);

    if (body.code !== undefined) {
      const trimmedCode = String(body.code).trim();
      if (!/^\d{4}$/.test(trimmedCode)) {
        return NextResponse.json(
          { success: false, message: "참가코드는 반드시 4자리 숫자여야 합니다." },
          { status: 400 }
        );
      }
      session.code = trimmedCode;
    }

    if (body.isForceOpen !== undefined) {
      session.isForceOpen = Boolean(body.isForceOpen);
      if (session.isForceOpen) {
        session.isOpen = true;
        session.status = "OPEN";
        const currentCount = db.records.filter((r) => r.sessionId === session.id).length;
        if (session.maxCapacity <= currentCount) {
          session.maxCapacity = currentCount + 10;
        }
      }
    }

    if (body.isOpen !== undefined) {
      session.isOpen = Boolean(body.isOpen);
      session.status = session.isOpen ? "OPEN" : "CLOSED";
      if (!session.isOpen) {
        session.isForceOpen = false;
      }
    }

    if (body.maxCapacity !== undefined) {
      session.maxCapacity = Math.max(1, parseInt(body.maxCapacity) || 30);
    }

    if (body.isDoubleMileage !== undefined) {
      session.isDoubleMileage = Boolean(body.isDoubleMileage);
    }

    if (body.status !== undefined) {
      session.status = body.status;
      if (body.status === "OPEN" || body.status === "READY") {
        session.isOpen = body.status === "OPEN";
        if (body.cancelReason === undefined) {
          delete session.cancelReason;
        }
      }
      if (body.status === "CLOSED" || body.status === "CANCELLED" || body.status === "OFF") {
        session.isOpen = false;
        session.isForceOpen = false;
      }
    }

    if (body.cancelReason !== undefined) {
      if (body.cancelReason) {
        session.cancelReason = body.cancelReason;
      } else {
        delete session.cancelReason;
      }
    }

    // Update in sessions array
    const idx = db.sessions.findIndex((s) => s.id === session.id);
    if (idx !== -1) {
      db.sessions[idx] = session;
    }
    await writeDb(db);

    return NextResponse.json({
      success: true,
      message: "세션 설정이 업데이트되었습니다.",
      session,
    });
  } catch (error) {
    console.error("Error in PATCH /api/admin/session:", error);
    return NextResponse.json(
      { success: false, message: "세션 업데이트 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
