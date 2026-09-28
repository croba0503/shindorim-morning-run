import { NextResponse } from "next/server";
import { readDb, writeDb, getOrCreateTodaySession } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { studentNumber, name, code } = body;

    const trimmedStudentNumber = (studentNumber || "").trim();
    const trimmedName = (name || "").trim();
    const trimmedCode = (code || "").trim();

    if (!trimmedStudentNumber || !trimmedName || !trimmedCode) {
      return NextResponse.json(
        { success: false, message: "학번, 이름, 참가코드를 모두 올바르게 입력해주세요." },
        { status: 400 }
      );
    }

    const db = await readDb();
    const session = await getOrCreateTodaySession(db);

    // Check if session is open
    if (!session.isOpen || session.status !== "OPEN") {
      return NextResponse.json(
        { success: false, message: "현재 아침달리기 참가 신청이 접수 중이 아닙니다." },
        { status: 400 }
      );
    }

    // Check participation code
    if (session.code !== trimmedCode) {
      return NextResponse.json(
        { success: false, message: "참가코드가 일치하지 않습니다. 운동장 본부석 선생님께 확인해주세요." },
        { status: 400 }
      );
    }

    // Check capacity (선착순 30명)
    const todayRecords = db.records.filter((r) => r.sessionId === session.id);
    if (todayRecords.length >= session.maxCapacity) {
      return NextResponse.json(
        { success: false, message: `오늘 선착순 ${session.maxCapacity}명 신청이 이미 마감되었습니다.` },
        { status: 400 }
      );
    }

    // Check if already applied today
    const alreadyApplied = todayRecords.find(
      (r) => r.studentNumber === trimmedStudentNumber
    );
    if (alreadyApplied) {
      return NextResponse.json(
        {
          success: false,
          message: `이미 오늘(${session.date}) 신청이 완료되었습니다. (접수번호: #${todayRecords.indexOf(alreadyApplied) + 1})`,
        },
        { status: 400 }
      );
    }

    // Find or create student
    let student = db.students.find((s) => s.studentNumber === trimmedStudentNumber);
    if (!student) {
      const grade = parseInt(trimmedStudentNumber.charAt(0)) || 1;
      student = {
        id: `stu-${trimmedStudentNumber}`,
        studentNumber: trimmedStudentNumber,
        name: trimmedName,
        grade,
        createdAt: new Date().toISOString(),
      };
      db.students.push(student);
    } else {
      // update name if provided differently
      student.name = trimmedName;
    }

    // Create record
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
    };

    db.records.push(newRecord);
    await writeDb(db);

    const queueNumber = todayRecords.length + 1;

    return NextResponse.json({
      success: true,
      message: `신청이 성공적으로 완료되었습니다! (선착순 ${queueNumber}/${session.maxCapacity}번)`,
      ticket: {
        queueNumber,
        studentNumber: student.studentNumber,
        name: student.name,
        date: session.date,
        sessionNumber: session.sessionNumber,
        isDoubleMileage: session.isDoubleMileage,
      },
    });
  } catch (error) {
    console.error("Error in POST /api/apply:", error);
    return NextResponse.json({ success: false, message: "신청 처리 중 서버 오류가 발생했습니다." }, { status: 500 });
  }
}
