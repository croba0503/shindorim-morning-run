import fs from "fs";
import path from "path";
import { Redis } from "@upstash/redis";

export interface Session {
  id: string;
  date: string; // YYYY-MM-DD
  dayOfWeek: string; // 월, 화, 수, 목 등
  sessionNumber: number;
  code: string; // 4자리 숫자
  isOpen: boolean; // 신청 접수 가능 여부
  maxCapacity: number; // 기본 30
  isDoubleMileage: boolean; // 마일리지 2배 이벤트 여부
  status: "READY" | "OPEN" | "CLOSED" | "CANCELLED";
  cancelReason?: string;
  notice?: string;
}

export interface Student {
  id: string;
  studentNumber: string; // e.g. "10301"
  name: string;
  grade: number;
  createdAt: string;
}

export interface RunRecord {
  id: string;
  sessionId: string;
  sessionDate: string;
  studentId: string;
  studentNumber: string;
  studentName: string;
  appliedAt: string;
  isCertified: boolean;
  distanceKm: number;
  durationSeconds: number;
  pace: string; // e.g. "5'12\""
  mileage: number;
  certifiedAt?: string;
  note?: string;
}

export interface Notice {
  id: string;
  title: string;
  content: string;
  type: "URGENT" | "NORMAL" | "EVENT";
  isActive: boolean;
  createdAt: string;
}

export interface AppDatabase {
  sessions: Session[];
  students: Student[];
  records: RunRecord[];
  notices: Notice[];
  settings: {
    adminPin: string;
    schoolName: string;
    departmentName: string;
  };
}

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "database.json");

// Upstash Redis / Vercel KV setup for Cloud Persistence
let redisClient: Redis | null = null;
const redisUrl =
  process.env.KV_REST_API_URL ||
  process.env.UPSTASH_REDIS_REST_URL ||
  process.env.STORAGE_REST_API_URL ||
  process.env.STORAGE_KV_REST_API_URL ||
  process.env.STORAGE_URL;

const redisToken =
  process.env.KV_REST_API_TOKEN ||
  process.env.UPSTASH_REDIS_REST_TOKEN ||
  process.env.STORAGE_REST_API_TOKEN ||
  process.env.STORAGE_KV_REST_API_TOKEN ||
  process.env.STORAGE_TOKEN;

if (redisUrl && redisToken) {
  redisClient = new Redis({
    url: redisUrl,
    token: redisToken,
  });
}

// Helper to format pace
export function calculatePace(distanceKm: number, seconds: number): string {
  if (!distanceKm || distanceKm <= 0 || !seconds || seconds <= 0) return "-";
  const secondsPerKm = seconds / distanceKm;
  const minutes = Math.floor(secondsPerKm / 60);
  const remainingSeconds = Math.round(secondsPerKm % 60);
  return `${minutes}'${remainingSeconds.toString().padStart(2, "0")}"`;
}

// Helper to format seconds to MM:SS or HH:MM:SS
export function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return "0분";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const sec = seconds % 60;
  if (hours > 0) {
    return `${hours}시간 ${minutes}분 ${sec > 0 ? sec + "초" : ""}`.trim();
  }
  return `${minutes}분 ${sec > 0 ? sec + "초" : ""}`.trim();
}

