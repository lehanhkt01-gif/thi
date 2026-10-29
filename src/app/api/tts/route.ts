// src/app/api/tts/route.ts
import { NextRequest, NextResponse } from "next/server";
import { normalizeAdminText } from "@/utils/ttsNormalizer";

export async function POST(req: NextRequest) {
  try {
    const { text, speed = 1.0, voiceCode } = await req.json();

    if (!text) {
      return NextResponse.json({ error: "Vui lòng nhập văn bản cần đọc!" }, { status: 400 });
    }

    // 1. Chuẩn hóa từ viết tắt hành chính (UBND, HĐND, UBMTTQ, CCCD, DTTS...)
    const normalizedText = normalizeAdminText(text);

    const vbeeAppId = process.env.VBEE_APP_ID;
    const vbeeAccessToken = process.env.VBEE_ACCESS_TOKEN;
    const vbeeVoice = voiceCode || process.env.VBEE_VOICE_CODE || "hn_female_ngochuyen_full_48k-fhg";

    // Luồng 1 (Ưu tiên): Vbee AIVoice nếu có cấu hình
    if (vbeeAppId && vbeeAccessToken && vbeeAppId !== "your_vbee_app_id") {
      try {
        const vbeeRes = await fetch("https://api.vbee.vn/public/v1/tts", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${vbeeAccessToken}`,
          },
          body: JSON.stringify({
            app_id: vbeeAppId,
            voice_code: vbeeVoice,
            input_text: normalizedText,
            rate: speed,
          }),
        });

        if (vbeeRes.ok) {
          const vbeeData = await vbeeRes.json();
          if (vbeeData?.result?.audio_link) {
            return NextResponse.json({
              success: true,
              source: "vbee",
              audioUrl: vbeeData.result.audio_link,
              normalizedText,
            });
          }
        }
      } catch (err: any) {
        console.warn("Vbee API call failed, falling back to Web Speech:", err.message);
      }
    }

    // Luồng 2 (Dự phòng miễn phí & chạy mọi nơi): Trả về payload đã chuẩn hóa
    // để trình duyệt đọc bằng Web Speech API (giọng nữ tiếng Việt vi-VN)
    return NextResponse.json({
      success: true,
      source: "browser-synthesis",
      normalizedText,
      voiceName: "vi-VN-HoaiMyNeural (Giọng An Nhiên)",
      speed,
      note: "Đã chuẩn hóa danh xưng và từ viết tắt hành chính xã Ea Súp.",
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Lỗi tạo giọng đọc: " + error.message },
      { status: 500 }
    );
  }
}
