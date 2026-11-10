// src/app/api/media-contests/route.ts
import { NextRequest, NextResponse } from "next/server";
import { store } from "@/lib/store";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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
      ...body,
      title: body.title,
      slug: body.slug,
      type: body.type || "IMAGE",
      bannerUrl: body.bannerUrl || "/images/contest_stage_banner.jpg",
      startDate: body.startDate || body.submitStartDate || "2026-11-10T07:00",
      endDate: body.endDate || body.voteEndDate || "2026-11-24T07:00",
      submitStartDate: body.submitStartDate || body.startDate || "2026-11-10T07:00",
      submitEndDate: body.submitEndDate || "2026-11-18T07:00",
      voteStartDate: body.voteStartDate || "2026-11-18T08:00",
      voteEndDate: body.voteEndDate || body.endDate || "2026-11-24T07:00",
      displayStartDate: body.displayStartDate || "10/11/2026",
      displayEndDate: body.displayEndDate || "24/11/2026",
      status: body.status || "PUBLISHED",
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
