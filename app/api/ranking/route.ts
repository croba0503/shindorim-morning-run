import { NextResponse } from "next/server";
import { readDb, calculatePace, formatDuration } from "@/lib/db";

export const dynamic = "force-dynamic";

interface StudentAgg {
  studentNumber: string;
  name: string;
  grade: number;
  totalRuns: number;
  totalDistance: number;
  totalDurationSeconds: number;
  avgPaceSeconds: number;
  formattedAvgPace: string;
  formattedDuration: string;
  totalMileage: number;
}

export async function GET() {
  try {
    const db = await readDb();

    // Map certified records by studentNumber
    const studentMap = new Map<string, StudentAgg>();

    for (const record of db.records) {
      if (!record.isCertified) continue;

      let agg = studentMap.get(record.studentNumber);
      if (!agg) {
        const studentInfo = db.students.find((s) => s.studentNumber === record.studentNumber);
        const grade = studentInfo ? studentInfo.grade : parseInt(record.studentNumber.charAt(0)) || 1;
        agg = {
          studentNumber: record.studentNumber,
          name: record.studentName,
          grade,
          totalRuns: 0,
          totalDistance: 0,
          totalDurationSeconds: 0,
          avgPaceSeconds: 0,
          formattedAvgPace: "-",
          formattedDuration: "0분",
          totalMileage: 0,
        };
        studentMap.set(record.studentNumber, agg);
      }

      agg.totalRuns += 1;
      agg.totalDistance += record.distanceKm || 0;
      agg.totalDurationSeconds += record.durationSeconds || 0;
      agg.totalMileage += record.mileage || 0;
    }

    const studentList: StudentAgg[] = Array.from(studentMap.values()).map((s) => {
      s.totalDistance = Math.round(s.totalDistance * 10) / 10;
      s.totalMileage = Math.round(s.totalMileage * 10) / 10;
      s.formattedDuration = formatDuration(s.totalDurationSeconds);

      if (s.totalDistance > 0 && s.totalDurationSeconds > 0) {
        s.avgPaceSeconds = s.totalDurationSeconds / s.totalDistance;
        s.formattedAvgPace = calculatePace(s.totalDistance, s.totalDurationSeconds);
      } else {
        s.avgPaceSeconds = 999999;
        s.formattedAvgPace = "-";
      }
      return s;
    });

    // 1. 운동장지박령: 참여 횟수 내림차순, 총 거리 내림차순
    const ghost = [...studentList]
      .sort((a, b) => b.totalRuns - a.totalRuns || b.totalDistance - a.totalDistance)
      .slice(0, 10)
      .map((item, idx) => ({
        rank: idx + 1,
        ...item,
        primaryValue: `${item.totalRuns}회`,
        subValue: `누적 ${item.totalDistance}km`,
      }));

    // 2. 대지의 탐험가: 총 달린 거리 내림차순
    const explorer = [...studentList]
      .sort((a, b) => b.totalDistance - a.totalDistance)
      .slice(0, 10)
      .map((item, idx) => ({
        rank: idx + 1,
        ...item,
        primaryValue: `${item.totalDistance.toFixed(1)} km`,
        subValue: `참여 ${item.totalRuns}회 (${item.formattedDuration})`,
      }));

    // 3. 에너자이저: 총 달린 시간 내림차순
    const energizer = [...studentList]
      .sort((a, b) => b.totalDurationSeconds - a.totalDurationSeconds)
      .slice(0, 10)
      .map((item, idx) => ({
        rank: idx + 1,
        ...item,
        primaryValue: item.formattedDuration,
        subValue: `누적 ${item.totalDistance.toFixed(1)}km / ${item.totalRuns}회`,
      }));

    // 4. 스피드 러너: 평균 페이스 오름차순 (공정성을 위해 최소 3회 이상 완주자 대상)
    const speed = [...studentList]
      .filter((s) => s.totalRuns >= 3 && s.avgPaceSeconds < 999999)
      .sort((a, b) => a.avgPaceSeconds - b.avgPaceSeconds)
      .slice(0, 10)
      .map((item, idx) => ({
        rank: idx + 1,
        ...item,
        primaryValue: `${item.formattedAvgPace} /km`,
        subValue: `완주 ${item.totalRuns}회 (${item.totalDistance.toFixed(1)}km)`,
      }));

    return NextResponse.json({
      success: true,
      rankings: {
        ghost: {
          title: "운동장지박령",
          subtitle: "성실함의 끝판왕! 최다 참여 횟수 랭킹",
          unit: "회",
          data: ghost,
        },
        explorer: {
          title: "대지의 탐험가",
          subtitle: "지구를 달리는 마라토너! 최장 달린 거리 랭킹",
          unit: "km",
          data: explorer,
        },
        energizer: {
          title: "에너자이저",
          subtitle: "지치지 않는 체력왕! 최장 달린 시간 랭킹",
          unit: "시간",
          data: energizer,
        },
        speed: {
          title: "스피드 러너",
          subtitle: "바람을 가르는 질주! 최속 평균 페이스 랭킹 (3회 이상 완주자)",
          unit: "페이스",
          data: speed,
        },
      },
    });
  } catch (error) {
    console.error("Error in GET /api/ranking:", error);
    return NextResponse.json({ success: false, message: "랭킹을 불러오는 중 오류가 발생했습니다." }, { status: 500 });
  }
}
