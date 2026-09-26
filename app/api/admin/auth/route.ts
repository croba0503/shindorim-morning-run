import { NextResponse } from "next/server";
import { readDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { pin } = await req.json();
    const db = await readDb();

    // Check PIN: default 'sdr1234!' or '1234'
    const validPins = [db.settings.adminPin, "sdr1234!", "1234"];
    if (validPins.includes((pin || "").trim())) {
      return NextResponse.json({
        success: true,
        message: "교사용 관리자 인증에 성공했습니다.",
      });
    }

    return NextResponse.json(
      { success: false, message: "관리자 핀번호/비밀번호가 일치하지 않습니다." },
      { status: 401 }
    );
  } catch (error) {
    console.error("Error in POST /api/admin/auth:", error);
    return NextResponse.json(
      { success: false, message: "인증 처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
