import { NextResponse } from "next/server";
import { readDb, writeDb, Session } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const db = await readDb();
    const sorted = [...db.sessions].sort((a, b) => b.date.localeCompare(a.date));
    return NextResponse.json({
      success: true,
      sessions: sorted,
    });
  } catch (error) {
    console.error("Error in GET /api/admin/schedule:", error);
    return NextResponse.json(
      { success: false, message: "일정 목록을 불러오는 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { date, dayOfWeek, sessionNumber, code, isOpen, maxCapacity, isDoubleMileage, status, notice } = body;

    if (!date) {
      return NextResponse.json(
        { success: false, message: "일정 날짜(YYYY-MM-DD)를 입력해주세요." },
        { status: 400 }
      );
    }

    const db = await readDb();

    // Check if session date already exists
    const existing = db.sessions.find((s) => s.date === date);
    if (existing) {
      return NextResponse.json(
        { success: false, message: `이미 해당 날짜(${date})의 일정이 존재합니다.` },
        { status: 400 }
      );
    }

    const newSession: Session = {
      id: `sess-${date}`,
      date,
      dayOfWeek: dayOfWeek || "월",
      sessionNumber: sessionNumber || db.sessions.length + 1,
      code: code || Math.floor(1000 + Math.random() * 9000).toString(),
      isOpen: isOpen !== undefined ? Boolean(isOpen) : false,
      maxCapacity: maxCapacity ? parseInt(maxCapacity) : 30,
      isDoubleMileage: Boolean(isDoubleMileage),
      status: status || "READY",
      notice: notice || undefined,
    };

    db.sessions.push(newSession);
    await writeDb(db);

    return NextResponse.json({
      success: true,
      message: `${date} (${newSession.dayOfWeek}) 일정이 성공적으로 추가되었습니다.`,
      session: newSession,
    });
  } catch (error) {
    console.error("Error in POST /api/admin/schedule:", error);
    return NextResponse.json(
      { success: false, message: "일정 추가 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, date, dayOfWeek, sessionNumber, code, isOpen, maxCapacity, isDoubleMileage, status, notice, cancelReason } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, message: "수정할 일정 ID가 필요합니다." },
        { status: 400 }
      );
    }

    const db = await readDb();
    const session = db.sessions.find((s) => s.id === id);

    if (!session) {
      return NextResponse.json(
        { success: false, message: "해당 일정을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    if (date !== undefined) session.date = date;
    if (dayOfWeek !== undefined) session.dayOfWeek = dayOfWeek;
    if (sessionNumber !== undefined) session.sessionNumber = parseInt(sessionNumber);
    if (code !== undefined) session.code = code;
    if (isOpen !== undefined) session.isOpen = Boolean(isOpen);
    if (maxCapacity !== undefined) session.maxCapacity = parseInt(maxCapacity);
    if (isDoubleMileage !== undefined) session.isDoubleMileage = Boolean(isDoubleMileage);
    if (status !== undefined) session.status = status;
    if (notice !== undefined) session.notice = notice;
    if (cancelReason !== undefined) session.cancelReason = cancelReason;

    await writeDb(db);

    return NextResponse.json({
      success: true,
      message: "일정이 성공적으로 수정되었습니다.",
      session,
    });
  } catch (error) {
    console.error("Error in PATCH /api/admin/schedule:", error);
    return NextResponse.json(
      { success: false, message: "일정 수정 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, message: "삭제할 일정 ID가 필요합니다." },
        { status: 400 }
      );
    }

    const db = await readDb();
    const prevCount = db.sessions.length;
    db.sessions = db.sessions.filter((s) => s.id !== id);

    if (db.sessions.length === prevCount) {
      return NextResponse.json(
        { success: false, message: "삭제할 일정을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    await writeDb(db);

    return NextResponse.json({
      success: true,
      message: "일정이 삭제되었습니다.",
    });
  } catch (error) {
    console.error("Error in DELETE /api/admin/schedule:", error);
    return NextResponse.json(
      { success: false, message: "일정 삭제 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
