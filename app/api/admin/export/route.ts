import { NextResponse } from "next/server";
import { readDb, calculatePace, formatDuration } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "summary";
    const db = await readDb();

    let csvContent = "\uFEFF"; // UTF-8 BOM for Excel compatibility

    if (type === "summary") {
      // Student Aggregated Summary
      csvContent += "학번,이름,학년,완주 횟수,총 달린 거리(km),총 달린 시간,평균 페이스,누적 마일리지(P)\n";

      // Group certified records by studentNumber
      const studentMap = new Map<string, {
        studentNumber: string;
        name: string;
        grade: number;
        runs: number;
        distance: number;
        duration: number;
        mileage: number;
      }>();

      for (const s of db.students) {
        studentMap.set(s.studentNumber, {
          studentNumber: s.studentNumber,
          name: s.name,
          grade: s.grade,
          runs: 0,
          distance: 0,
          duration: 0,
          mileage: 0,
        });
      }

      for (const r of db.records) {
        if (!r.isCertified) continue;
        let item = studentMap.get(r.studentNumber);
        if (!item) {
          item = {
            studentNumber: r.studentNumber,
            name: r.studentName,
            grade: parseInt(r.studentNumber.charAt(0)) || 1,
            runs: 0,
            distance: 0,
            duration: 0,
            mileage: 0,
          };
          studentMap.set(r.studentNumber, item);
        }
        item.runs += 1;
        item.distance += r.distanceKm || 0;
        item.duration += r.durationSeconds || 0;
        item.mileage += r.mileage || 0;
      }

      const rows = Array.from(studentMap.values()).sort(
        (a, b) => b.runs - a.runs || b.distance - a.distance
      );

      for (const row of rows) {
        const dist = Math.round(row.distance * 10) / 10;
        const mil = Math.round(row.mileage * 10) / 10;
        const durStr = formatDuration(row.duration);
        const paceStr =
          row.distance > 0 && row.duration > 0
            ? calculatePace(row.distance, row.duration)
            : "-";

        csvContent += `"${row.studentNumber}","${row.name}",${row.grade},${row.runs},${dist},"${durStr}","${paceStr}",${mil}\n`;
      }
    } else {
      // Detailed Run History
      csvContent += "날짜,학번,이름,인증상태,거리(km),시간,페이스,적립마일리지(P),인증시각,비고\n";
      const sortedRecords = [...db.records].sort((a, b) =>
        b.sessionDate.localeCompare(a.sessionDate)
      );

      for (const r of sortedRecords) {
        const durStr = formatDuration(r.durationSeconds);
        const statusStr = r.isCertified ? "완주인증" : "신청대기";
        csvContent += `"${r.sessionDate}","${r.studentNumber}","${r.studentName}","${statusStr}",${r.distanceKm},"${durStr}","${r.pace}",${r.mileage},"${r.certifiedAt || "-"}","${r.note || ""}"\n`;
      }
    }

    const filename = `신도림중_아침달리기_${type === "summary" ? "학생별누적현황" : "상세이력"}_${new Date().toISOString().slice(0, 10)}.csv`;

    return new NextResponse(csvContent, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(filename)}"`,
      },
    });
  } catch (error) {
    console.error("Error in GET /api/admin/export:", error);
    return NextResponse.json(
      { success: false, message: "엑셀 데이터 생성 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
