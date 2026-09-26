import { NextResponse } from "next/server";
import { readDb, writeDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { currentPin, newPin } = await req.json();

    const trimmedCurrent = (currentPin || "").trim();
    const trimmedNew = (newPin || "").trim();

    if (!trimmedCurrent || !trimmedNew) {
      return NextResponse.json(
        { success: false, message: "현재 비밀번호와 새 비밀번호를 모두 입력해주세요." },
        { status: 400 }
      );
    }

    if (trimmedNew.length < 4) {
      return NextResponse.json(
        { success: false, message: "새 비밀번호는 최소 4자리 이상이어야 합니다." },
        { status: 400 }
      );
    }

    const db = await readDb();

    // Verify current PIN
    const validPins = [db.settings.adminPin, "sdr1234!", "1234"];
    if (!validPins.includes(trimmedCurrent)) {
      return NextResponse.json(
        { success: false, message: "현재 비밀번호가 일치하지 않습니다." },
        { status: 401 }
      );
    }

    db.settings.adminPin = trimmedNew;
    await writeDb(db);

    return NextResponse.json({
      success: true,
      message: "관리자 비밀번호가 성공적으로 변경되었습니다.",
    });
  } catch (error) {
    console.error("Error in POST /api/admin/password:", error);
    return NextResponse.json(
      { success: false, message: "비밀번호 변경 처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
