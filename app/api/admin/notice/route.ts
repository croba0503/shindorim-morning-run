import { NextResponse } from "next/server";
import { readDb, writeDb, getOrCreateTodaySession } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, reason, noticeText } = body;
    const db = await readDb();
    const session = await getOrCreateTodaySession(db);

    if (action === "CANCEL_TODAY") {
      // Cancel today's session due to weather/fine dust
      session.status = "CANCELLED";
      session.isOpen = false;
      session.cancelReason = reason || "우천/미세먼지로 인한 안전 취소";

      // Also add or activate an urgent notice
      let urgentNotice = db.notices.find((n) => n.type === "URGENT");
      if (!urgentNotice) {
        urgentNotice = {
          id: `not-${Date.now()}`,
          title: "⚠️ [당일 아침달리기 취소 안내]",
          content: `${session.date} (${session.dayOfWeek}) 아침달리기는 ${session.cancelReason}되었습니다. 학생 여러분은 안전에 유의하여 교실로 입실해 주세요.`,
          type: "URGENT",
          isActive: true,
          createdAt: new Date().toISOString(),
        };
        db.notices.unshift(urgentNotice);
      } else {
        urgentNotice.title = "⚠️ [당일 아침달리기 취소 안내]";
        urgentNotice.content = `${session.date} (${session.dayOfWeek}) 아침달리기는 ${session.cancelReason}되었습니다. 학생 여러분은 안전에 유의하여 교실로 입실해 주세요.`;
        urgentNotice.isActive = true;
      }

      await writeDb(db);

      return NextResponse.json({
        success: true,
        message: "오늘 아침달리기가 취소 처리되었으며 긴급 공지 배너가 활성화되었습니다.",
        session,
      });
    }

    if (action === "RESTORE_TODAY") {
      // Re-open or restore today's session
      session.status = "OPEN";
      session.isOpen = true;
      session.cancelReason = undefined;

      // Deactivate urgent notice
      const urgentNotice = db.notices.find((n) => n.type === "URGENT");
      if (urgentNotice) {
        urgentNotice.isActive = false;
      }

      await writeDb(db);

      return NextResponse.json({
        success: true,
        message: "오늘 아침달리기가 정상 진행(신청 접수) 상태로 복구되었습니다.",
        session,
      });
    }

    if (action === "CUSTOM_NOTICE") {
      const newNotice = {
        id: `not-${Date.now()}`,
        title: body.title || "공지사항",
        content: noticeText || "",
        type: (body.type || "NORMAL") as "URGENT" | "NORMAL" | "EVENT",
        isActive: true,
        createdAt: new Date().toISOString(),
      };
      db.notices.unshift(newNotice);
      await writeDb(db);

      return NextResponse.json({
        success: true,
        message: "새 공지사항이 등록되었습니다.",
        notice: newNotice,
      });
    }

    return NextResponse.json(
      { success: false, message: "지원하지 않는 액션입니다." },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error in POST /api/admin/notice:", error);
    return NextResponse.json(
      { success: false, message: "공지 처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
