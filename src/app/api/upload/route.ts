// src/app/api/upload/route.ts - API tiếp nhận và lưu trữ ảnh / PDF upload an toàn (hỗ trợ cả chunked upload vượt giới hạn Nginx 1MB)
import { NextRequest, NextResponse } from "next/server";
import { writeFile, appendFile, mkdir } from "fs/promises";
import path from "path";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(req: NextRequest) {
  try {
    let fileBuffer: Buffer | null = null;
    let fileNameOriginal = "banner.png";
    let fileExt = ".png";
    let fileSize = 0;
    let chunkIndex: number | null = null;
    let totalChunks: number | null = null;
    let uploadId: string | null = null;

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

      const rawName = (formData.get("fileName") as string) || file.name || "banner.png";
      fileNameOriginal = rawName;
      fileExt = path.extname(fileNameOriginal).toLowerCase() || ".png";
      const bytes = await file.arrayBuffer();
      fileBuffer = Buffer.from(bytes);
      fileSize = file.size;

      if (formData.get("chunkIndex") !== null && formData.get("totalChunks") !== null) {
        chunkIndex = Number(formData.get("chunkIndex"));
        totalChunks = Number(formData.get("totalChunks"));
        uploadId = String(formData.get("uploadId") || "");
      }
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

      if (body.name) {
        fileNameOriginal = body.name;
        const extFromName = path.extname(fileNameOriginal).toLowerCase();
        if (extFromName) fileExt = extFromName;
      }

      const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (matches && matches.length === 3) {
        const mime = matches[1];
        if (mime.includes("jpeg") || mime.includes("jpg")) fileExt = ".jpg";
        else if (mime.includes("webp")) fileExt = ".webp";
        else if (mime.includes("gif")) fileExt = ".gif";
        else if (mime.includes("pdf")) fileExt = ".pdf";
        else if (!path.extname(fileNameOriginal)) fileExt = ".png";

        fileBuffer = Buffer.from(matches[2], "base64");
      } else {
        fileBuffer = Buffer.from(base64Data, "base64");
      }
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

    // Giới hạn dung lượng tối đa 25MB
    if (fileSize > 25 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: "Dung lượng tệp vượt quá giới hạn 25MB. Vui lòng nén tệp hoặc chọn tệp nhỏ hơn." },
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
      .replace(/[đĐ]/g, "d")
      .replace(/[^a-zA-Z0-9]/g, "-")
      .toLowerCase()
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 30) || "banner";

    const safeUploadId = uploadId
      ? uploadId.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 24)
      : String(Date.now());
    const finalFileName = `banner-${safeUploadId}-${cleanBase}${fileExt}`;

    const publicFilePath = path.join(publicUploadDir, finalFileName);
    const storageFilePath = path.join(storageUploadDir, finalFileName);

    if (chunkIndex !== null && totalChunks !== null && totalChunks > 1) {
      if (chunkIndex === 0) {
        await writeFile(publicFilePath, fileBuffer);
        await writeFile(storageFilePath, fileBuffer).catch(() => {});
      } else {
        await appendFile(publicFilePath, fileBuffer);
        await appendFile(storageFilePath, fileBuffer).catch(() => {});
      }
      const isComplete = chunkIndex >= totalChunks - 1;
      return NextResponse.json({
        success: true,
        complete: isComplete,
        chunkIndex,
        totalChunks,
        url: `/uploads/${finalFileName}`,
        fileName: finalFileName,
      });
    }

    // Ghi file một lần (khi <= 700KB)
    await writeFile(publicFilePath, fileBuffer);
    await writeFile(storageFilePath, fileBuffer).catch(() => {});

    const publicUrl = `/uploads/${finalFileName}`;

    return NextResponse.json({
      success: true,
      url: publicUrl,
      fileName: finalFileName,
      size: fileSize,
      message: "Tải lên tệp thành công",
    });
  } catch (error: any) {
    console.error("[API Upload] Lỗi khi xử lý ảnh:", error);
    return NextResponse.json(
      { success: false, error: "Lỗi xử lý tệp tải lên: " + (error.message || String(error)) },
      { status: 500 }
    );
  }
}
