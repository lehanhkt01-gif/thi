// src/app/api/questions/import/route.ts
// API nhập đồng loạt câu hỏi trắc nghiệm từ file Excel hoặc JSON, phân theo từng bộ đề và bảo mật quyền sở hữu
import { NextRequest, NextResponse } from "next/server";
import { store, QuestionModel } from "@/lib/store";
import * as XLSX from "xlsx";

export async function POST(req: NextRequest) {
  try {
    let userRole = req.headers.get("x-user-role") || undefined;
    let userEmail = req.headers.get("x-user-email") || undefined;
    let userId = req.headers.get("x-user-id") || undefined;
    const rawUserName = req.headers.get("x-user-name") || "";
    let userName: string | undefined = undefined;
    if (rawUserName) {
      try {
        userName = decodeURIComponent(rawUserName);
      } catch (e) {
        userName = rawUserName;
      }
    }

    const contentType = req.headers.get("content-type") || "";
    let questionsToImport: Array<Omit<QuestionModel, "id">> = [];
    let packageName = "";
    let packageId = "";

    let user = { email: userEmail, role: userRole, id: userId, name: userName };

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      packageName = (formData.get("packageName") as string) || "";
      packageId = (formData.get("packageId") as string) || "";
      if (!userEmail && formData.get("userEmail")) userEmail = formData.get("userEmail") as string;
      if (!userName && formData.get("userName")) userName = formData.get("userName") as string;
      if (!userId && formData.get("userId")) userId = formData.get("userId") as string;
      if (!userRole && formData.get("userRole")) userRole = formData.get("userRole") as string;

      if (!userEmail) {
        return NextResponse.json(
          { error: "Vui lòng đăng nhập để nhập đề thi vào kho cá nhân!" },
          { status: 401 }
        );
      }

      user = { email: userEmail, role: userRole, id: userId, name: userName };

      if (!file) {
        return NextResponse.json({ error: "Vui lòng chọn tệp Excel (.xlsx hoặc .xls) để tải lên!" }, { status: 400 });
      }

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const workbook = XLSX.read(buffer, { type: "buffer" });
      const firstSheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[firstSheetName];
      const rows: any[] = XLSX.utils.sheet_to_json(sheet);

      if (!rows || rows.length === 0) {
        return NextResponse.json({ error: "File Excel không có dữ liệu câu hỏi!" }, { status: 400 });
      }

      for (const row of rows) {
        // Tìm nội dung câu hỏi
        const content =
          row["Nội dung câu hỏi"] ||
          row["Câu hỏi"] ||
          row["noi_dung"] ||
          row["content"] ||
          row["Nội dung"] ||
          "";

        if (!content || !String(content).trim()) continue;

        // Tìm các phương án A, B, C, D
        const optA = String(row["Phương án A"] || row["A"] || row["optA"] || "").trim();
        const optB = String(row["Phương án B"] || row["B"] || row["optB"] || "").trim();
        const optC = String(row["Phương án C"] || row["C"] || row["optC"] || "").trim();
        const optD = String(row["Phương án D"] || row["D"] || row["optD"] || "").trim();

        if (!optA || !optB) continue;

        const options = [
          { id: "A", text: optA },
          { id: "B", text: optB },
        ];
        if (optC) options.push({ id: "C", text: optC });
        if (optD) options.push({ id: "D", text: optD });

        // Đáp án đúng
        const rawAns = String(row["Đáp án đúng (A/B/C/D)"] || row["Đáp án đúng"] || row["Đáp án"] || row["correct"] || "A")
          .toUpperCase()
          .trim();
        const correctLetter = ["A", "B", "C", "D"].includes(rawAns) ? rawAns : "A";

        // Chuyên đề / Lĩnh vực
        const category = String(
          row["Chuyên đề / Lĩnh vực"] ||
          row["Lĩnh vực"] ||
          row["Chuyên đề"] ||
          row["Chủ đề"] ||
          row["category"] ||
          "Pháp luật chung"
        ).trim();

        // Trích dẫn luật
        const explanation = String(
          row["Trích dẫn điều khoản luật / Giải thích"] ||
          row["Trích dẫn luật"] ||
          row["Giải thích"] ||
          row["explanation"] ||
          "Căn cứ quy định pháp luật hiện hành."
        ).trim();

        // Điểm
        const points = Number(row["Điểm số"] || row["Điểm"] || row["points"]) || 10;

        // Nếu chưa có tên bộ đề, lấy từ cột "Bộ đề" trong dòng đầu tiên
        if (!packageName && row["Bộ đề"]) {
          packageName = String(row["Bộ đề"]).trim();
        }

        questionsToImport.push({
          category,
          content: String(content).trim(),
          questionType: "SINGLE_CHOICE",
          options,
          correctOptionIds: [correctLetter],
          explanation,
          points,
        });
      }
    } else {
      // Nhận qua JSON body
      const body = await req.json();
      questionsToImport = body.questions || [];
      packageName = body.packageName || body.newPackageName || "";
      packageId = body.packageId || body.existingPackageId || "";
    }

    if (questionsToImport.length === 0) {
      return NextResponse.json(
        { error: "Không tìm thấy câu hỏi hợp lệ nào trong tệp Excel. Vui lòng kiểm tra lại cấu trúc file mẫu!" },
        { status: 400 }
      );
    }

    if (!packageName && !packageId) {
      packageName = `Bộ đề nhập ngày ${new Date().toLocaleDateString("vi-VN")}`;
    }

    const result = store.importQuestions(
      questionsToImport,
      { id: packageId || undefined, name: packageName },
      user
    );

    return NextResponse.json({
      success: true,
      message: `Đã nhập thành công ${result.count} câu hỏi vào bộ đề "${result.packageName}"!`,
      importedCount: result.count,
      packageId: result.packageId,
      packageName: result.packageName,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Lỗi nhập câu hỏi: " + error.message },
      { status: 500 }
    );
  }
}
