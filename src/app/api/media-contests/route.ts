// src/app/api/media-contests/route.ts
import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";

export async function GET() {
  try {
    const list = store.getMediaContests();
    return NextResponse.json({ success: true, contests: list });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Lỗi tải danh sách cuộc thi ảnh/video: " + error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.title) {
      return NextResponse.json(
        { error: "Vui lòng nhập tên cuộc thi bình chọn!" },
        { status: 400 }
      );
    }

    const newContest = store.createMediaContest({
      title: body.title,
      slug: body.slug,
      type: body.type || "IMAGE",
      bannerUrl: body.bannerUrl || "/images/contest_stage_banner.jpg",
      startDate: body.startDate || "2026-11-02T00:00:00Z",
      endDate: body.endDate || "2026-11-05T23:59:59Z",
      displayStartDate: body.displayStartDate || "2 thg 11, 2026",
      displayEndDate: body.displayEndDate || "5 thg 11, 2026",
      status: body.status || "DRAFT",
      description: body.description || "",
      organizerName: body.organizerName || "Ủy ban MTTQ Việt Nam & Đoàn Thanh niên xã Ea Súp",
      creatorEmail: body.creatorEmail,
      creatorId: body.creatorId,
      creatorName: body.creatorName,
    });

    return NextResponse.json({ success: true, contest: newContest });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Lỗi tạo cuộc thi: " + error.message },
      { status: 500 }
    );
  }
}
