import { NextResponse } from "next/server";
import { readDb, writeDb, getOrCreateTodaySession } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { studentNumber, name, note } = body;

    const trimmedNum = (studentNumber || "").trim();
    const trimmedName = (name || "").trim();

    if (!trimmedNum || !trimmedName) {
      return NextResponse.json(
        { success: false, message: "학번과 이름을 모두 입력해주세요." },
        { status: 400 }
      );
    }

    const db = await readDb();
    const session = await getOrCreateTodaySession(db);

    // 중복 신청 체크
    const alreadyApplied = db.records.find(
      (r) => r.sessionId === session.id && r.studentNumber === trimmedNum
    );
    if (alreadyApplied) {
      return NextResponse.json(
        { success: false, message: `해당 학생(${trimmedName})은 이미 오늘 신청 내역이 존재합니다.` },
        { status: 400 }
      );
    }

    // 학생 정보 조회 또는 신규 생성
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

    // 요구사항: '신청 접수(미완주)' 상태로 등록하여 완주 대기 상태 유지
    const newRecord = {
      id: `rec-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      sessionId: session.id,
      sessionDate: session.date,
      studentId: student.id,
      studentNumber: student.studentNumber,
      studentName: student.name,
      appliedAt: new Date().toISOString(),
      isCertified: false,
      distanceKm: 0,
      durationSeconds: 0,
      pace: "-",
      mileage: 0,
      note: note ? note.trim() : "현장 수동 접수",
    };

    db.records.push(newRecord);
    await writeDb(db);

    return NextResponse.json({
      success: true,
      message: `${student.name} 학생의 신청이 접수되었습니다. 완주 후 본부석에서 기록을 인증해 주세요.`,
      record: newRecord,
    });
  } catch (error) {
    console.error("Error in POST /api/admin/manual-add:", error);
    return NextResponse.json(
      { success: false, message: "현장 수동 등록 처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
