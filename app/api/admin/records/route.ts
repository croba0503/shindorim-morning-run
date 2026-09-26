import { NextResponse } from "next/server";
import { readDb, writeDb, calculatePace } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const search = (searchParams.get("search") || "").trim().toLowerCase();
    const date = searchParams.get("date") || "";

    const db = await readDb();
    let filtered = [...db.records];

    if (date) {
      filtered = filtered.filter((r) => r.sessionDate === date);
    }

    if (search) {
      filtered = filtered.filter(
        (r) =>
          r.studentNumber.includes(search) ||
          r.studentName.toLowerCase().includes(search)
      );
    }

    // Sort by appliedAt desc
    filtered.sort((a, b) => b.appliedAt.localeCompare(a.appliedAt));

    return NextResponse.json({
      success: true,
      records: filtered,
      totalCount: filtered.length,
    });
  } catch (error) {
    console.error("Error in GET /api/admin/records:", error);
    return NextResponse.json(
      { success: false, message: "기록 목록을 불러오는 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, distanceKm, durationSeconds, mileage, note, isCertified } = body;

    const db = await readDb();
    const record = db.records.find((r) => r.id === id);
    if (!record) {
      return NextResponse.json(
        { success: false, message: "수정할 기록을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    if (distanceKm !== undefined) record.distanceKm = parseFloat(distanceKm);
    if (durationSeconds !== undefined) record.durationSeconds = parseInt(durationSeconds);
    if (mileage !== undefined) record.mileage = parseFloat(mileage);
    if (note !== undefined) record.note = note;
    if (isCertified !== undefined) record.isCertified = Boolean(isCertified);

    if (record.distanceKm > 0 && record.durationSeconds > 0) {
      record.pace = calculatePace(record.distanceKm, record.durationSeconds);
    }

    await writeDb(db);

    return NextResponse.json({
      success: true,
      message: "기록이 수정되었습니다.",
      record,
    });
  } catch (error) {
    console.error("Error in PATCH /api/admin/records:", error);
    return NextResponse.json(
      { success: false, message: "기록 수정 중 오류가 발생했습니다." },
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
        { success: false, message: "기록 ID가 필요합니다." },
        { status: 400 }
      );
    }

    const db = await readDb();
    const initLen = db.records.length;
    db.records = db.records.filter((r) => r.id !== id);

    if (db.records.length === initLen) {
      return NextResponse.json(
        { success: false, message: "삭제할 기록을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    await writeDb(db);

    return NextResponse.json({
      success: true,
      message: "기록이 성공적으로 삭제되었습니다.",
    });
  } catch (error) {
    console.error("Error in DELETE /api/admin/records:", error);
    return NextResponse.json(
      { success: false, message: "기록 삭제 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
