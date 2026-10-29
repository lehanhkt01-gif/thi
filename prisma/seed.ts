import { PrismaClient, Role, ContestStatus, UnitGroupType, QuestionType } from "@prisma/client";

const prisma = new PrismaClient();

export const EA_SUP_VILLAGES = [
  "Thôn 1",
  "Thôn 2",
  "Thôn 3",
  "Thôn 4",
  "Thôn 5",
  "Thôn 6",
  "Thôn 7",
  "Thôn 8",
  "Thôn 9",
  "Thôn 10",
  "Thôn Đoàn Kết",
  "Thôn Quyết Thắng",
  "Thôn Thanh Niên",
  "Thôn Hợp Thành",
  "Thôn Tân Lập",
  "Buôn Ea Súp",
  "Buôn A1",
  "Buôn A2",
  "Buôn B",
  "Buôn C",
];

export const ORGANIZATIONS = [
  {
    code: "UBND",
    name: "Ủy ban Nhân dân xã Ea Súp",
    address: "Trung tâm hành chính xã Ea Súp, Huyện Ea Súp, Tỉnh Đắk Lắk",
    email: "ubnd.easup@daklak.gov.vn",
    phone: "0262.3688.114",
  },
  {
    code: "MTTQ",
    name: "Ủy ban MTTQ Việt Nam xã Ea Súp",
    address: "Số 02 Hùng Vương, xã Ea Súp, Huyện Ea Súp, Tỉnh Đắk Lắk",
    email: "mttq.easup@daklak.gov.vn",
    phone: "0262.3688.225",
  },
  {
    code: "DANG_UY",
    name: "Đảng ủy xã Ea Súp",
    address: "Đường Hùng Vương, xã Ea Súp, Huyện Ea Súp, Tỉnh Đắk Lắk",
    email: "danguy.easup@daklak.gov.vn",
    phone: "0262.3688.336",
  },
  {
    code: "HDND",
    name: "Hội đồng Nhân dân xã Ea Súp",
    address: "Khu trung tâm hành chính xã Ea Súp, Tỉnh Đắk Lắk",
    email: "hdnd.easup@daklak.gov.vn",
    phone: "0262.3688.447",
  },
  {
    code: "DOAN_TN",
    name: "Đoàn TNCS Hồ Chí Minh xã Ea Súp",
    address: "Nhà Văn hóa thanh thiếu nhi xã Ea Súp",
    email: "doantn.easup@gmail.com",
    phone: "0984.123.456",
  },
  {
    code: "PHU_NU",
    name: "Hội Liên hiệp Phụ nữ xã Ea Súp",
    address: "Trụ sở Khối Mặt trận - Đoàn thể xã Ea Súp",
    email: "phunu.easup@gmail.com",
    phone: "0978.234.567",
  },
  {
    code: "NONG_DAN",
    name: "Hội Nông dân xã Ea Súp",
    address: "Trụ sở Khối Mặt trận - Đoàn thể xã Ea Súp",
    email: "nongdan.easup@gmail.com",
    phone: "0912.345.678",
  },
  {
    code: "CCB",
    name: "Hội Cựu chiến binh xã Ea Súp",
    address: "Trụ sở Khối Mặt trận - Đoàn thể xã Ea Súp",
    email: "ccb.easup@gmail.com",
    phone: "0903.456.789",
  },
];

