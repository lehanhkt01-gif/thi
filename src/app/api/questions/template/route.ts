// src/app/api/questions/template/route.ts
// Xuất file Excel mẫu chuẩn cho việc nhập đồng loạt đề thi trắc nghiệm xã Ea Súp
import { NextResponse } from "next/server";
import * as XLSX from "xlsx";

export async function GET() {
  try {
    // Dữ liệu mẫu chuẩn mực
    const templateData = [
      {
        "STT": 1,
        "Bộ đề": "Bộ đề Tìm hiểu Pháp luật & Chuyển đổi số Ea Súp 2026",
        "Chuyên đề / Lĩnh vực": "Luật Đất đai 2024",
        "Nội dung câu hỏi": "Theo Luật Đất đai năm 2024, bảng giá đất do Ủy ban nhân dân cấp tỉnh ban hành được áp dụng lần đầu từ ngày nào?",
        "Phương án A": "Từ ngày 01 tháng 01 năm 2025",
        "Phương án B": "Từ ngày 01 tháng 01 năm 2026",
        "Phương án C": "Từ ngày 01 tháng 08 năm 2024",
        "Phương án D": "Từ ngày 01 tháng 07 năm 2025",
        "Đáp án đúng (A/B/C/D)": "B",
        "Trích dẫn điều khoản luật / Giải thích": "Căn cứ khoản 3 Điều 159 Luật Đất đai 2024: Bảng giá đất do UBND cấp tỉnh xây dựng, trình HĐND cùng cấp quyết định áp dụng lần đầu từ ngày 01/01/2026.",
        "Điểm số": 10
      },
      {
        "STT": 2,
        "Bộ đề": "Bộ đề Tìm hiểu Pháp luật & Chuyển đổi số Ea Súp 2026",
        "Chuyên đề / Lĩnh vực": "Luật Căn cước 2023",
        "Nội dung câu hỏi": "Luật Căn cước 2023 có hiệu lực thi hành từ ngày 01/7/2024 quy định đối tượng nào được cấp thẻ căn cước theo nhu cầu?",
        "Phương án A": "Người từ đủ 14 tuổi trở lên bắt buộc, và công dân dưới 14 tuổi thực hiện cấp theo nhu cầu",
        "Phương án B": "Chỉ công dân Việt Nam từ đủ 18 tuổi trở lên",
        "Phương án C": "Mọi công dân từ đủ 16 tuổi trở lên",
        "Phương án D": "Không cấp cho trẻ em dưới 6 tuổi dưới mọi hình thức",
        "Đáp án đúng (A/B/C/D)": "A",
        "Trích dẫn điều khoản luật / Giải thích": "Căn cứ Điều 19 Luật Căn cước 2023: Người từ đủ 14 tuổi trở lên bắt buộc làm thủ tục cấp thẻ căn cước. Người dưới 14 tuổi được cấp thẻ căn cước theo nhu cầu tự nguyện.",
        "Điểm số": 10
      },
      {
        "STT": 3,
        "Bộ đề": "Bộ đề Tìm hiểu Pháp luật & Chuyển đổi số Ea Súp 2026",
        "Chuyên đề / Lĩnh vực": "An toàn giao thông đường bộ",
        "Nội dung câu hỏi": "Hành vi điều khiển phương tiện tham gia giao thông mà trong máu hoặc hơi thở có nồng độ cồn bị pháp luật xử lý như thế nào?",
        "Phương án A": "Nghiêm cấm tuyệt đối đối với mọi loại phương tiện giao thông đường bộ",
        "Phương án B": "Được phép nếu uống dưới 1 lon bia và chạy xe chậm",
        "Phương án C": "Chỉ cấm khi chạy trên đường quốc lộ",
        "Phương án D": "Chỉ áp dụng với người điều khiển xe ô tô",
        "Đáp án đúng (A/B/C/D)": "A",
        "Trích dẫn điều khoản luật / Giải thích": "Luật Trật tự an toàn giao thông đường bộ nghiêm cấm tuyệt đối hành vi điều khiển phương tiện tham gia giao thông mà trong máu hoặc hơi thở có nồng độ cồn.",
        "Điểm số": 10
      }
    ];

    // Tạo Worksheet và Workbook
    const worksheet = XLSX.utils.json_to_sheet(templateData);

    // Căn chỉnh độ rộng các cột tối ưu cho nhập liệu văn bản
    worksheet["!cols"] = [
      { wch: 6 },  // STT
      { wch: 35 }, // Bộ đề
      { wch: 25 }, // Chuyên đề
      { wch: 45 }, // Câu hỏi
      { wch: 28 }, // Phương án A
      { wch: 28 }, // Phương án B
      { wch: 28 }, // Phương án C
      { wch: 28 }, // Phương án D
      { wch: 22 }, // Đáp án đúng
      { wch: 45 }, // Trích dẫn luật
      { wch: 10 }  // Điểm số
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Mau_Cau_Hoi_Trac_Nghiem");

    // Xuất ra buffer
    const buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="mau_de_thi_trac_nghiem_ea_sup.xlsx"',
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Lỗi tạo file mẫu Excel: " + error.message },
      { status: 500 }
    );
  }
}
