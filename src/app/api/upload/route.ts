// src/app/api/upload/route.ts - API tiếp nhận và lưu trữ ảnh upload an toàn
import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(req: NextRequest) {
  try {
    let fileBuffer: Buffer | null = null;
    let fileNameOriginal = "banner.png";
    let fileExt = ".png";
    let fileSize = 0;

    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;

      if (!file) {
        return NextResponse.json(
          { success: false, error: "Không tìm thấy tệp tải lên trong form data" },
          { status: 400 }
        );
      }

      fileNameOriginal = file.name || "banner.png";
      fileExt = path.extname(fileNameOriginal).toLowerCase() || ".png";
      const bytes = await file.arrayBuffer();
      fileBuffer = Buffer.from(bytes);
      fileSize = file.size;
    } else if (contentType.includes("application/json")) {
      // Hỗ trợ upload qua JSON Base64
      const body = await req.json();
      const base64Data = body.base64 || body.image || body.data;
      if (!base64Data) {
        return NextResponse.json(
          { success: false, error: "Không tìm thấy dữ liệu ảnh Base64" },
          { status: 400 }
        );
      }

      const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        const mime = matches[1];
        if (mime.includes("jpeg") || mime.includes("jpg")) fileExt = ".jpg";
        else if (mime.includes("webp")) fileExt = ".webp";
        else if (mime.includes("gif")) fileExt = ".gif";
        else if (mime.includes("pdf")) fileExt = ".pdf";
        else fileExt = ".png";

        fileBuffer = Buffer.from(matches[2], "base64");
      } else {
        fileBuffer = Buffer.from(base64Data, "base64");
      }
      if (body.name) fileNameOriginal = body.name;
      fileSize = fileBuffer.length;
    } else {
      return NextResponse.json(
        { success: false, error: "Định dạng request không hợp lệ (hỗ trợ multipart hoặc json base64)" },
        { status: 400 }
      );
    }

    if (!fileBuffer || fileBuffer.length === 0) {
      return NextResponse.json(
        { success: false, error: "Tệp tải lên rỗng hoặc không có dữ liệu" },
        { status: 400 }
      );
    }

    // Giới hạn dung lượng tối đa 15MB
    if (fileSize > 15 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: "Dung lượng ảnh vượt quá giới hạn 15MB. Vui lòng nén ảnh hoặc chọn ảnh nhỏ hơn." },
        { status: 400 }
      );
    }

    // Các thư mục lưu trữ (Ghi cả vào public/uploads và storage/uploads)
    const publicUploadDir = path.join(process.cwd(), "public", "uploads");
    const storageUploadDir = path.join(process.cwd(), "storage", "uploads");

    await mkdir(publicUploadDir, { recursive: true }).catch(() => {});
    await mkdir(storageUploadDir, { recursive: true }).catch(() => {});

    // Tạo tên file an toàn
    const cleanBase = path.basename(fileNameOriginal, fileExt)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Bỏ dấu tiếng Việt
      .replace(/[^a-zA-Z0-9]/g, "-")
      .toLowerCase()
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 30) || "banner";

    const timestamp = Date.now();
    const finalFileName = `banner-${timestamp}-${cleanBase}${fileExt}`;

    const publicFilePath = path.join(publicUploadDir, finalFileName);
    const storageFilePath = path.join(storageUploadDir, finalFileName);

    // Ghi file
    await writeFile(publicFilePath, fileBuffer);
    await writeFile(storageFilePath, fileBuffer).catch(() => {});

    const publicUrl = `/uploads/${finalFileName}`;

    return NextResponse.json({
      success: true,
      url: publicUrl,
      fileName: finalFileName,
      size: fileSize,
      message: "Tải lên ảnh thành công",
    });
  } catch (error: any) {
    console.error("[API Upload] Lỗi khi xử lý ảnh:", error);
    return NextResponse.json(
      { success: false, error: "Lỗi xử lý tệp tải lên: " + (error.message || String(error)) },
      { status: 500 }
    );
  }
}
