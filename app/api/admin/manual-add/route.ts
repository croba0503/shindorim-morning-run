import { NextResponse } from "next/server";
import { readDb, writeDb, getOrCreateTodaySession, calculatePace } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      studentNumber,
      name,
      distanceKm,
      durationMinutes,
      durationSeconds = 0,
      isDoubleMileage = false,
      customMileage,
      note,
    } = body;

    const trimmedNum = (studentNumber || "").trim();
    const trimmedName = (name || "").trim();

    if (!trimmedNum || !trimmedName) {
      return NextResponse.json(
        { success: false, message: "학번과 이름을 모두 입력해주세요." },
        { status: 400 }
      );
    }

    const dist = parseFloat(distanceKm);
    if (isNaN(dist) || dist <= 0) {
      return NextResponse.json(
        { success: false, message: "달린 거리(km)를 올바르게 입력해주세요." },
        { status: 400 }
      );
    }

    const totalSeconds =
      (parseInt(durationMinutes) || 0) * 60 + (parseInt(durationSeconds) || 0);
    if (totalSeconds <= 0) {
      return NextResponse.json(
        { success: false, message: "달린 시간을 올바르게 입력해주세요." },
        { status: 400 }
      );
    }

    const db = await readDb();
    const session = getOrCreateTodaySession(db);

    // Find or create student
    let student = db.students.find((s) => s.studentNumber === trimmedNum);
    if (!student) {
      student = {
        id: `stu-${trimmedNum}`,
        studentNumber: trimmedNum,
        name: trimmedName,
        grade: parseInt(trimmedNum.charAt(0)) || 1,
        createdAt: new Date().toISOString(),
      };
      db.students.push(student);
    } else {
      student.name = trimmedName;
    }

    // Pace and mileage
    const pace = calculatePace(dist, totalSeconds);
    let finalMileage: number;
    if (customMileage !== undefined && customMileage !== null && customMileage !== "") {
      finalMileage = Math.round(parseFloat(customMileage) * 10) / 10;
    } else {
      const baseMileage = Math.round(dist * 10) / 10;
      finalMileage = isDoubleMileage ? Math.round(baseMileage * 2 * 10) / 10 : baseMileage;
    }

    const newRecord = {
      id: `rec-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      sessionId: session.id,
      sessionDate: session.date,
      studentId: student.id,
      studentNumber: student.studentNumber,
      studentName: student.name,
      appliedAt: new Date().toISOString(),
      isCertified: true,
      distanceKm: Math.round(dist * 10) / 10,
      durationSeconds: totalSeconds,
      pace,
      mileage: finalMileage,
      certifiedAt: new Date().toISOString(),
      note: note || "교사 현장 수동 등록",
    };

    db.records.push(newRecord);
    await writeDb(db);

    return NextResponse.json({
      success: true,
      message: `${student.name} 학생의 기록이 현장 등록 및 인증되었습니다.`,
      record: newRecord,
    });
  } catch (error) {
    console.error("Error in POST /api/admin/manual-add:", error);
    return NextResponse.json(
      { success: false, message: "수동 등록 처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
