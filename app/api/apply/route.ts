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

    // 1. Check OFF / CANCELLED status (원천 차단)
    if (session.status === "OFF") {
      return NextResponse.json(
        { success: false, message: "오늘은 정기 미운영일로 신청할 수 없습니다." },
        { status: 400 }
      );
    }
    if (session.status === "CANCELLED") {
      return NextResponse.json(
        { success: false, message: "기상 악화로 취소된 차시에는 신청할 수 없습니다." },
        { status: 400 }
      );
    }

    const todayRecords = db.records.filter((r) => r.sessionId === session.id);

    // 2. KST time & capacity validation - isForceOpen인 경우 시간/정원 제한 우회
    if (!session.isForceOpen) {
      if (kstTimeStr < "07:40") {
        return NextResponse.json(
          { success: false, message: "아침 07:40부터 참가신청이 시작됩니다." },
          { status: 400 }
        );
      }

      if (kstTimeStr >= "08:30") {
        return NextResponse.json(
          { success: false, message: "오늘 아침달리기 접수가 마감되었습니다." },
          { status: 400 }
        );
      }

      if (todayRecords.length >= session.maxCapacity) {
        return NextResponse.json(
          { success: false, message: `오늘 선착순 ${session.maxCapacity}명 신청이 이미 마감되었습니다.` },
          { status: 400 }
        );
      }
    }

    // 3. 07:40~08:30 운영 시간 내 정상 신청 시 자동으로 isOpen: true, status: "OPEN" 동기화
    if (!session.isOpen || session.status !== "OPEN") {
      session.isOpen = true;
      session.status = "OPEN";
    }

    // Check participation code
    if (session.code !== trimmedCode) {
      return NextResponse.json(
        { success: false, message: "참가코드가 일치하지 않습니다. 운동장 본부석 선생님께 확인해주세요." },
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