export const SAMPLE_QUESTIONS = [
  {
    category: "Luật Đất đai 2024",
    content: "Theo Luật Đất đai năm 2024, bảng giá đất do Ủy ban nhân dân cấp tỉnh ban hành được áp dụng lần đầu từ ngày nào?",
    options: [
      { id: "A", text: "Từ ngày 01 tháng 01 năm 2025" },
      { id: "B", text: "Từ ngày 01 tháng 01 năm 2026" },
      { id: "C", text: "Từ ngày 01 tháng 08 năm 2024" },
      { id: "D", text: "Từ ngày 01 tháng 07 năm 2025" },
    ],
    correctOptionIds: ["B"],
    explanation: "Căn cứ khoản 3 Điều 159 Luật Đất đai 2024: Bảng giá đất do UBND cấp tỉnh xây dựng, trình HĐND cùng cấp quyết định áp dụng lần đầu từ ngày 01/01/2026 và được điều chỉnh, bổ sung hàng năm.",
    points: 10,
  },
  {
    category: "Luật Căn cước 2023",
    content: "Luật Căn cước 2023 có hiệu lực thi hành từ ngày 01/7/2024 quy định đối tượng nào được cấp thẻ căn cước theo nhu cầu?",
    options: [
      { id: "A", text: "Người từ đủ 14 tuổi trở lên bắt buộc, và công dân dưới 14 tuổi thực hiện cấp theo nhu cầu" },
      { id: "B", text: "Chỉ công dân Việt Nam từ đủ 18 tuổi trở lên" },
      { id: "C", text: "Mọi công dân từ đủ 16 tuổi trở lên" },
      { id: "D", text: "Không cấp cho trẻ em dưới 6 tuổi dưới mọi hình thức" },
    ],
    correctOptionIds: ["A"],
    explanation: "Căn cứ Điều 19 Luật Căn cước 2023: Người từ đủ 14 tuổi trở lên bắt buộc làm thủ tục cấp thẻ căn cước. Người dưới 14 tuổi được cấp thẻ căn cước theo nhu cầu.",
    points: 10,
  },
  {
    category: "Luật Thực hiện Dân chủ ở cơ sở",
    content: "Theo Luật Thực hiện Dân chủ ở cơ sở năm 2022, phương châm cốt lõi của công tác dân chủ ở cơ sở là gì?",
    options: [
      { id: "A", text: "Dân biết, dân bàn, dân làm, dân kiểm tra, dân giám sát, dân thụ hưởng" },
      { id: "B", text: "Dân bàn bạc và cơ quan quyết định mọi việc" },
      { id: "C", text: "Chính quyền làm việc, nhân dân theo dõi và phản ánh qua mạng xã hội" },
      { id: "D", text: "Dân phản ánh, Mặt trận lắng nghe, Cán bộ tiếp thu" },
    ],
    correctOptionIds: ["A"],
    explanation: "Căn cứ Điều 4 Luật Thực hiện Dân chủ ở cơ sở 2022 khẳng định phương châm: 'Dân biết, dân bàn, dân làm, dân kiểm tra, dân giám sát, dân thụ hưởng'.",
    points: 10,
  },
  {
    category: "Chuyển đổi số & Dịch vụ công xã Ea Súp",
    content: "Cổng dịch vụ công Quốc gia và Hệ sinh thái số easupso.com cho phép người dân xã Ea Súp nộp hồ sơ thủ tục hành chính trực tuyến 24/7 mang lại lợi ích gì?",
    options: [
      { id: "A", text: "Tiết kiệm thời gian, chi phí đi lại, minh bạch quy trình và theo dõi tiến độ giải quyết trực tiếp" },
      { id: "B", text: "Phải nộp thêm phí trung gian cho bưu điện" },
      { id: "C", text: "Chỉ phục vụ cán bộ công chức, người dân không được dùng" },
      { id: "D", text: "Không có giá trị pháp lý bằng việc nộp hồ sơ giấy" },
    ],
    correctOptionIds: ["A"],
    explanation: "Nghị quyết Chuyển đổi số tỉnh Đắk Lắk và Đề án 06 khẳng định việc giải quyết TTHC trực tuyến giúp người dân tiết kiệm chi phí, minh bạch quy trình, giảm tiêu cực phiền hà.",
    points: 10,
  },
  {
    category: "Luật An ninh mạng",
    content: "Hành vi nào sau đây bị nghiêm cấm trên không gian mạng theo Luật An ninh mạng năm 2018?",
    options: [
      { id: "A", text: "Sử dụng mạng xã hội để đăng tải tin tức tuyên truyền của cơ quan nhà nước" },
      { id: "B", text: "Tham gia các cuộc thi trực tuyến tìm hiểu pháp luật có bảo mật dữ liệu" },
      { id: "C", text: "Phát tán thông tin sai sự thật, vu khống, xúc phạm danh dự nhân phẩm người khác hoặc chống phá Nhà nước" },
      { id: "D", text: "Tạo tài khoản học tập và nghiên cứu kiến thức khoa học kỹ thuật" },
    ],
    correctOptionIds: ["C"],
    explanation: "Căn cứ Điều 8 Luật An ninh mạng 2018: Nghiêm cấm sử dụng không gian mạng để thông tin sai sự thật gây hoang mang, xúc phạm danh dự nhân phẩm hoặc xâm phạm an ninh quốc gia.",
    points: 10,
  },
];

