// src/app/api/questions/bank/route.ts
import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const packageId = searchParams.get("packageId") || "ALL";
    const search = searchParams.get("search") || undefined;

    const userRole = req.headers.get("x-user-role") || undefined;
    const userEmail = req.headers.get("x-user-email") || undefined;
    const userId = req.headers.get("x-user-id") || undefined;

    const user = userEmail ? { email: userEmail, role: userRole, id: userId } : undefined;

    const questions = store.getMasterQuestionBank({
      packageId,
      search,
      user,
    });

    const packages = store.getQuestionPackages(user);

    // Gom nhóm theo chuyên đề pháp luật
    const categories: Record<string, typeof questions> = {};
    for (const q of questions) {
      const cat = q.category || "Khác";
      if (!categories[cat]) categories[cat] = [];
      categories[cat].push(q);
    }

    return NextResponse.json({
      success: true,
      total: questions.length,
      packages,
      categories,
      questions,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Lỗi tải kho câu hỏi: " + error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const questionId = searchParams.get("id");
    const packageId = searchParams.get("packageId");

    const userRole = req.headers.get("x-user-role") || undefined;
    const userEmail = req.headers.get("x-user-email") || undefined;
    const userId = req.headers.get("x-user-id") || undefined;

    const user = { email: userEmail, role: userRole, id: userId };

    if (packageId) {
      const res = store.deleteQuestionPackage(packageId, user);
      if (!res.success) {
        return NextResponse.json({ error: res.error }, { status: 403 });
      }
      return NextResponse.json({ success: true, message: "Đã xóa bộ đề thành công!" });
    }

    if (questionId) {
      const res = store.deleteQuestion(questionId, user);
      if (!res.success) {
        return NextResponse.json({ error: res.error }, { status: 403 });
      }
      return NextResponse.json({ success: true, message: "Đã xóa câu hỏi thành công!" });
    }

    return NextResponse.json({ error: "Thiếu id câu hỏi hoặc bộ đề cần xóa!" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Lỗi xóa câu hỏi: " + error.message },
      { status: 500 }
    );
  }
}