export function getInitialData(): AppDatabase {
  const students: Student[] = [
    { id: "stu-10101", studentNumber: "10101", name: "홍길동", grade: 1, createdAt: "2026-09-01T08:00:00Z" },
    { id: "stu-10105", studentNumber: "10105", name: "김민준", grade: 1, createdAt: "2026-09-01T08:00:00Z" },
    { id: "stu-10312", studentNumber: "10312", name: "이준서", grade: 1, createdAt: "2026-09-01T08:00:00Z" },
    { id: "stu-10521", studentNumber: "10521", name: "정우진", grade: 1, createdAt: "2026-09-01T08:00:00Z" },
    { id: "stu-20104", studentNumber: "20104", name: "박서연", grade: 2, createdAt: "2026-09-01T08:00:00Z" },
    { id: "stu-20215", studentNumber: "20215", name: "최민호", grade: 2, createdAt: "2026-09-01T08:00:00Z" },
    { id: "stu-20409", studentNumber: "20409", name: "강지원", grade: 2, createdAt: "2026-09-01T08:00:00Z" },
    { id: "stu-20618", studentNumber: "20618", name: "윤하은", grade: 2, createdAt: "2026-09-01T08:00:00Z" },
    { id: "stu-30101", studentNumber: "30101", name: "김태윤", grade: 3, createdAt: "2026-09-01T08:00:00Z" },
    { id: "stu-30308", studentNumber: "30308", name: "송채은", grade: 3, createdAt: "2026-09-01T08:00:00Z" },
    { id: "stu-30514", studentNumber: "30514", name: "오현우", grade: 3, createdAt: "2026-09-01T08:00:00Z" },
    { id: "stu-30720", studentNumber: "30720", name: "장민서", grade: 3, createdAt: "2026-09-01T08:00:00Z" },
    { id: "stu-30811", studentNumber: "30811", name: "한도윤", grade: 3, createdAt: "2026-09-01T08:00:00Z" },
  ];

  const sessions: Session[] = [
    {
      id: "sess-2026-09-21",
      date: "2026-09-21",
      dayOfWeek: "월",
      sessionNumber: 1,
      code: "1234",
      isOpen: false,
      maxCapacity: 30,
      isDoubleMileage: false,
      status: "CLOSED",
    },
    {
      id: "sess-2026-09-22",
      date: "2026-09-22",
      dayOfWeek: "화",
      sessionNumber: 2,
      code: "5678",
      isOpen: false,
      maxCapacity: 30,
      isDoubleMileage: false,
      status: "CLOSED",
    },
    {
      id: "sess-2026-09-23",
      date: "2026-09-23",
      dayOfWeek: "수",
      sessionNumber: 3,
      code: "9988",
      isOpen: false,
      maxCapacity: 30,
      isDoubleMileage: true, // 2배 데이
      status: "CLOSED",
      notice: "수요일 마일리지 2배 보너스 데이!",
    },
    {
      id: "sess-2026-09-24",
      date: "2026-09-24",
      dayOfWeek: "목",
      sessionNumber: 4,
      code: "3412",
      isOpen: false,
      maxCapacity: 30,
      isDoubleMileage: false,
      status: "CLOSED",
    },
    // 오늘 차시 (2026-09-26)
    {
      id: "sess-2026-09-26",
      date: "2026-09-26",
      dayOfWeek: "토",
      sessionNumber: 5,
      code: "4821",
      isOpen: true,
      maxCapacity: 30,
      isDoubleMileage: false,
      status: "OPEN",
    },
  ];

  const records: RunRecord[] = [
    { id: "rec-0", sessionId: "sess-2026-09-21", sessionDate: "2026-09-21", studentId: "stu-10101", studentNumber: "10101", studentName: "홍길동", appliedAt: "2026-09-21T07:50:00Z", isCertified: true, distanceKm: 2.5, durationSeconds: 750, pace: "5'00\"", mileage: 2.5, certifiedAt: "2026-09-21T08:18:00Z" },
    { id: "rec-0b", sessionId: "sess-2026-09-23", sessionDate: "2026-09-23", studentId: "stu-10101", studentNumber: "10101", studentName: "홍길동", appliedAt: "2026-09-23T07:49:00Z", isCertified: true, distanceKm: 3.0, durationSeconds: 900, pace: "5'00\"", mileage: 6.0, certifiedAt: "2026-09-23T08:18:00Z" },
    { id: "rec-1", sessionId: "sess-2026-09-21", sessionDate: "2026-09-21", studentId: "stu-10312", studentNumber: "10312", studentName: "이준서", appliedAt: "2026-09-21T07:52:00Z", isCertified: true, distanceKm: 2.4, durationSeconds: 780, pace: "5'25\"", mileage: 2.4, certifiedAt: "2026-09-21T08:20:00Z" },
    { id: "rec-2", sessionId: "sess-2026-09-21", sessionDate: "2026-09-21", studentId: "stu-20104", studentNumber: "20104", studentName: "박서연", appliedAt: "2026-09-21T07:53:00Z", isCertified: true, distanceKm: 3.6, durationSeconds: 1140, pace: "5'16\"", mileage: 3.6, certifiedAt: "2026-09-21T08:22:00Z" },
    { id: "rec-3", sessionId: "sess-2026-09-21", sessionDate: "2026-09-21", studentId: "stu-20215", studentNumber: "20215", studentName: "최민호", appliedAt: "2026-09-21T07:54:00Z", isCertified: true, distanceKm: 2.6, durationSeconds: 676, pace: "4'20\"", mileage: 2.6, certifiedAt: "2026-09-21T08:18:00Z" },
    { id: "rec-4", sessionId: "sess-2026-09-21", sessionDate: "2026-09-21", studentId: "stu-10521", studentNumber: "10521", studentName: "정우진", appliedAt: "2026-09-21T07:55:00Z", isCertified: true, distanceKm: 2.2, durationSeconds: 880, pace: "6'40\"", mileage: 2.2, certifiedAt: "2026-09-21T08:23:00Z" },
    { id: "rec-5", sessionId: "sess-2026-09-21", sessionDate: "2026-09-21", studentId: "stu-30101", studentNumber: "30101", studentName: "김태윤", appliedAt: "2026-09-21T07:56:00Z", isCertified: true, distanceKm: 2.0, durationSeconds: 660, pace: "5'30\"", mileage: 2.0, certifiedAt: "2026-09-21T08:19:00Z" },

    { id: "rec-6", sessionId: "sess-2026-09-22", sessionDate: "2026-09-22", studentId: "stu-10312", studentNumber: "10312", studentName: "이준서", appliedAt: "2026-09-22T07:51:00Z", isCertified: true, distanceKm: 2.6, durationSeconds: 810, pace: "5'11\"", mileage: 2.6, certifiedAt: "2026-09-22T08:19:00Z" },
    { id: "rec-7", sessionId: "sess-2026-09-22", sessionDate: "2026-09-22", studentId: "stu-20104", studentNumber: "20104", studentName: "박서연", appliedAt: "2026-09-22T07:52:00Z", isCertified: true, distanceKm: 4.0, durationSeconds: 1240, pace: "5'10\"", mileage: 4.0, certifiedAt: "2026-09-22T08:24:00Z" },
    { id: "rec-8", sessionId: "sess-2026-09-22", sessionDate: "2026-09-22", studentId: "stu-20215", studentNumber: "20215", studentName: "최민호", appliedAt: "2026-09-22T07:53:00Z", isCertified: true, distanceKm: 2.5, durationSeconds: 635, pace: "4'14\"", mileage: 2.5, certifiedAt: "2026-09-22T08:17:00Z" },
    { id: "rec-9", sessionId: "sess-2026-09-22", sessionDate: "2026-09-22", studentId: "stu-20409", studentNumber: "20409", studentName: "강지원", appliedAt: "2026-09-22T07:55:00Z", isCertified: true, distanceKm: 2.3, durationSeconds: 782, pace: "5'40\"", mileage: 2.3, certifiedAt: "2026-09-22T08:21:00Z" },

    { id: "rec-10", sessionId: "sess-2026-09-23", sessionDate: "2026-09-23", studentId: "stu-10312", studentNumber: "10312", studentName: "이준서", appliedAt: "2026-09-23T07:50:00Z", isCertified: true, distanceKm: 2.8, durationSeconds: 870, pace: "5'10\"", mileage: 5.6, certifiedAt: "2026-09-23T08:20:00Z" },
    { id: "rec-11", sessionId: "sess-2026-09-23", sessionDate: "2026-09-23", studentId: "stu-20104", studentNumber: "20104", studentName: "박서연", appliedAt: "2026-09-23T07:51:00Z", isCertified: true, distanceKm: 3.8, durationSeconds: 1178, pace: "5'10\"", mileage: 7.6, certifiedAt: "2026-09-23T08:23:00Z" },
    { id: "rec-12", sessionId: "sess-2026-09-23", sessionDate: "2026-09-23", studentId: "stu-20215", studentNumber: "20215", studentName: "최민호", appliedAt: "2026-09-23T07:52:00Z", isCertified: true, distanceKm: 2.8, durationSeconds: 694, pace: "4'08\"", mileage: 5.6, certifiedAt: "2026-09-23T08:16:00Z" },
    { id: "rec-13", sessionId: "sess-2026-09-23", sessionDate: "2026-09-23", studentId: "stu-10521", studentNumber: "10521", studentName: "정우진", appliedAt: "2026-09-23T07:53:00Z", isCertified: true, distanceKm: 2.5, durationSeconds: 980, pace: "6'32\"", mileage: 5.0, certifiedAt: "2026-09-23T08:23:00Z" },
    { id: "rec-14", sessionId: "sess-2026-09-23", sessionDate: "2026-09-23", studentId: "stu-30720", studentNumber: "30720", studentName: "장민서", appliedAt: "2026-09-23T07:54:00Z", isCertified: true, distanceKm: 2.0, durationSeconds: 640, pace: "5'20\"", mileage: 4.0, certifiedAt: "2026-09-23T08:20:00Z" },

    { id: "rec-15", sessionId: "sess-2026-09-24", sessionDate: "2026-09-24", studentId: "stu-10312", studentNumber: "10312", studentName: "이준서", appliedAt: "2026-09-24T07:50:00Z", isCertified: true, distanceKm: 2.5, durationSeconds: 775, pace: "5'10\"", mileage: 2.5, certifiedAt: "2026-09-24T08:19:00Z" },
    { id: "rec-16", sessionId: "sess-2026-09-24", sessionDate: "2026-09-24", studentId: "stu-20104", studentNumber: "20104", studentName: "박서연", appliedAt: "2026-09-24T07:52:00Z", isCertified: true, distanceKm: 3.5, durationSeconds: 1085, pace: "5'10\"", mileage: 3.5, certifiedAt: "2026-09-24T08:22:00Z" },
    { id: "rec-17", sessionId: "sess-2026-09-24", sessionDate: "2026-09-24", studentId: "stu-20215", studentNumber: "20215", studentName: "최민호", appliedAt: "2026-09-24T07:53:00Z", isCertified: true, distanceKm: 2.4, durationSeconds: 605, pace: "4'12\"", mileage: 2.4, certifiedAt: "2026-09-24T08:15:00Z" },
    { id: "rec-18", sessionId: "sess-2026-09-24", sessionDate: "2026-09-24", studentId: "stu-10105", studentNumber: "10105", studentName: "김민준", appliedAt: "2026-09-24T07:54:00Z", isCertified: true, distanceKm: 2.2, durationSeconds: 704, pace: "5'20\"", mileage: 2.2, certifiedAt: "2026-09-24T08:20:00Z" },

    // 오늘 차시 (2026-09-26) 신청자 목록
    { id: "rec-19", sessionId: "sess-2026-09-26", sessionDate: "2026-09-26", studentId: "stu-10312", studentNumber: "10312", studentName: "이준서", appliedAt: "2026-09-26T07:50:00Z", isCertified: true, distanceKm: 2.5, durationSeconds: 760, pace: "5'04\"", mileage: 2.5, certifiedAt: "2026-09-26T08:18:00Z" },
    { id: "rec-20", sessionId: "sess-2026-09-26", sessionDate: "2026-09-26", studentId: "stu-20104", studentNumber: "20104", studentName: "박서연", appliedAt: "2026-09-26T07:51:00Z", isCertified: true, distanceKm: 4.2, durationSeconds: 1302, pace: "5'10\"", mileage: 4.2, certifiedAt: "2026-09-26T08:23:00Z" },
    { id: "rec-21", sessionId: "sess-2026-09-26", sessionDate: "2026-09-26", studentId: "stu-20215", studentNumber: "20215", studentName: "최민호", appliedAt: "2026-09-26T07:52:00Z", isCertified: true, distanceKm: 3.0, durationSeconds: 750, pace: "4'10\"", mileage: 3.0, certifiedAt: "2026-09-26T08:17:00Z" },
    { id: "rec-22", sessionId: "sess-2026-09-26", sessionDate: "2026-09-26", studentId: "stu-10105", studentNumber: "10105", studentName: "김민준", appliedAt: "2026-09-26T07:53:00Z", isCertified: false, distanceKm: 0, durationSeconds: 0, pace: "-", mileage: 0 },
    { id: "rec-23", sessionId: "sess-2026-09-26", sessionDate: "2026-09-26", studentId: "stu-10521", studentNumber: "10521", studentName: "정우진", appliedAt: "2026-09-26T07:54:00Z", isCertified: false, distanceKm: 0, durationSeconds: 0, pace: "-", mileage: 0 },
    { id: "rec-24", sessionId: "sess-2026-09-26", sessionDate: "2026-09-26", studentId: "stu-20409", studentNumber: "20409", studentName: "강지원", appliedAt: "2026-09-26T07:55:00Z", isCertified: false, distanceKm: 0, durationSeconds: 0, pace: "-", mileage: 0 },
    { id: "rec-25", sessionId: "sess-2026-09-26", sessionDate: "2026-09-26", studentId: "stu-20618", studentNumber: "20618", studentName: "윤하은", appliedAt: "2026-09-26T07:56:00Z", isCertified: false, distanceKm: 0, durationSeconds: 0, pace: "-", mileage: 0 },
    { id: "rec-26", sessionId: "sess-2026-09-26", sessionDate: "2026-09-26", studentId: "stu-30101", studentNumber: "30101", studentName: "김태윤", appliedAt: "2026-09-26T07:57:00Z", isCertified: false, distanceKm: 0, durationSeconds: 0, pace: "-", mileage: 0 },
  ];

  const notices: Notice[] = [
    {
      id: "not-1",
      title: "🏃‍♂️ 2026학년도 신도림중 아침달리기 프로젝트 개막!",
      content: "월, 화, 수, 목 07:50~08:25 운동장에서 함께 달려요. 선착순 30명, 나이키런 2km 완주 시 마일리지 적립!",
      type: "NORMAL",
      isActive: true,
      createdAt: "2026-09-01T00:00:00Z",
    },
    {
      id: "not-2",
      title: "⚠️ 기상 악화(우천/미세먼지) 시 운동장 진행 안내",
      content: "우천 및 미세먼지 '나쁨' 이상 시 당일 아침달리기는 자동으로 안전을 위해 실내체육관 또는 취소로 전환됩니다.",
      type: "URGENT",
      isActive: false,
      createdAt: "2026-09-10T00:00:00Z",
    },
  ];

  return {
    sessions,
    students,
    records,
    notices,
    settings: {
      adminPin: "sdr1234!",
      schoolName: "신도림중학교",
      departmentName: "건강안전부",
    },
  };
}