async function main() {
  console.log("🌱 Bắt đầu khởi tạo dữ liệu mẫu cho Cổng thi cuocthi.easupso.com...");

  // Tạo tổ chức
  const createdOrgs: Record<string, string> = {};
  for (const org of ORGANIZATIONS) {
    const record = await prisma.organization.upsert({
      where: { code: org.code },
      update: {},
      create: org,
    });
    createdOrgs[org.code] = record.id;
  }

  // Tạo tài khoản Admin mặc định
  const adminEmail = process.env.ADMIN_DEFAULT_EMAIL || "lehanhkt01@gmail.com";
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      passwordHash: "$2b$10$abcdefg1234567890dummyhashforbitwarden", // hashed in real runtime
      fullName: "Lê Hạnh - Quản trị viên Chuyển đổi số",
      role: Role.SUPER_ADMIN,
      organizationId: createdOrgs["UBND"],
    },
  });

  // Tạo cuộc thi mẫu
  const contestSlug = "tim-hieu-phap-luat-ea-sup-2026";
  const contest = await prisma.contest.upsert({
    where: { slug: contestSlug },
    update: {},
    create: {
      organizationId: createdOrgs["UBND"],
      title: "Cuộc thi trực tuyến tìm hiểu pháp luật năm 2026 trên địa bàn xã Ea Súp",
      slug: contestSlug,
      bannerUrl: "/banners/cuocthi-phapluat-2026.png",
      rulesHtml: `
        <h3>THỂ LỆ CUỘC THI</h3>
        <p>Thực hiện Kế hoạch công tác phổ biến giáo dục pháp luật năm 2026, UBND xã Ea Súp phối hợp cùng Ủy ban MTTQ Việt Nam xã tổ chức Cuộc thi trực tuyến tìm hiểu pháp luật nhằm nâng cao nhận thức và ý thức chấp hành pháp luật cho cán bộ, đoàn viên, hội viên và nhân dân trên địa bàn.</p>
        <h4>1. Đối tượng dự thi:</h4>
        <p>Toàn thể cán bộ, công chức, viên chức, người lao động, học sinh, thanh niên và bà con nhân dân tại 20 thôn, buôn thuộc xã Ea Súp.</p>
        <h4>2. Hình thức thi:</h4>
        <p>Thi trắc nghiệm trực tuyến trên máy tính hoặc điện thoại thông minh (smartphone) tại địa chỉ cuocthi.easupso.com.</p>
        <h4>3. Thời gian làm bài:</h4>
        <p>Mỗi lượt thi gồm 10 - 20 câu hỏi trắc nghiệm, thời gian làm bài tối đa 15 phút. Mỗi thí sinh được tham gia tối đa 03 lượt thi để cải thiện kết quả.</p>
      `,
      organizerName: "Ủy ban Nhân dân xã Ea Súp",
      organizerAddress: "Trung tâm hành chính xã Ea Súp, Huyện Ea Súp, Tỉnh Đắk Lắk",
      organizerEmail: "ubnd.easup@daklak.gov.vn",
      organizerPhone: "0262.3688.114",
      announcement: "Chào mừng kỷ niệm ngày Giải phóng miền Nam 30/4 và Ngày Chuyển đổi số. Đề nghị các thôn, buôn và đoàn thể tích cực vận động nhân dân tham gia dự thi!",
      startTime: new Date("2026-03-01T00:00:00Z"),
      endTime: new Date("2026-12-31T23:59:59Z"),
      durationMinutes: 15,
      questionCount: 5,
      maxAttempts: 3,
      hasTieBreaker: true,
      status: ContestStatus.PUBLISHED,
      audioUrl: "/audio/the-le-an-nhien.mp3",
    },
  });

  // Tạo các đơn vị thôn buôn tham gia
  for (const village of EA_SUP_VILLAGES) {
    await prisma.contestUnit.create({
      data: {
        contestId: contest.id,
        name: village,
        groupType: UnitGroupType.VILLAGE,
      },
    });
  }

  // Thêm câu hỏi cho cuộc thi
  for (const q of SAMPLE_QUESTIONS) {
    await prisma.question.create({
      data: {
        contestId: contest.id,
        category: q.category,
        content: q.content,
        questionType: QuestionType.SINGLE_CHOICE,
        options: q.options,
        correctOptionIds: q.correctOptionIds,
        explanation: q.explanation,
        points: q.points,
      },
    });
  }

  console.log("✅ Khởi tạo dữ liệu thành công! 20 thôn buôn và cuộc thi mẫu đã sẵn sàng.");
}

main()
  .catch((e) => {
    console.error("Lỗi khi seed dữ liệu:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
