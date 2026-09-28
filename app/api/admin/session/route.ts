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

    if (body.isOpen !== undefined) {
      session.isOpen = Boolean(body.isOpen);
      session.status = session.isOpen ? "OPEN" : "CLOSED";
    }

    if (body.isDoubleMileage !== undefined) {
      session.isDoubleMileage = Boolean(body.isDoubleMileage);
    }

    if (body.status !== undefined) {
      session.status = body.status;
      if (body.status === "OPEN") session.isOpen = true;
      if (body.status === "CLOSED" || body.status === "CANCELLED") session.isOpen = false;
    }

    if (body.cancelReason !== undefined) {
      session.cancelReason = body.cancelReason;
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
