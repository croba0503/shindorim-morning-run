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
  // 시간/페이스 랭킹 전용 집계 (excludeFromTimeRank !== true 기록만 반영)
  timedRuns: number;
  timedDistance: number;
  timedDurationSeconds: number;
  formattedTimedDuration: string;
}

export async function GET() {
  try {
    const db = await readDb();

    // 규칙 ①: 미완주(isCertified !== true) 학생은 원천 배제하여 참여하지 않은 것으로 간주
    const certifiedRecords = (db.records || []).filter((r) => r.isCertified === true);

    // Map certified records by studentNumber
    const studentMap = new Map<string, StudentAgg>();

    for (const record of certifiedRecords) {
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
          avgPaceSeconds: 999999,
          formattedAvgPace: "-",
          formattedDuration: "0분",
          totalMileage: 0,
          timedRuns: 0,
          timedDistance: 0,
          timedDurationSeconds: 0,
          formattedTimedDuration: "0분",
        };
        studentMap.set(record.studentNumber, agg);
      }

      // 규칙 ②: 참여 횟수(출석), 누적 달린 거리 및 마일리지는 excludeFromTimeRank 여부와 관계없이 정상 인정
      agg.totalRuns += 1;
      agg.totalDistance += record.distanceKm || 0;
      agg.totalDurationSeconds += record.durationSeconds || 0;
      agg.totalMileage += record.mileage || 0;

      // 규칙 ②: 시간 관련 랭킹(스피드/페이스 랭킹, 최단/최장 시간 랭킹)은 excludeFromTimeRank !== true 인 유효 시간 기록만 반영
      if (!record.excludeFromTimeRank && (record.durationSeconds || 0) > 0 && (record.distanceKm || 0) > 0) {
        agg.timedRuns += 1;
        agg.timedDistance += record.distanceKm;
        agg.timedDurationSeconds += record.durationSeconds;
      }
    }

    const studentList: StudentAgg[] = Array.from(studentMap.values()).map((s) => {
      s.totalDistance = Math.round(s.totalDistance * 10) / 10;
      s.totalMileage = Math.round(s.totalMileage * 10) / 10;
      s.formattedDuration = formatDuration(s.totalDurationSeconds);

      s.timedDistance = Math.round(s.timedDistance * 10) / 10;
      s.formattedTimedDuration = formatDuration(s.timedDurationSeconds);

      if (s.timedDistance > 0 && s.timedDurationSeconds > 0) {
        s.avgPaceSeconds = s.timedDurationSeconds / s.timedDistance;
        s.formattedAvgPace = calculatePace(s.timedDistance, s.timedDurationSeconds);
      } else {
        s.avgPaceSeconds = 999999;
        s.formattedAvgPace = "-";
      }
      return s;
    });

    // 1. 운동장지박령: 참여 횟수 내림차순, 총 거리 내림차순 (완주 학생 전체, excludeFromTimeRank 정상 포함)
    const ghost = [...studentList]
      .sort((a, b) => b.totalRuns - a.totalRuns || b.totalDistance - a.totalDistance)
      .slice(0, 10)
      .map((item, idx) => ({
        rank: idx + 1,
        ...item,
        primaryValue: `${item.totalRuns}회`,
        subValue: `누적 ${item.totalDistance}km`,
      }));

    // 2. 대지의 탐험가: 총 달린 거리 내림차순 (완주 학생 전체, excludeFromTimeRank 정상 포함)
    const explorer = [...studentList]
      .sort((a, b) => b.totalDistance - a.totalDistance || b.totalRuns - a.totalRuns)
      .slice(0, 10)
      .map((item, idx) => ({
        rank: idx + 1,
        ...item,
        primaryValue: `${item.totalDistance.toFixed(1)} km`,
        subValue: `완주 ${item.totalRuns}회`,
      }));

    // 3. 에너자이저: 총 달린 시간 내림차순 (시간 관련 랭킹: excludeFromTimeRank 제외된 유효 기록 시간만 산정)
    const energizer = [...studentList]
      .filter((s) => s.timedDurationSeconds > 0)
      .sort((a, b) => b.timedDurationSeconds - a.timedDurationSeconds)
      .slice(0, 10)
      .map((item, idx) => ({
        rank: idx + 1,
        ...item,
        primaryValue: item.formattedTimedDuration,
        subValue: `누적 ${item.totalDistance.toFixed(1)}km / 완주 ${item.totalRuns}회`,
      }));

    // 4. 스피드 러너: 평균 페이스 오름차순 (excludeFromTimeRank !== true 인 유효 시간 완주 3회 이상 대상)
    const speed = [...studentList]
      .filter((s) => s.timedRuns >= 3 && s.avgPaceSeconds < 999999)
      .sort((a, b) => a.avgPaceSeconds - b.avgPaceSeconds)
      .slice(0, 10)
      .map((item, idx) => ({
        rank: idx + 1,
        ...item,
        primaryValue: `${item.formattedAvgPace} /km`,
        subValue: `시간인증 ${item.timedRuns}회 (${item.timedDistance.toFixed(1)}km)`,
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
          subtitle: "바람을 가르는 질주! 최속 평균 페이스 랭킹 (시간인증 3회 이상)",
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
