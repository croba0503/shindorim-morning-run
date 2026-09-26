import { NextResponse } from "next/server";
import { readDb, writeDb, calculatePace } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      recordId,
      distanceKm,
      durationMinutes,
      durationSeconds = 0,
      isDoubleMileage = false,
      customMileage,
      note,
    } = body;

    if (!recordId) {
      return NextResponse.json(
        { success: false, message: "기록 ID가 누락되었습니다." },
        { status: 400 }
      );
    }

    const dist = parseFloat(distanceKm);
    if (isNaN(dist) || dist <= 0) {
      return NextResponse.json(
        { success: false, message: "올바른 달린 거리(km)를 입력해주세요." },
        { status: 400 }
      );
    }

    const totalSeconds =
      (parseInt(durationMinutes) || 0) * 60 + (parseInt(durationSeconds) || 0);
    if (totalSeconds <= 0) {
      return NextResponse.json(
        { success: false, message: "달린 시간을 입력해주세요." },
        { status: 400 }
      );
    }

    const db = await readDb();
    const record = db.records.find((r) => r.id === recordId);

    if (!record) {
      return NextResponse.json(
        { success: false, message: "해당 신청 기록을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // Calculate pace
    const pace = calculatePace(dist, totalSeconds);

    // Calculate mileage
    let finalMileage: number;
    if (customMileage !== undefined && customMileage !== null && customMileage !== "") {
      finalMileage = Math.round(parseFloat(customMileage) * 10) / 10;
    } else {
      const baseMileage = Math.round(dist * 10) / 10;
      finalMileage = isDoubleMileage ? Math.round(baseMileage * 2 * 10) / 10 : baseMileage;
    }

    record.isCertified = true;
    record.distanceKm = Math.round(dist * 10) / 10;
    record.durationSeconds = totalSeconds;
    record.pace = pace;
    record.mileage = finalMileage;
    record.certifiedAt = new Date().toISOString();
    if (note !== undefined) {
      record.note = note;
    }

    await writeDb(db);

    return NextResponse.json({
      success: true,
      message: `${record.studentName} 학생의 완주 인증이 완료되었습니다! (${record.distanceKm}km, ${finalMileage}P 지급)`,
      record,
    });
  } catch (error) {
    console.error("Error in POST /api/admin/certify:", error);
    return NextResponse.json(
      { success: false, message: "인증 처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
