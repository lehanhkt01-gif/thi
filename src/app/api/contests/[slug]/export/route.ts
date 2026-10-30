// src/app/api/contests/[slug]/export/route.ts
import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";
import * as XLSX from "xlsx";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const contest = store.getContestBySlug(slug);

    if (!contest) {
      return NextResponse.json({ error: "Cuộc thi không tồn tại!" }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || undefined;
    const unitName = searchParams.get("unitName") || undefined;
    const fromDate = searchParams.get("fromDate") || undefined;
    const toDate = searchParams.get("toDate") || undefined;

    const leaderboard = store.getLeaderboard(contest.id, {
      search,
      unitName,
      fromDate,
      toDate,
    });

    // Chuẩn bị dữ liệu cho bảng Excel (Lưu toàn bộ thông tin của lần cao điểm nhất)
    const dataForExcel = leaderboard.map((item, idx) => ({
      "Xếp hạng": idx + 1,
      "Họ và Tên": item.participantName,
      "Số CCCD/Định danh": item.participantCccd,
      "Đơn vị (Thôn/Buôn/Cơ quan)": item.unitName,
      "Điểm số (Cao nhất)": item.score,
      "Số câu đúng": `${item.correctCount}/${item.totalQuestions}`,
      "Độ chính xác (%)": `${item.accuracyPercent}%`,
      "Thời gian làm bài": `${Math.floor(item.durationSeconds / 60)} phút ${item.durationSeconds % 60} giây`,
      "Số lượt đã thi": `${(item as any).attemptCount || 1}/${contest.maxAttempts || 3}`,
      "Dự đoán người tham gia": item.tieBreakerPrediction ?? "Không có",
      "Ngày giờ nộp bài": item.submittedAt
        ? new Date(item.submittedAt).toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })
        : "",
      "Ghi chú": "Lưu thông tin lần cao điểm nhất",
    }));

    // Tạo Workbook và Worksheet
    const worksheet = XLSX.utils.json_to_sheet(dataForExcel);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "KetQuaThi");

    // Đặt độ rộng cột
    worksheet["!cols"] = [
      { wch: 10 }, // Xếp hạng
      { wch: 25 }, // Họ tên
      { wch: 18 }, // CCCD
      { wch: 25 }, // Đơn vị
      { wch: 18 }, // Điểm
      { wch: 14 }, // Số câu đúng
      { wch: 16 }, // Độ chính xác
      { wch: 20 }, // Thời gian làm bài
      { wch: 16 }, // Số lượt đã thi
      { wch: 22 }, // Dự đoán
      { wch: 24 }, // Thời điểm nộp
      { wch: 30 }, // Ghi chú
    ];

    const excelBuffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    const safeSlug = contest.slug.replace(/[^a-zA-Z0-9_-]/g, "_");
    const filename = `KetQua_${safeSlug}_${new Date().toISOString().slice(0, 10)}.xlsx`;

    return new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Lỗi xuất file Excel: " + error.message },
      { status: 500 }
    );
  }
}