// Read database (supports cloud Upstash Redis if configured, otherwise local JSON file)
export async function readDb(): Promise<AppDatabase> {
  if (redisClient) {
    try {
      const data = await redisClient.get<AppDatabase>("shindorim_run_db");
      if (data) return data;
      const initial = getInitialData();
      await redisClient.set("shindorim_run_db", initial);
      return initial;
    } catch (err) {
      console.error("Redis read error:", err);
    }
  }

  if (!fs.existsSync(DATA_DIR)) {
    try {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    } catch (e) {
      // In serverless read-only mode
    }
  }

  if (!fs.existsSync(DB_PATH)) {
    const initialData = getInitialData();
    try {
      fs.writeFileSync(DB_PATH, JSON.stringify(initialData, null, 2), "utf-8");
    } catch (e) {
      // In serverless read-only mode
    }
    return initialData;
  }

  try {
    const raw = fs.readFileSync(DB_PATH, "utf-8");
    return JSON.parse(raw) as AppDatabase;
  } catch (error) {
    console.error("Failed to parse database.json, using initialData...", error);
    const initialData = getInitialData();
    try {
      fs.writeFileSync(DB_PATH, JSON.stringify(initialData, null, 2), "utf-8");
    } catch (e) {}
    return initialData;
  }
}

