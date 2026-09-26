import { NextResponse } from "next/server";
import { readDb, calculatePace, formatDuration } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const studentNumber = (searchParams.get("studentNumber") || "").trim();
    const name = (searchParams.get("name") || "").trim();

    if (!studentNumber || !name) {
      return NextResponse.json(
        { success: false, message: "학번과 이름을 모두 입력해주세요." },
        { status: 400 }
      );
    }

    const db = await readDb();

    // Check student
    const student = db.students.find(
      (s) => s.studentNumber === studentNumber && s.name === name
    );

    // Also look up records by studentNumber
    const studentRecords = db.records.filter(
      (r) => r.studentNumber === studentNumber
    );

    if (!student && studentRecords.length === 0) {
      return NextResponse.json(
        { success: false, message: "등록된 학생 또는 참가 기록을 찾을 수 없습니다. 학번과 이름을 다시 확인해주세요." },
        { status: 404 }
      );
    }

    // Certified records
    const certifiedRecords = studentRecords.filter((r) => r.isCertified);

    // Total runs
    const totalRuns = certifiedRecords.length;

    // Total distance
    const totalDistance = Math.round(
      certifiedRecords.reduce((acc, r) => acc + (r.distanceKm || 0), 0) * 10
    ) / 10;

    // Total duration
    const totalDurationSeconds = certifiedRecords.reduce(
      (acc, r) => acc + (r.durationSeconds || 0),
      0
    );

    // Total mileage
    const totalMileage = Math.round(
      certifiedRecords.reduce((acc, r) => acc + (r.mileage || 0), 0) * 10
    ) / 10;

    // Average pace
    const avgPace =
      totalDistance > 0 && totalDurationSeconds > 0
        ? calculatePace(totalDistance, totalDurationSeconds)
        : "-";

    // Sorted history (latest first)
    const sortedHistory = [...studentRecords].sort((a, b) =>
      b.appliedAt.localeCompare(a.appliedAt)
    );

    return NextResponse.json({
      success: true,
      student: {
        studentNumber,
        name: student ? student.name : name,
        grade: student ? student.grade : parseInt(studentNumber.charAt(0)) || 1,
      },
      stats: {
        totalRuns,
        totalDistance,
        totalDurationSeconds,
        formattedDuration: formatDuration(totalDurationSeconds),
        avgPace,
        totalMileage,
      },
      history: sortedHistory,
    });
  } catch (error) {
    console.error("Error in GET /api/records/my:", error);
    return NextResponse.json(
      { success: false, message: "기록을 불러오는 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
