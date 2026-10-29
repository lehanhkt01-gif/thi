// Chuẩn hóa văn bản hành chính & Giọng đọc số "An Nhiên"
// Áp dụng cho Hệ thống tuyên truyền trực tuyến xã Ea Súp (cuocthi.easupso.com)

export const ACRONYM_MAP: Record<string, string> = {
  "UBND": "Ủy ban nhân dân",
  "HĐND": "Hội đồng nhân dân",
  "UBMTTQ": "Ủy ban Mặt trận Tổ quốc",
  "MTTQ": "Mặt trận Tổ quốc",
  "DTTS": "dân tộc thiểu số",
  "CCCD": "Căn cước công dân",
  "CMND": "Chứng minh nhân dân",
  "TTHC": "thủ tục hành chính",
  "BTC": "Ban Tổ chức",
  "Đoàn TNCS": "Đoàn Thanh niên Cộng sản",
  "CAND": "Công an nhân dân",
  "QĐND": "Quân đội nhân dân",
  "BCH": "Ban Chấp hành",
  "TW": "Trung ương",
  "TƯ": "Trung ương",
  "TP": "thành phố",
  "TX": "thị xã",
  "TT": "thị trấn",
  "KDC": "khu dân cư",
  "CSDL": "cơ sở dữ liệu",
  "ĐTX": "đào tạo từ xa",
  "CNTT": "công nghệ thông tin",
  "CĐS": "chuyển đổi số",
};

/**
 * Chuẩn hóa các từ viết tắt hành chính trong văn bản câu hỏi và thể lệ
 * để giọng đọc AI phát âm tự nhiên, chuẩn xác, dễ hiểu cho bà con nhân dân
 */
export function normalizeAdminText(text: string): string {
  if (!text) return "";
  let result = text;

  // Thay thế từ viết tắt có ranh giới từ (word boundary)
  for (const [acronym, expanded] of Object.entries(ACRONYM_MAP)) {
    const regex = new RegExp(`\\b${acronym}\\b`, "g");
    result = result.replace(regex, expanded);
  }

  // Chuẩn hóa định dạng ngày tháng: 01/01/2026 -> ngày 1 tháng 1 năm 2026
  result = result.replace(
    /(\d{1,2})\/(\d{1,2})\/(\d{4})/g,
    "ngày $1 tháng $2 năm $3"
  );

  // Chuẩn hóa số điều khoản: Điều 159 -> Điều một trăm năm mươi chín (để nguyên số hoặc đọc tự nhiên)
  result = result.replace(/K\.\s*(\d+)/gi, "Khoản $1");
  result = result.replace(/Đ\.\s*(\d+)/gi, "Điều $1");

  return result.trim();
}

export interface TTSRequest {
  text: string;
  speed?: number; // 1, 1.25, 1.5, 2
  voiceCode?: string;
}

export interface TTSResponse {
  audioUrl: string;
  source: "vbee" | "edge-tts" | "browser-synthesis";
  normalizedText: string;
}