// Write database (supports cloud Upstash Redis if configured, otherwise atomic file write)
export async function writeDb(data: AppDatabase): Promise<void> {
  if (redisClient) {
    try {
      await redisClient.set("shindorim_run_db", data);
      return;
    } catch (err) {
      console.error("Redis write error:", err);
    }
  }

  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    const tempPath = `${DB_PATH}.tmp.${Date.now()}`;
    fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), "utf-8");
    fs.renameSync(tempPath, DB_PATH);
  } catch (err) {
    console.error("File write error:", err);
  }
}

// Helper to get or generate today's session
export function getOrCreateTodaySession(db: AppDatabase): Session {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const date = String(now.getDate()).padStart(2, "0");
  const todayStr = `${year}-${month}-${date}`;

  const days = ["일", "월", "화", "수", "목", "금", "토"];
  const dayOfWeek = days[now.getDay()];

  let session = db.sessions.find((s) => s.date === todayStr);
  if (!session) {
    const randomCode = Math.floor(1000 + Math.random() * 9000).toString();
    session = {
      id: `sess-${todayStr}`,
      date: todayStr,
      dayOfWeek,
      sessionNumber: db.sessions.length + 1,
      code: randomCode,
      isOpen: true,
      maxCapacity: 30,
      isDoubleMileage: false,
      status: "OPEN",
    };
    db.sessions.push(session);
  }

  return session;
}
