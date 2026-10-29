import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ success: false, error: "Không tìm thấy tệp tải lên" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Tạo thư mục public/uploads nếu chưa tồn tại
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });

    // Tạo tên file an toàn với timestamp
    const ext = path.extname(file.name) || ".png";
    const cleanName = file.name
      .replace(/[^a-zA-Z0-9]/g, "-")
      .toLowerCase()
      .slice(0, 30);
    const fileName = `banner-${Date.now()}-${cleanName}${ext}`;
    const filePath = path.join(uploadDir, fileName);

    await writeFile(filePath, buffer);

    const publicUrl = `/uploads/${fileName}`;

    return NextResponse.json({
      success: true,
      url: publicUrl,
      fileName,
      size: file.size,
    });
  } catch (error: any) {
    console.error("Lỗi tải lên ảnh:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Lỗi xử lý tệp tải lên" },
      { status: 500 }
    );
  }
}
