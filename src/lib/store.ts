// src/lib/store.ts - Unified In-Memory & Database Store for cuocthi.easupso.com
// Implements Zero Answer Leakage, Server-side Grading, and Ea Súp Master Data

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

export interface OrganizationModel {
  id: string;
  code: string;
  name: string;
  address: string;
  email: string;
  phone: string;
  logoUrl?: string;
}

export interface QuestionPackageModel {
  id: string;
  name: string;
  description?: string;
  questionCount: number;
  creatorEmail?: string;
  creatorId?: string;
  creatorName?: string;
  isSystem?: boolean;
  createdAt: string;
}

export interface QuestionModel {
  id: string;
  contestId?: string;
  category: string;
  content: string;
  mediaUrl?: string;
  questionType: "SINGLE_CHOICE" | "MULTIPLE_CHOICE";
  options: { id: string; text: string }[];
  correctOptionIds: string[]; // BẢO MẬT: Không bao giờ trả về thí sinh trước khi nộp bài
  explanation: string; // Trích dẫn điều khoản luật
  audioUrl?: string;
  points: number;
  packageId?: string; // ID bộ đề
  packageName?: string; // Tên bộ đề
  creatorEmail?: string;
  creatorId?: string;
  creatorName?: string;
  isPrivate?: boolean;
  isSystem?: boolean;
  createdAt?: string;
}

export interface ContestUnitModel {
  id: string;
  contestId?: string;
  name: string;
  groupType?: "VILLAGE" | "AGENCY" | "SCHOOL" | string;
  subUnits?: string[]; // Cấp 3: Danh sách các đơn vị trực thuộc (Lớp 10A1, 10A2, Chi đoàn con...)
}

export interface ContestModel {
  id: string;
  organizationId: string;
  organizationName: string;
  title: string;
  slug: string;
  customSlug?: string; // Link rút gọn tùy chỉnh duy nhất (ví dụ: 'dangbo-2026', 'phapluat')
  clickCount?: number; // Số lượt click chuyển hướng qua link rút gọn /r/[slug]
  bannerUrl: string;
  rulesHtml: string;
  organizerName: string;
  organizerAddress: string;
  organizerEmail: string;
  organizerPhone: string;
  announcement: string;
  creatorEmail?: string;
  creatorId?: string;
  creatorName?: string;
  sharedEmails?: string[]; // Danh sách email được chia sẻ quyền quản lý, chỉnh sửa cuộc thi
  startTime: string;
  endTime: string;
  durationMinutes: number;
  questionCount: number;
  maxAttempts: number;
  hasTieBreaker: boolean;
  status: "DRAFT" | "PUBLISHED" | "CLOSED" | "ARCHIVED";
  audioUrl?: string;
  themeColor?: string;
  shortDesc?: string;
  rulesFileUrl?: string;
  planHtml?: string;
  planFileUrl?: string;
  requiredFields?: string;
  requiredFieldKeys?: string[];
  customLeaderboard?: string;
  examPassword?: string;
  requirePortrait?: string;
  fullScreenExam?: boolean;
  unitGroupName?: string;
  unitGroupId?: string;
  resultVisibility?: "SCORE_ONLY" | "SCORE_AND_ANSWERS" | "HIDDEN";
  attemptCalculation?: "ENTIRE_CONTEST" | "DAILY" | "WEEKLY";
  shuffleMode?: "NONE" | "AUTO" | "ALL";
  examMixPackages?: any[];
  prize1?: string;
  prize2?: string;
  prize3?: string;
  prize4?: string;
  prize1Count?: string;
  prize2Count?: string;
  prize3Count?: string;
  prize4Count?: string;
  createdAt: string;
  units: ContestUnitModel[];
  questions: QuestionModel[];
}

export interface MediaContestModel {
  id: string;
  title: string;
  slug: string;
  bannerUrl: string;
  type: "IMAGE" | "VIDEO";
  startDate: string;
  endDate: string;
  submitStartDate?: string;
  submitEndDate?: string;
  voteStartDate?: string;
  voteEndDate?: string;
  displayStartDate?: string;
  displayEndDate?: string;
  submissionsCount: number;
  status: "DRAFT" | "PUBLISHED" | "CLOSED";
  description?: string;
  rulesHtml?: string;
  rulesFileUrl?: string;
  announcement?: string;
  themeColor?: string;
  layoutMode?: "vertical" | "horizontal" | "both";
  layoutModes?: ("vertical" | "horizontal")[];
  maxImagesPerSubmission?: number;
  sortBy?: "createdAt" | "votesCount" | "score";
  enableSocialShare?: boolean;
  sharePlatforms?: ("facebook" | "zalo")[];
  requiredParticipantFields?: string[];
  requireApproval?: boolean;
  maxVotesPerUser?: number;
  contestPassword?: string;
  showLeaderboard?: boolean;
  showVoteCount?: boolean;
  showShareCount?: boolean;
  organizerName: string;
  organizerAddress?: string;
  organizerPhone?: string;
  organizerEmail?: string;
  creatorEmail?: string;
  creatorId?: string;
  creatorName?: string;
  sharedEmails?: string[];
  customSlug?: string;
  clickCount?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface MediaSubmissionModel {
  id: string;
  contestId: string;
  contestSlug: string;
  title: string;
  authorName: string;
  authorPhone?: string;
  authorCccd?: string;
  authorEmail?: string;
  userId?: string;
  unitName: string;
  mediaType: "IMAGE" | "VIDEO";
  mediaUrl: string;
  mediaUrls?: string[];
  orientation?: "vertical" | "horizontal";
  description: string;
  votesCount: number;
  sharesCount?: number;
  score?: number;
  status: "APPROVED" | "PENDING" | "REJECTED";
  createdAt: string;
}

export interface ParticipantModel {
  id: string;
  contestId: string;
  unitId: string;
  unitName: string;
  subUnitName?: string; // Cấp 3: Lớp 10A1, 10A2, Chi đoàn con...
  fullName: string;
  cccd: string;
  phone: string;
  birthYear: number;
  email?: string;
  birthday?: string;
  gender?: string;
  job?: string;
  workplace?: string;
  address?: string;
  createdAt: string;
}

export interface ExamAttemptModel {
  id: string;
  contestId: string;
  participantId: string;
  participantName: string;
  participantCccd: string;
  unitName: string;
  subUnitName?: string; // Cấp 3: Lớp 10A1, 10A2, Chi đoàn con...
  assignedQuestionIds: string[];
  answers: Record<string, string[]>; // { questionId: ["A"] }
  score: number;
  correctCount: number;
  totalQuestions: number;
  accuracyPercent: number;
  durationSeconds: number;
  tieBreakerPrediction?: number;
  tabSwitchCount: number;
  ipAddress?: string;
  startedAt: string;
  submittedAt?: string;
  createdAt: string;
}

export interface UserModel {
  id: string;
  name: string;
  email: string;
  phone: string;
  password?: string;
  role: "ADMIN" | "USER";
  status: "APPROVED" | "PENDING" | "REJECTED";
  organizationName: string;
  createdAt: string;
  approvedAt?: string;
}

// Master Organizations
export const DEFAULT_ORGANIZATIONS: OrganizationModel[] = [
  {
    id: "org-ubnd",
    code: "UBND",
    name: "Ủy ban Nhân dân xã Ea Súp",
    address: "Trung tâm hành chính xã Ea Súp, Huyện Ea Súp, Tỉnh Đắk Lắk",
    email: "ubnd.easup@daklak.gov.vn",
    phone: "0262.3688.114",
    logoUrl: "/logo-quochuy.png",
  },
  {
    id: "org-mttq",
    code: "MTTQ",
    name: "Ủy ban MTTQ Việt Nam xã Ea Súp",
    address: "72 Hùng Vương, xã Ea Súp, Huyện Ea Súp, Tỉnh Đắk Lắk",
    email: "Easupsohoa@gmail.com",
    phone: "0888023023",
  },
  {
    id: "org-danguy",
    code: "DANG_UY",
    name: "Đảng ủy xã Ea Súp",
    address: "Đường Hùng Vương, xã Ea Súp, Huyện Ea Súp, Tỉnh Đắk Lắk",
    email: "danguy.easup@daklak.gov.vn",
    phone: "0262.3688.336",
  },
  {
    id: "org-doantn",
    code: "DOAN_TN",
    name: "Đoàn TNCS Hồ Chí Minh xã Ea Súp",
    address: "Nhà Văn hóa thanh thiếu nhi xã Ea Súp",
    email: "doantn.easup@gmail.com",
    phone: "0984.123.456",
  },
  {
    id: "org-phunu",
    code: "PHU_NU",
    name: "Hội Liên hiệp Phụ nữ xã Ea Súp",
    address: "Trụ sở Khối Mặt trận - Đoàn thể xã Ea Súp",
    email: "phunu.easup@gmail.com",
    phone: "0978.234.567",
  },
  {
    id: "org-nongdan",
    code: "NONG_DAN",
    name: "Hội Nông dân xã Ea Súp",
    address: "Trụ sở Khối Mặt trận - Đoàn thể xã Ea Súp",
    email: "nongdan.easup@gmail.com",
    phone: "0912.345.678",
  },
  {
    id: "org-ccb",
    code: "CCB",
    name: "Hội Cựu chiến binh xã Ea Súp",
    address: "Trụ sở Khối Mặt trận - Đoàn thể xã Ea Súp",
    email: "ccb.easup@gmail.com",
    phone: "0903.456.789",
  },
];

// Master Question Bank
export const MASTER_QUESTION_BANK: QuestionModel[] = [
  {
    id: "q-land-1",
    category: "Luật Đất đai 2024",
    content: "Theo Luật Đất đai năm 2024, bảng giá đất do Ủy ban nhân dân cấp tỉnh ban hành được áp dụng lần đầu từ ngày nào?",
    questionType: "SINGLE_CHOICE",
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
    id: "q-id-2",
    category: "Luật Căn cước 2023",
    content: "Luật Căn cước 2023 có hiệu lực thi hành từ ngày 01/7/2024 quy định đối tượng nào được cấp thẻ căn cước theo nhu cầu?",
    questionType: "SINGLE_CHOICE",
    options: [
      { id: "A", text: "Người từ đủ 14 tuổi trở lên bắt buộc, và công dân dưới 14 tuổi thực hiện cấp theo nhu cầu" },
      { id: "B", text: "Chỉ công dân Việt Nam từ đủ 18 tuổi trở lên" },
      { id: "C", text: "Mọi công dân từ đủ 16 tuổi trở lên" },
      { id: "D", text: "Không cấp cho trẻ em dưới 6 tuổi dưới mọi hình thức" },
    ],
    correctOptionIds: ["A"],
    explanation: "Căn cứ Điều 19 Luật Căn cước 2023: Người từ đủ 14 tuổi trở lên bắt buộc làm thủ tục cấp thẻ căn cước. Người dưới 14 tuổi được cấp thẻ căn cước theo nhu cầu tự nguyện.",
    points: 10,
  },
  {
    id: "q-grassroots-3",
    category: "Luật Thực hiện Dân chủ ở cơ sở",
    content: "Theo Luật Thực hiện Dân chủ ở cơ sở năm 2022, phương châm cốt lõi của công tác dân chủ ở cơ sở là gì?",
    questionType: "SINGLE_CHOICE",
    options: [
      { id: "A", text: "Dân biết, dân bàn, dân làm, dân kiểm tra, dân giám sát, dân thụ hưởng" },
      { id: "B", text: "Dân bàn bạc và cơ quan nhà nước tự quyết định mọi việc" },
      { id: "C", text: "Chính quyền làm việc, nhân dân theo dõi và phản ánh qua mạng xã hội" },
      { id: "D", text: "Dân phản ánh, Mặt trận lắng nghe, Cán bộ tiếp thu" },
    ],
    correctOptionIds: ["A"],
    explanation: "Căn cứ Điều 4 Luật Thực hiện Dân chủ ở cơ sở 2022 khẳng định phương châm: 'Dân biết, dân bàn, dân làm, dân kiểm tra, dân giám sát, dân thụ hưởng'.",
    points: 10,
  },
  {
    id: "q-digital-4",
    category: "Chuyển đổi số & Dịch vụ công xã Ea Súp",
    content: "Cổng dịch vụ công Quốc gia và Hệ sinh thái số easupso.com cho phép người dân xã Ea Súp nộp hồ sơ thủ tục hành chính trực tuyến 24/7 mang lại lợi ích gì?",
    questionType: "SINGLE_CHOICE",
    options: [
      { id: "A", text: "Tiết kiệm thời gian, chi phí đi lại, minh bạch quy trình và theo dõi tiến độ giải quyết trực tiếp" },
      { id: "B", text: "Phải nộp thêm phí trung gian cho bưu điện" },
      { id: "C", text: "Chỉ phục vụ cán bộ công chức, người dân không được dùng" },
      { id: "D", text: "Không có giá trị pháp lý bằng việc nộp hồ sơ giấy truyền thống" },
    ],
    correctOptionIds: ["A"],
    explanation: "Nghị quyết Chuyển đổi số tỉnh Đắk Lắk và Đề án 06 khẳng định việc giải quyết TTHC trực tuyến giúp người dân tiết kiệm chi phí, minh bạch quy trình, giảm tiêu cực phiền hà.",
    points: 10,
  },
  {
    id: "q-cyber-5",
    category: "Luật An ninh mạng",
    content: "Hành vi nào sau đây bị nghiêm cấm trên không gian mạng theo Luật An ninh mạng năm 2018?",
    questionType: "SINGLE_CHOICE",
    options: [
      { id: "A", text: "Sử dụng mạng xã hội để đăng tải tin tức tuyên truyền chính thống của cơ quan nhà nước" },
      { id: "B", text: "Tham gia các cuộc thi trực tuyến tìm hiểu pháp luật có bảo mật dữ liệu" },
      { id: "C", text: "Phát tán thông tin sai sự thật, vu khống, xúc phạm danh dự nhân phẩm người khác hoặc chống phá Nhà nước" },
      { id: "D", text: "Tạo tài khoản học tập và nghiên cứu kiến thức khoa học kỹ thuật" },
    ],
    correctOptionIds: ["C"],
    explanation: "Căn cứ Điều 8 Luật An ninh mạng 2018: Nghiêm cấm sử dụng không gian mạng để phát tán thông tin sai sự thật gây hoang mang, xúc phạm danh dự nhân phẩm hoặc xâm phạm an ninh quốc gia.",
    points: 10,
  },
  {
    id: "q-traffic-6",
    category: "Luật Trật tự an toàn giao thông đường bộ 2024",
    content: "Theo quy định hiện hành, người điều khiển xe mô tô, xe gắn máy tham gia giao thông trên địa bàn xã Ea Súp có nồng độ cồn trong máu hoặc hơi thở thì bị xử lý như thế nào?",
    questionType: "SINGLE_CHOICE",
    options: [
      { id: "A", text: "Nghiêm cấm tuyệt đối điều khiển phương tiện mà trong máu hoặc hơi thở có nồng độ cồn" },
      { id: "B", text: "Được phép nếu uống dưới 1 lon bia và chạy dưới 30km/h" },
      { id: "C", text: "Chỉ cấm khi chạy đường quốc lộ, đường liên thôn không cấm" },
      { id: "D", text: "Chỉ nhắc nhở nếu là người địa phương đi nương rẫy về" },
    ],
    correctOptionIds: ["A"],
    explanation: "Quy định pháp luật về trật tự ATGT đường bộ nghiêm cấm tuyệt đối hành vi điều khiển phương tiện tham gia giao thông mà trong máu hoặc hơi thở có nồng độ cồn.",
    points: 10,
  },
  {
    id: "q-marriage-7",
    category: "Luật Hôn nhân và Gia đình",
    content: "Theo Luật Hôn nhân và Gia đình, độ tuổi kết hôn hợp pháp đối với nam và nữ là bao nhiêu?",
    questionType: "SINGLE_CHOICE",
    options: [
      { id: "A", text: "Nam từ đủ 20 tuổi trở lên, nữ từ đủ 18 tuổi trở lên" },
      { id: "B", text: "Nam đủ 18 tuổi, nữ đủ 16 tuổi" },
      { id: "C", text: "Nam từ đủ 22 tuổi trở lên, nữ từ đủ 20 tuổi trở lên" },
      { id: "D", text: "Cả nam và nữ cùng từ đủ 18 tuổi trở lên" },
    ],
    correctOptionIds: ["A"],
    explanation: "Căn cứ điểm a khoản 1 Điều 8 Luật Hôn nhân và Gia đình 2014: Điều kiện kết hôn là Nam từ đủ 20 tuổi trở lên, nữ từ đủ 18 tuổi trở lên.",
    points: 10,
  },
  {
    id: "q-forest-8",
    category: "Luật Lâm nghiệp & Bảo vệ rừng Ea Súp",
    content: "Hành vi lấn chiếm đất rừng, phá rừng tự nhiên hoặc khai thác lâm sản trái phép trên địa bàn huyện Ea Súp bị xử lý như thế nào?",
    questionType: "SINGLE_CHOICE",
    options: [
      { id: "A", text: "Tùy theo tính chất, mức độ vi phạm sẽ bị xử phạt vi phạm hành chính hoặc truy cứu trách nhiệm hình sự" },
      { id: "B", text: "Chỉ tịch thu tang vật không phạt tiền" },
      { id: "C", text: "Chỉ xử phạt người vận chuyển, không xử lý người chặt phá" },
      { id: "D", text: "Được miễn trách nhiệm nếu tự ý trồng lại cây hoa màu" },
    ],
    correctOptionIds: ["A"],
    explanation: "Theo Luật Lâm nghiệp và Bộ luật Hình sự: Mọi hành vi phá rừng, lấn chiếm rừng trái phép đều bị xử lý nghiêm minh theo quy định pháp luật hành chính hoặc hình sự.",
    points: 10,
  },
];

// Safe Isomorphic Loader for Node fs and path (Server-side persistent storage)
let fsModule: any = null;
let pathModule: any = null;
if (typeof window === "undefined") {
  try {
    fsModule = require("fs");
    pathModule = require("path");
  } catch (e) {}
}

// In-Memory Global State with File Persistence
class DataStore {
  private organizations: OrganizationModel[] = [...DEFAULT_ORGANIZATIONS];
  private contests: ContestModel[] = [];
  private participants: ParticipantModel[] = [];
  private attempts: ExamAttemptModel[] = [];
  private mediaContests: MediaContestModel[] = [];
  private mediaSubmissions: MediaSubmissionModel[] = [];
  private users: UserModel[] = [];
  private questionPackages: QuestionPackageModel[] = [];
  private questionBank: QuestionModel[] = [];
  private deletedContestIds: string[] = [];
  private deletedMediaContestIds: string[] = [];
  private deletedQuestionIds: string[] = [];
  private deletedPackageIds: string[] = [];
  private deletedUserIds: string[] = [];

  private isContestDeleted(c?: { id?: string; slug?: string } | null): boolean {
    if (!c) return false;
    if (c.id && this.deletedContestIds.includes(c.id)) return true;
    if (c.slug && this.deletedContestIds.includes(c.slug)) return true;
    return false;
  }

  private isMediaContestDeleted(c?: { id?: string; slug?: string } | null): boolean {
    if (!c) return false;
    if (c.id && this.deletedMediaContestIds.includes(c.id)) return true;
    if (c.slug && this.deletedMediaContestIds.includes(c.slug)) return true;
    return false;
  }

  constructor() {
    this.initSampleQuestions();
    this.initSampleContest();
    this.initSampleAttempts();
    this.initSampleMediaContests();
    this.initSampleUsers();
    this.loadFromDisk(true);
  }

  private initSampleQuestions() {
    this.questionPackages = [
      {
        id: "pkg-system-common",
        name: "Bộ đề Chung Xã Ea Súp",
        description: "Ngân hàng câu hỏi trắc nghiệm pháp luật dùng chung toàn xã",
        questionCount: MASTER_QUESTION_BANK.length,
        isSystem: true,
        createdAt: "2026-03-01T08:00:00Z",
      },
    ];

    this.questionBank = MASTER_QUESTION_BANK.map((q) => ({
      ...q,
      packageId: "pkg-system-common",
      packageName: "Bộ đề Chung Xã Ea Súp",
      isSystem: true,
      isPrivate: false,
    }));
  }

  private initSampleContest() {
    const defaultUnits: ContestUnitModel[] = EA_SUP_VILLAGES.map((name, index) => ({
      id: `unit-${index + 1}`,
      contestId: "contest-easup-2026",
      name,
      groupType: "VILLAGE",
    }));

    defaultUnits.push(
      { id: "unit-agency-1", contestId: "contest-easup-2026", name: "Khối Cơ quan Đảng - Đoàn thể", groupType: "AGENCY" },
      { id: "unit-agency-2", contestId: "contest-easup-2026", name: "Khối UBND & Công an - Quân sự", groupType: "AGENCY" },
      { id: "unit-school-1", contestId: "contest-easup-2026", name: "Trường THCS Lê Hồng Phong", groupType: "SCHOOL" }
    );

    // 1. Cuộc thi Hội Nông dân xã Ea Súp (do người tạo - Ảnh 1 chuẩn)
    const contestNongDan: ContestModel = {
      id: "contest-hoi-nong-dan-ea-sup",
      organizationId: "org-nongdan",
      organizationName: "Ủy ban Nhân dân xã Ea Súp",
      title: "Cuộc thi TÌM HIỂU NGHỊ QUYẾT HỘI NÔNG DÂN XÃ EA SÚP",
      slug: "cuoc-thi-tim-hieu-nghi-quyet-hoi-nong-dan-xa-ea-sup",
      customSlug: "nong-dan-ea-sup",
      clickCount: 24,
      bannerUrl: "/banners/banner-nong-dan-ea-sup.jpg",
      rulesHtml: `
        <h3 class="text-lg font-bold text-slate-900 mb-2">I. MỤC ĐÍCH & Ý NGHĨA</h3>
        <p class="mb-3">Nâng cao hiểu biết cho cán bộ, hội viên nông dân và nhân dân 20 thôn buôn xã Ea Súp về các chủ trương, nghị quyết của Hội Nông dân các cấp và chuyển đổi số nông nghiệp.</p>
        <h3 class="text-lg font-bold text-slate-900 mb-2">II. HÌNH THỨC & THỜI GIAN</h3>
        <p>Thi trực tuyến trên cổng cuocthi.easupso.com. Mỗi thí sinh có tối đa 3 lượt thi, thời gian 15 phút/lượt.</p>
      `,
      organizerName: "Ủy ban Nhân dân xã Ea Súp",
      organizerAddress: "Trung tâm hành chính xã Ea Súp, Huyện Ea Súp, Tỉnh Đắk Lắk",
      organizerEmail: "ubnd.easup@daklak.gov.vn",
      organizerPhone: "0262.3688.114",
      announcement: "Đề nghị các đồng chí Trưởng thôn, Buôn trưởng và Chi hội Nông dân tích cực đôn đốc nhân dân tham gia dự thi đạt 100% chỉ tiêu!",
      creatorEmail: "nongdan@easupso.com",
      creatorId: "user-regular-1",
      creatorName: "Cán bộ Hội Nông dân Xã Ea Súp",
      startTime: "2026-03-01T00:00:00Z",
      endTime: "2026-12-31T23:59:59Z",
      durationMinutes: 15,
      questionCount: 10,
      maxAttempts: 3,
      hasTieBreaker: true,
      status: "PUBLISHED",
      themeColor: "#DC2626",
      shortDesc: "",
      requiredFields: "Họ tên thí sinh, Số điện thoại, CCCD/Mã định danh, Thôn/Buôn/Đơn vị",
      createdAt: "2026-03-01T08:00:00Z",
      units: defaultUnits,
      questions: MASTER_QUESTION_BANK.map((q) => ({ ...q, contestId: "contest-hoi-nong-dan-ea-sup" })),
    };

    // 2. Cuộc thi trực tuyến xã Ea Súp
    const sampleContest: ContestModel = {
      id: "contest-easup-2026",
      organizationId: "org-mttq",
      organizationName: "Ủy ban MTTQ Việt Nam xã Ea Súp",
      title: "Cuộc thi trực tuyến tìm hiểu pháp luật năm 2026 trên địa bàn xã Ea Súp",
      slug: "tim-hieu-phap-luat-ea-sup-2026",
      customSlug: "phap-luat-2026",
      clickCount: 42,
      bannerUrl: "/banners/cuocthi-phapluat-2026.png",
      rulesHtml: `
        <h3 class="text-lg font-bold text-slate-900 mb-2">I. MỤC ĐÍCH & Ý NGHĨA</h3>
        <p class="mb-3">Cuộc thi do Ủy ban MTTQ Việt Nam xã Ea Súp tổ chức nhằm phổ biến sâu rộng các chủ trương của Đảng, chính sách, pháp luật của Nhà nước và khối đại đoàn kết toàn dân đến toàn thể cán bộ và nhân dân.</p>
      `,
      organizerName: "Thường trực UB MTTQ Việt Nam xã Ea Súp",
      organizerAddress: "72 Hùng Vương, xã Ea Súp, Huyện Ea Súp, Tỉnh Đắk Lắk",
      organizerEmail: "Easupsohoa@gmail.com",
      organizerPhone: "0888023023",
      announcement: "Đề nghị các đồng chí Trưởng thôn, Buôn trưởng và Chi bộ tích cực đôn đốc nhân dân tham gia dự thi đạt chỉ tiêu!",
      creatorEmail: "Easupsohoa@gmail.com",
      creatorId: "user-admin-2",
      creatorName: "Thường trực UB MTTQ Việt Nam xã Ea Súp",
      startTime: "2026-03-01T00:00:00Z",
      endTime: "2026-12-31T23:59:59Z",
      durationMinutes: 15,
      questionCount: 5,
      maxAttempts: 3,
      hasTieBreaker: true,
      status: "PUBLISHED",
      audioUrl: "/audio/the-le-an-nhien.mp3",
      createdAt: "2026-03-01T08:00:00Z",
      units: defaultUnits,
      questions: MASTER_QUESTION_BANK.map((q) => ({ ...q, contestId: "contest-easup-2026" })),
    };

    // Chỉ lưu các cuộc thi do người dùng tạo và cuộc thi thực tế của xã Ea Súp - Xóa sạch toàn bộ dữ liệu rác
    this.contests = [contestNongDan, sampleContest];
  }

  private initSampleAttempts() {
    // Không tạo dữ liệu thí sinh ảo - Hệ thống sạch hoàn toàn, chỉ ghi nhận thí sinh thực tế
    this.participants = [];
    this.attempts = [];
  }

  private initSampleUsers() {
    this.users = [
      {
        id: "user-admin-lehanh",
        name: "Lê Hạnh - Quản trị viên Ea Súp",
        email: "lehanhkt01@gmail.com",
        phone: "0888023023",
        password: "12345678@",
        role: "ADMIN",
        status: "APPROVED",
        organizationName: "Ủy ban Nhân dân xã Ea Súp",
        createdAt: "2026-01-01T08:00:00Z",
        approvedAt: "2026-01-01T08:00:00Z",
      },
      {
        id: "user-admin-1",
        name: "Quản trị viên Hệ thống Ea Súp",
        email: "admin@easupso.com",
        phone: "0888023023",
        password: "12345678@",
        role: "ADMIN",
        status: "APPROVED",
        organizationName: "Trung tâm Điều hành & Chuyển đổi số Xã Ea Súp",
        createdAt: "2026-01-01T08:00:00Z",
        approvedAt: "2026-01-01T08:00:00Z",
      },
      {
        id: "user-admin-2",
        name: "Thường trực UB MTTQ Việt Nam xã Ea Súp",
        email: "Easupsohoa@gmail.com",
        phone: "0888023023",
        password: "12345678@",
        role: "ADMIN",
        status: "APPROVED",
        organizationName: "Ủy ban MTTQ Việt Nam xã Ea Súp",
        createdAt: "2026-01-10T08:00:00Z",
        approvedAt: "2026-01-10T08:00:00Z",
      },
      {
        id: "user-regular-1",
        name: "Cán bộ Hội Nông dân Xã Ea Súp",
        email: "nongdan@easupso.com",
        phone: "0912345678",
        password: "user123",
        role: "USER",
        status: "APPROVED",
        organizationName: "Hội Nông dân xã Ea Súp",
        createdAt: "2026-02-15T08:00:00Z",
        approvedAt: "2026-02-16T08:00:00Z",
      },
      {
        id: "user-regular-2",
        name: "Người dùng Thử nghiệm Ea Súp",
        email: "user@easupso.com",
        phone: "0934567890",
        password: "user123",
        role: "USER",
        status: "APPROVED",
        organizationName: "Cán bộ Đơn vị Xã Ea Súp",
        createdAt: "2026-03-01T08:00:00Z",
        approvedAt: "2026-03-01T08:00:00Z",
      },
      {
        id: "user-pending-1",
        name: "Chi hội Phụ nữ Thôn 3",
        email: "phunu.thon3@easupso.com",
        phone: "0987654321",
        password: "user123",
        role: "USER",
        status: "PENDING",
        organizationName: "Chi hội Phụ nữ Thôn 3, Xã Ea Súp",
        createdAt: "2026-10-28T09:30:00Z",
      },
      {
        id: "user-pending-2",
        name: "Ban Tự quản Buôn A1",
        email: "buona1@easupso.com",
        phone: "0977889900",
        password: "user123",
        role: "USER",
        status: "PENDING",
        organizationName: "Ban Tự quản Buôn A1",
        createdAt: "2026-10-29T08:15:00Z",
      },
    ];
  }

  // --- Persistent Storage Engine (Lưu trữ bền vững không mất dữ liệu) ---
  private lastLoadedMtime: number = 0;

  public loadFromDisk(force = false) {
    if (!fsModule || !pathModule) return;
    try {
      const dataDir = pathModule.join(process.cwd(), "data");
      const backupsDir = pathModule.join(dataDir, "backups");
      if (!fsModule.existsSync(dataDir)) {
        fsModule.mkdirSync(dataDir, { recursive: true });
      }
      if (!fsModule.existsSync(backupsDir)) {
        fsModule.mkdirSync(backupsDir, { recursive: true });
      }

      const liveFile = pathModule.join(dataDir, "live_database.json");
      const liveBackupFile = pathModule.join(dataDir, "live_database.bak");
      const dbFile = pathModule.join(dataDir, "database.json");
      const backupFile = pathModule.join(dataDir, "database.backup.json");

      // Danh sách các nguồn dữ liệu dự phòng có thể khôi phục
      const candidateFiles = [liveFile, liveBackupFile, dbFile, backupFile];
      try {
        if (fsModule.existsSync(backupsDir)) {
          const files = fsModule.readdirSync(backupsDir).filter((f: string) => f.endsWith(".json"));
          files.sort().reverse();
          if (files.length > 0) {
            candidateFiles.push(pathModule.join(backupsDir, files[0]));
          }
        }
      } catch (e) {}

      const primaryFile = fsModule.existsSync(liveFile)
        ? liveFile
        : (fsModule.existsSync(dbFile) ? dbFile : backupFile);

      if (fsModule.existsSync(primaryFile)) {
        const stat = fsModule.statSync(primaryFile);
        if (!force && this.lastLoadedMtime && stat.mtimeMs <= this.lastLoadedMtime) {
          return;
        }
        this.lastLoadedMtime = stat.mtimeMs;
      }

      const readJson = (filePath: string) => {
        try {
          if (fsModule.existsSync(filePath)) {
            const raw = fsModule.readFileSync(filePath, "utf-8");
            if (raw && raw.trim()) return JSON.parse(raw);
          }
        } catch (e) {}
        return null;
      };

      // 1. Nạp từ file chính (ưu tiên liveFile -> liveBackupFile -> dbFile -> backupFile)
      const primaryData = readJson(liveFile) || readJson(liveBackupFile) || readJson(dbFile) || readJson(backupFile);

      // Thu thập danh sách các ID đã bị xóa vĩnh viễn từ mọi nguồn để không bao giờ khôi phục nhầm
      const delContests = new Set<string>(this.deletedContestIds);
      const delMedia = new Set<string>(this.deletedMediaContestIds);
      const delQuestions = new Set<string>(this.deletedQuestionIds);
      const delPackages = new Set<string>(this.deletedPackageIds);
      const delUsers = new Set<string>(this.deletedUserIds);

      for (const file of candidateFiles) {
        const d = readJson(file);
        if (!d) continue;
        if (Array.isArray(d.deletedContestIds)) d.deletedContestIds.forEach((id: string) => id && delContests.add(id));
        if (Array.isArray(d.deletedMediaContestIds)) d.deletedMediaContestIds.forEach((id: string) => id && delMedia.add(id));
        if (Array.isArray(d.deletedQuestionIds)) d.deletedQuestionIds.forEach((id: string) => id && delQuestions.add(id));
        if (Array.isArray(d.deletedPackageIds)) d.deletedPackageIds.forEach((id: string) => id && delPackages.add(id));
        if (Array.isArray(d.deletedUserIds)) d.deletedUserIds.forEach((id: string) => id && delUsers.add(id));
      }

      this.deletedContestIds = Array.from(delContests);
      this.deletedMediaContestIds = Array.from(delMedia);
      this.deletedQuestionIds = Array.from(delQuestions);
      this.deletedPackageIds = Array.from(delPackages);
      this.deletedUserIds = Array.from(delUsers);

      if (primaryData) {
        if (Array.isArray(primaryData.contests)) {
          this.contests = primaryData.contests
            .filter((c: any) => !this.isContestDeleted(c))
            .map((c: any) => {
              if (!c.questions || c.questions.length === 0) {
                return {
                  ...c,
                  questions: MASTER_QUESTION_BANK.slice(0, c.questionCount || 5),
                };
              }
              return c;
            });
        }
        if (Array.isArray(primaryData.mediaContests)) {
          this.mediaContests = primaryData.mediaContests.filter((c: any) => !this.isMediaContestDeleted(c));
        }
        if (Array.isArray(primaryData.mediaSubmissions)) {
          this.mediaSubmissions = primaryData.mediaSubmissions.filter(
            (s: any) => !this.deletedMediaContestIds.includes(s.contestId) && !this.deletedMediaContestIds.includes(s.contestSlug)
          );
        }
        if (Array.isArray(primaryData.users) && primaryData.users.length > 0) {
          this.users = this.mergeUsersList(primaryData.users, this.users, this.deletedUserIds);
        }
        if (Array.isArray(primaryData.questionPackages)) {
          this.questionPackages = primaryData.questionPackages.filter(
            (p: any) => !this.deletedPackageIds.includes(p.id)
          );
        }
        if (Array.isArray(primaryData.questionBank)) {
          this.questionBank = primaryData.questionBank.filter(
            (q: any) =>
              !this.deletedQuestionIds.includes(q.id) &&
              (!q.packageId || !this.deletedPackageIds.includes(q.packageId))
          );
        }
        if (Array.isArray(primaryData.participants)) {
          this.participants = primaryData.participants.filter(
            (p: any) => !this.deletedContestIds.includes(p.contestId)
          );
        }
        if (Array.isArray(primaryData.attempts)) {
          this.attempts = primaryData.attempts.filter(
            (a: any) => !this.deletedContestIds.includes(a.contestId)
          );
        }
      } else {
        this.contests = this.contests.filter((c) => !this.isContestDeleted(c));
        this.mediaContests = this.mediaContests.filter((c) => !this.isMediaContestDeleted(c));
      }

      // 2. NGUYÊN TẮC BẢO VỆ DỮ LIỆU THI CỬ VĨNH CỬU:
      // Tự động hợp nhất (UNION) kết quả thi (attempts) và thí sinh (participants) của các cuộc thi ĐANG TỒN TẠI
      // Tuyệt đối KHÔNG phục hồi lại các cuộc thi (contests) đã bị xóa hoặc ghi đè nội dung cuộc thi đã chỉnh sửa ở primaryData.
      const attemptsMap = new Map<string, ExamAttemptModel>();
      for (const a of this.attempts) {
        if (!this.deletedContestIds.includes(a.contestId)) {
          attemptsMap.set(a.id, a);
        }
      }

      const participantsMap = new Map<string, ParticipantModel>();
      for (const p of this.participants) {
        if (!this.deletedContestIds.includes(p.contestId)) {
          participantsMap.set(p.id, p);
        }
      }

      for (const file of candidateFiles) {
        const data = readJson(file);
        if (!data) continue;

        // Hợp nhất attempts (chỉ lấy của cuộc thi chưa bị xóa)
        if (Array.isArray(data.attempts)) {
          for (const a of data.attempts) {
            if (!a || this.deletedContestIds.includes(a.contestId)) continue;
            const existing = attemptsMap.get(a.id);
            if (!existing) {
              attemptsMap.set(a.id, a);
            } else {
              if (a.submittedAt && !existing.submittedAt) {
                attemptsMap.set(a.id, a);
              } else if (a.submittedAt && existing.submittedAt && a.score > existing.score) {
                attemptsMap.set(a.id, a);
              }
            }
          }
        }

        // Hợp nhất participants (chỉ lấy của cuộc thi chưa bị xóa)
        if (Array.isArray(data.participants)) {
          for (const p of data.participants) {
            if (!p || this.deletedContestIds.includes(p.contestId)) continue;
            if (!participantsMap.has(p.id)) {
              participantsMap.set(p.id, p);
            }
          }
        }

        // Hợp nhất users (loại trừ các user đã xóa)
        if (Array.isArray(data.users)) {
          this.users = this.mergeUsersList(data.users, this.users, this.deletedUserIds);
        }
      }

      this.attempts = Array.from(attemptsMap.values());
      this.participants = Array.from(participantsMap.values());
      this.contests = this.contests.filter((c) => !this.isContestDeleted(c));

      // Nếu liveFile chưa tồn tại trên VPS, ghi ngay để khởi tạo kho lưu trữ bất biến
      if (!fsModule.existsSync(liveFile)) {
        this.saveToDisk(true);
      }
    } catch (err) {
      console.error("[DataStore] Lỗi đọc cơ sở dữ liệu bền vững:", err);
    }
    this.ensureAdminUsers();
  }

  // Thuật toán hợp nhất người dùng thông minh chống mất mát dữ liệu
  private mergeUsersList(
    diskUsers: UserModel[],
    memoryUsers: UserModel[],
    deletedIds: string[] = []
  ): UserModel[] {
    const map = new Map<string, UserModel>();
    const getKey = (u: UserModel) => (u.id ? u.id : (u.email ? u.email.toLowerCase() : ""));

    // 1. Nạp danh sách từ đĩa vào Map (loại trừ các id đã xóa)
    for (const du of diskUsers) {
      if (!du) continue;
      const key = getKey(du);
      if (!key || (du.id && deletedIds.includes(du.id))) continue;
      map.set(key, { ...du });
    }

    // 2. Hợp nhất danh sách trong bộ nhớ vào Map
    for (const mu of memoryUsers) {
      if (!mu) continue;
      const key = getKey(mu);
      if (!key || (mu.id && deletedIds.includes(mu.id))) continue;

      const existing = map.get(key);
      if (!existing) {
        map.set(key, { ...mu });
      } else {
        // Trạng thái APPROVED là bất biến: Nếu một trong hai đã được duyệt thì giữ nguyên APPROVED
        let finalStatus: "APPROVED" | "PENDING" | "REJECTED" = existing.status;
        if (mu.status === "APPROVED" || existing.status === "APPROVED") {
          finalStatus = "APPROVED";
        } else if (mu.status === "REJECTED" || existing.status === "REJECTED") {
          finalStatus = "REJECTED";
        } else {
          finalStatus = "PENDING";
        }

        let finalRole: "ADMIN" | "USER" = mu.role || existing.role;
        const approvedAt =
          mu.approvedAt ||
          existing.approvedAt ||
          (finalStatus === "APPROVED" ? (existing.createdAt || new Date().toISOString()) : undefined);

        map.set(key, {
          ...existing,
          ...mu,
          status: finalStatus,
          role: finalRole,
          approvedAt,
          password: mu.password || existing.password,
          phone: mu.phone || existing.phone,
          organizationName: mu.organizationName || existing.organizationName,
          name: mu.name || existing.name,
          createdAt: existing.createdAt || mu.createdAt,
        });
      }
    }

    return Array.from(map.values());
  }

  public saveToDisk(force = false, deletedUserIds: string[] = []): void {
    if (!fsModule || !pathModule) return;
    try {
      const dataDir = pathModule.join(process.cwd(), "data");
      const backupsDir = pathModule.join(dataDir, "backups");
      if (!fsModule.existsSync(dataDir)) {
        fsModule.mkdirSync(dataDir, { recursive: true });
      }
      if (!fsModule.existsSync(backupsDir)) {
        fsModule.mkdirSync(backupsDir, { recursive: true });
      }

      const liveFile = pathModule.join(dataDir, "live_database.json");
      const liveBackupFile = pathModule.join(dataDir, "live_database.bak");
      const dbFile = pathModule.join(dataDir, "database.json");
      const backupFile = pathModule.join(dataDir, "database.backup.json");

      if (deletedUserIds && deletedUserIds.length > 0) {
        const setU = new Set([...this.deletedUserIds, ...deletedUserIds]);
        this.deletedUserIds = Array.from(setU);
      }

      // Đọc và hợp nhất với dữ liệu đang có trên đĩa trước khi ghi để chống mất mát
      const primaryRead = fsModule.existsSync(liveFile)
        ? liveFile
        : (fsModule.existsSync(dbFile) ? dbFile : null);

      if (primaryRead) {
        try {
          const raw = fsModule.readFileSync(primaryRead, "utf-8");
          if (raw && raw.trim()) {
            const diskData = JSON.parse(raw);
            if (Array.isArray(diskData.deletedContestIds)) {
              this.deletedContestIds = Array.from(new Set([...this.deletedContestIds, ...diskData.deletedContestIds]));
            }
            if (Array.isArray(diskData.deletedMediaContestIds)) {
              this.deletedMediaContestIds = Array.from(new Set([...this.deletedMediaContestIds, ...diskData.deletedMediaContestIds]));
            }
            if (Array.isArray(diskData.deletedQuestionIds)) {
              this.deletedQuestionIds = Array.from(new Set([...this.deletedQuestionIds, ...diskData.deletedQuestionIds]));
            }
            if (Array.isArray(diskData.deletedPackageIds)) {
              this.deletedPackageIds = Array.from(new Set([...this.deletedPackageIds, ...diskData.deletedPackageIds]));
            }
            if (Array.isArray(diskData.deletedUserIds)) {
              this.deletedUserIds = Array.from(new Set([...this.deletedUserIds, ...diskData.deletedUserIds]));
            }

            if (Array.isArray(diskData.users)) {
              this.users = this.mergeUsersList(diskData.users, this.users, this.deletedUserIds);
            }
            if (Array.isArray(diskData.participants)) {
              const pMap = new Map<string, ParticipantModel>();
              for (const p of diskData.participants) {
                if (p && !this.deletedContestIds.includes(p.contestId)) pMap.set(p.id, p);
              }
              for (const p of this.participants) {
                if (p && !this.deletedContestIds.includes(p.contestId)) pMap.set(p.id, p);
              }
              this.participants = Array.from(pMap.values());
            }
            if (Array.isArray(diskData.attempts)) {
              const aMap = new Map<string, ExamAttemptModel>();
              for (const a of diskData.attempts) {
                if (a && !this.deletedContestIds.includes(a.contestId)) aMap.set(a.id, a);
              }
              for (const a of this.attempts) {
                if (!a || this.deletedContestIds.includes(a.contestId)) continue;
                const diskA = aMap.get(a.id);
                if (diskA && diskA.submittedAt && !a.submittedAt) {
                  aMap.set(a.id, { ...diskA, ...a, submittedAt: diskA.submittedAt });
                } else {
                  aMap.set(a.id, a);
                }
              }
              this.attempts = Array.from(aMap.values());
            }
          }
        } catch (e) {}
      }

      // Lọc sạch các mục đã nằm trong danh sách xóa vĩnh viễn
      this.contests = this.contests.filter((c) => !this.isContestDeleted(c));
      this.mediaContests = this.mediaContests.filter((c) => !this.isMediaContestDeleted(c));
      this.questionPackages = this.questionPackages.filter((p) => !this.deletedPackageIds.includes(p.id));
      this.questionBank = this.questionBank.filter(
        (q) => !this.deletedQuestionIds.includes(q.id) && (!q.packageId || !this.deletedPackageIds.includes(q.packageId))
      );

      const payload = {
        contests: this.contests,
        mediaContests: this.mediaContests,
        mediaSubmissions: this.mediaSubmissions,
        users: this.users,
        questionPackages: this.questionPackages,
        questionBank: this.questionBank,
        participants: this.participants,
        attempts: this.attempts,
        deletedContestIds: this.deletedContestIds,
        deletedMediaContestIds: this.deletedMediaContestIds,
        deletedQuestionIds: this.deletedQuestionIds,
        deletedPackageIds: this.deletedPackageIds,
        deletedUserIds: this.deletedUserIds,
        lastSavedAt: new Date().toISOString(),
      };

      const jsonStr = JSON.stringify(payload, null, 2);

      // 1. Ghi vào live_database.json (Tập tin runtime chính - KHÔNG bị git pull ghi đè)
      fsModule.writeFileSync(liveFile, jsonStr, "utf-8");
      // 2. Ghi bản sao lưu dự phòng tức thì live_database.bak
      fsModule.writeFileSync(liveBackupFile, jsonStr, "utf-8");

      // 3. Ghi vào bản sao lưu theo ngày trong data/backups/
      try {
        const todayStr = new Date().toISOString().slice(0, 10);
        const dailyBackup = pathModule.join(backupsDir, `backup_${todayStr}.json`);
        fsModule.writeFileSync(dailyBackup, jsonStr, "utf-8");
      } catch (e) {}

      // 4. Đồng thời ghi vào database.json & backup.json (phương án tương thích phụ)
      try {
        fsModule.writeFileSync(dbFile, jsonStr, "utf-8");
        fsModule.writeFileSync(backupFile, jsonStr, "utf-8");
      } catch (e) {}

      try {
        const stat = fsModule.statSync(liveFile);
        this.lastLoadedMtime = stat.mtimeMs;
      } catch (e) {}
    } catch (err) {
      console.error("[DataStore] Lỗi ghi cơ sở dữ liệu bền vững:", err);
    }
  }

  private ensureAdminUsers() {
    const adminEmails = [
      {
        email: "lehanhkt01@gmail.com",
        name: "Lê Hạnh - Quản trị viên Ea Súp",
        phone: "0888023023",
        role: "ADMIN" as const,
        status: "APPROVED" as const,
      },
      {
        email: "admin@easupso.com",
        name: "Quản trị viên Hệ thống Ea Súp",
        phone: "0888023023",
        role: "ADMIN" as const,
        status: "APPROVED" as const,
      },
      {
        email: "easupsohoa@gmail.com",
        name: "Thường trực UB MTTQ Việt Nam xã Ea Súp",
        phone: "0888023023",
        role: "ADMIN" as const,
        status: "APPROVED" as const,
      },
    ];

    let hasChange = false;
    for (const adm of adminEmails) {
      const idx = this.users.findIndex((u) => u.email.toLowerCase() === adm.email.toLowerCase());
      if (idx === -1) {
        this.users.unshift({
          id: `user-admin-${adm.email.split("@")[0]}`,
          name: adm.name,
          email: adm.email,
          phone: adm.phone,
          password: process.env.ADMIN_DEFAULT_PASSWORD || process.env.ADMIN_PASSWORD || "12345678@",
          role: "ADMIN",
          status: "APPROVED",
          organizationName: "Ủy ban Nhân dân xã Ea Súp",
          createdAt: "2026-01-01T08:00:00Z",
          approvedAt: "2026-01-01T08:00:00Z",
        });
        hasChange = true;
      } else {
        if (this.users[idx].status !== "APPROVED" || this.users[idx].role !== "ADMIN") {
          this.users[idx].status = "APPROVED";
          this.users[idx].role = "ADMIN";
          hasChange = true;
        }
      }
    }
    if (hasChange) {
      this.saveToDisk();
    }
  }

  // --- Users & Permissions Management ---
  public getUsers(filters?: { role?: string; status?: string; search?: string }): UserModel[] {
    this.loadFromDisk();
    let result = [...this.users];
    if (filters?.role && filters.role !== "ALL") {
      result = result.filter((u) => u.role === filters.role);
    }
    if (filters?.status && filters.status !== "ALL") {
      result = result.filter((u) => u.status === filters.status);
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase().trim();
      result = result.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.phone.includes(q) ||
          u.organizationName.toLowerCase().includes(q)
      );
    }
    return result;
  }

  public getUserById(id: string): UserModel | undefined {
    this.loadFromDisk();
    return this.users.find((u) => u.id === id);
  }

  public getUserByEmail(email: string): UserModel | undefined {
    this.loadFromDisk();
    return this.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  public createUser(userData: {
    name: string;
    email: string;
    phone: string;
    password?: string;
    role: "ADMIN" | "USER";
    status?: "APPROVED" | "PENDING" | "REJECTED";
    organizationName: string;
  }): UserModel {
    this.loadFromDisk(true);
    const existing = this.getUserByEmail(userData.email);
    if (existing) {
      throw new Error(`Email "${userData.email}" đã tồn tại trong hệ thống!`);
    }

    const newUser: UserModel = {
      id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: userData.name,
      email: userData.email,
      phone: userData.phone || "0888023023",
      password: userData.password || "123456",
      role: userData.role || "USER",
      status: userData.status || "APPROVED",
      organizationName: userData.organizationName || "Ủy ban Nhân dân xã Ea Súp",
      createdAt: new Date().toISOString(),
      approvedAt: userData.status === "APPROVED" ? new Date().toISOString() : undefined,
    };

    this.users.unshift(newUser);
    this.saveToDisk();
    return newUser;
  }

  public updateUser(id: string, updateData: Partial<UserModel>): UserModel | null {
    this.loadFromDisk(true);
    const index = this.users.findIndex((u) => u.id === id);
    if (index === -1) return null;
    this.users[index] = { ...this.users[index], ...updateData };
    this.saveToDisk();
    return this.users[index];
  }

  public deleteUser(id: string): boolean {
    this.loadFromDisk(true);
    const index = this.users.findIndex((u) => u.id === id);
    if (index === -1) return false;
    const u = this.users[index];
    if (!this.deletedUserIds.includes(u.id)) this.deletedUserIds.push(u.id);
    if (u.email && !this.deletedUserIds.includes(u.email.toLowerCase())) {
      this.deletedUserIds.push(u.email.toLowerCase());
    }
    this.users.splice(index, 1);
    this.saveToDisk(true, [id]);
    return true;
  }

  public approveUser(id: string, status: "APPROVED" | "REJECTED"): UserModel | null {
    this.loadFromDisk(true);
    const user = this.users.find((u) => u.id === id);
    if (!user) return null;
    user.status = status;
    if (status === "APPROVED") {
      user.approvedAt = new Date().toISOString();
    }
    this.saveToDisk();
    return user;
  }

  public changeUserRole(id: string, role: "ADMIN" | "USER"): UserModel | null {
    this.loadFromDisk(true);
    const user = this.users.find((u) => u.id === id);
    if (!user) return null;
    user.role = role;
    this.saveToDisk();
    return user;
  }

  public updateUserPassword(id: string, newPassword: string): UserModel | null {
    this.loadFromDisk(true);
    const user = this.users.find((u) => u.id === id);
    if (!user) return null;
    user.password = newPassword;
    this.saveToDisk();

    // Nếu tài khoản là Admin toàn quyền, ghi tự động vào file .env
    const SYSTEM_ADMIN_EMAILS = [
      "lehanhkt01@gmail.com",
      "admin@easupso.com",
      "easupsohoa@gmail.com",
    ];
    if (typeof window === "undefined" && (user.role === "ADMIN" || SYSTEM_ADMIN_EMAILS.includes(user.email.toLowerCase()))) {
      try {
        const { updateEnvAdminPassword } = require("./env");
        updateEnvAdminPassword(newPassword);
      } catch (err) {
        console.error("[DataStore] Lỗi cập nhật mật khẩu Admin vào .env:", err);
      }
    }

    return user;
  }

  // --- Methods ---

  public getOrganizations(): OrganizationModel[] {
    return this.organizations;
  }

  private syncAndEnrichContestFiles(target: ContestModel): ContestModel {
    const normTitle = (target.title || "").trim().toLowerCase();
    const normCustomSlug = (target.customSlug || "").trim().toLowerCase();

    for (const c of this.contests) {
      if (c.id === target.id) continue;
      const sameCustomSlug = normCustomSlug && (c.customSlug || "").trim().toLowerCase() === normCustomSlug;
      const sameTitle = normTitle && (c.title || "").trim().toLowerCase() === normTitle;
      if (sameCustomSlug || sameTitle) {
        if (!target.planFileUrl && c.planFileUrl) target.planFileUrl = c.planFileUrl;
        if (!target.rulesFileUrl && c.rulesFileUrl) target.rulesFileUrl = c.rulesFileUrl;
        if (!target.planHtml && c.planHtml) target.planHtml = c.planHtml;
      }
    }
    return target;
  }

  public getContests(): ContestModel[] {
    this.loadFromDisk();
    return this.contests
      .filter((c) => !this.isContestDeleted(c))
      .map((c) => this.syncAndEnrichContestFiles(c));
  }

  public getContestBySlug(slug: string): ContestModel | undefined {
    this.loadFromDisk();
    const found = this.contests.find((c) => (c.slug === slug || c.id === slug) && !this.isContestDeleted(c));
    return found ? this.syncAndEnrichContestFiles(found) : undefined;
  }

  public getContestById(id: string): ContestModel | undefined {
    this.loadFromDisk();
    const found = this.contests.find((c) => (c.id === id || c.slug === id) && !this.isContestDeleted(c));
    return found ? this.syncAndEnrichContestFiles(found) : undefined;
  }

  public createContest(contestData: Omit<ContestModel, "id" | "createdAt">): ContestModel {
    this.loadFromDisk(true);
    const id = `contest-${Date.now()}`;
    // Nếu người dùng chủ động tạo mới lại cuộc thi có cùng slug đã xóa trước đó, gỡ khỏi danh sách đã xóa
    this.deletedContestIds = this.deletedContestIds.filter(
      (delId) => delId !== id && delId !== contestData.slug
    );
    const newContest: ContestModel = {
      ...contestData,
      id,
      questions: (contestData.questions && contestData.questions.length > 0)
        ? contestData.questions
        : MASTER_QUESTION_BANK.slice(0, contestData.questionCount || 5),
      createdAt: new Date().toISOString(),
    };
    this.contests.unshift(newContest);
    this.saveToDisk(true);
    return newContest;
  }

  public updateContest(id: string, updateData: Partial<ContestModel>): ContestModel | null {
    this.loadFromDisk(true);
    const index = this.contests.findIndex((c) => c.id === id || c.slug === id);
    if (index === -1) return null;
    this.contests[index] = { ...this.contests[index], ...updateData };
    this.saveToDisk(true);
    return this.contests[index];
  }

  public upsertContest(
    contestData: Partial<ContestModel> & { slug: string; originalSlug?: string }
  ): ContestModel {
    this.loadFromDisk(true);

    // Tìm cuộc thi hiện có theo id, originalSlug hoặc slug để cập nhật đúng cuộc thi đang sửa (tránh nhân đôi khi đổi tên tiêu đề)
    const index = this.contests.findIndex((c) => {
      if (contestData.id && c.id === contestData.id) return true;
      if (contestData.originalSlug && (c.slug === contestData.originalSlug || c.id === contestData.originalSlug)) return true;
      return c.slug === contestData.slug || c.id === contestData.slug;
    });

    if (index >= 0) {
      const existing = this.contests[index];
      const questions = (contestData.questions && contestData.questions.length > 0)
        ? contestData.questions
        : (existing.questions && existing.questions.length > 0 ? existing.questions : MASTER_QUESTION_BANK.slice(0, contestData.questionCount || 5));

      const { originalSlug, ...cleanContestData } = contestData;

      // Bảo toàn id và slug gốc khi chỉnh sửa (trừ khi slug được đổi chủ đích sang giá trị hợp lệ và không trùng)
      const finalSlug = existing.slug || cleanContestData.slug;

      this.contests[index] = {
        ...existing,
        ...cleanContestData,
        id: existing.id,
        slug: finalSlug,
        rulesFileUrl: cleanContestData.rulesFileUrl !== undefined ? cleanContestData.rulesFileUrl : existing.rulesFileUrl,
        planFileUrl: cleanContestData.planFileUrl !== undefined ? cleanContestData.planFileUrl : existing.planFileUrl,
        planHtml: cleanContestData.planHtml !== undefined ? cleanContestData.planHtml : existing.planHtml,
        rulesHtml: cleanContestData.rulesHtml !== undefined ? cleanContestData.rulesHtml : existing.rulesHtml,
        prize1: cleanContestData.prize1 !== undefined ? cleanContestData.prize1 : existing.prize1,
        prize2: cleanContestData.prize2 !== undefined ? cleanContestData.prize2 : existing.prize2,
        prize3: cleanContestData.prize3 !== undefined ? cleanContestData.prize3 : existing.prize3,
        prize4: cleanContestData.prize4 !== undefined ? cleanContestData.prize4 : existing.prize4,
        prize1Count: cleanContestData.prize1Count !== undefined ? cleanContestData.prize1Count : existing.prize1Count,
        prize2Count: cleanContestData.prize2Count !== undefined ? cleanContestData.prize2Count : existing.prize2Count,
        prize3Count: cleanContestData.prize3Count !== undefined ? cleanContestData.prize3Count : existing.prize3Count,
        prize4Count: cleanContestData.prize4Count !== undefined ? cleanContestData.prize4Count : existing.prize4Count,
        unitGroupId: cleanContestData.unitGroupId !== undefined ? cleanContestData.unitGroupId : existing.unitGroupId,
        unitGroupName: cleanContestData.unitGroupName !== undefined ? cleanContestData.unitGroupName : existing.unitGroupName,
        customSlug: cleanContestData.customSlug !== undefined ? cleanContestData.customSlug : existing.customSlug,
        clickCount: cleanContestData.clickCount !== undefined ? cleanContestData.clickCount : (existing.clickCount || 0),
        sharedEmails: cleanContestData.sharedEmails !== undefined ? cleanContestData.sharedEmails : (existing.sharedEmails || []),
        questions,
        // Giữ nguyên người khởi tạo ban đầu, không bị ghi đè kể cả tài khoản admin chỉnh sửa
        creatorEmail: existing.creatorEmail || cleanContestData.creatorEmail,
        creatorId: existing.creatorId || cleanContestData.creatorId,
        creatorName: existing.creatorName || cleanContestData.creatorName,
      };

      // Đồng bộ file Thể lệ / Kế hoạch sang các bản cuộc thi cùng customSlug hoặc cùng tên tiêu đề (nếu có)
      const updated = this.contests[index];
      if (cleanContestData.rulesFileUrl !== undefined || cleanContestData.planFileUrl !== undefined || cleanContestData.planHtml !== undefined) {
        const normTitle = (updated.title || "").trim().toLowerCase();
        const normCustomSlug = (updated.customSlug || "").trim().toLowerCase();
        for (const c of this.contests) {
          if (c.id === updated.id) continue;
          const sameCustomSlug = normCustomSlug && (c.customSlug || "").trim().toLowerCase() === normCustomSlug;
          const sameTitle = normTitle && (c.title || "").trim().toLowerCase() === normTitle;
          if (sameCustomSlug || sameTitle) {
            if (cleanContestData.rulesFileUrl !== undefined) c.rulesFileUrl = cleanContestData.rulesFileUrl;
            if (cleanContestData.planFileUrl !== undefined) c.planFileUrl = cleanContestData.planFileUrl;
            if (cleanContestData.planHtml !== undefined) c.planHtml = cleanContestData.planHtml;
          }
        }
      }

      this.saveToDisk(true);
      return this.syncAndEnrichContestFiles(this.contests[index]);
    } else {
      const { originalSlug, ...cleanContestData } = contestData;
      const id = cleanContestData.id || `contest-${Date.now()}`;
      // Gỡ khỏi danh sách đã xóa nếu người dùng tạo mới lại
      this.deletedContestIds = this.deletedContestIds.filter(
        (delId) => delId !== id && delId !== cleanContestData.slug
      );
      const newContest: ContestModel = {
        id,
        organizationId: cleanContestData.organizationId || "org-ubnd",
        organizationName: cleanContestData.organizationName || "Ủy ban Nhân dân xã Ea Súp",
        title: cleanContestData.title || "Cuộc thi trực tuyến xã Ea Súp",
        slug: cleanContestData.slug,
        bannerUrl: cleanContestData.bannerUrl || "/banner-easup.png",
        rulesHtml: cleanContestData.rulesHtml || "<p>Thể lệ cuộc thi...</p>",
        organizerName: cleanContestData.organizerName || "Ủy ban Nhân dân xã Ea Súp",
        organizerAddress: cleanContestData.organizerAddress || "Trung tâm hành chính xã Ea Súp",
        organizerEmail: cleanContestData.organizerEmail || "ubnd.easup@daklak.gov.vn",
        organizerPhone: cleanContestData.organizerPhone || "0262.3688.114",
        announcement: cleanContestData.announcement || "",
        creatorEmail: cleanContestData.creatorEmail,
        creatorId: cleanContestData.creatorId,
        creatorName: cleanContestData.creatorName,
        sharedEmails: cleanContestData.sharedEmails || [],
        startTime: cleanContestData.startTime || new Date().toISOString(),
        endTime: cleanContestData.endTime || new Date(Date.now() + 30 * 86400000).toISOString(),
        durationMinutes: cleanContestData.durationMinutes || 15,
        questionCount: cleanContestData.questionCount || 10,
        maxAttempts: cleanContestData.maxAttempts || 3,
        hasTieBreaker: cleanContestData.hasTieBreaker !== false,
        status: cleanContestData.status || "PUBLISHED",
        audioUrl: cleanContestData.audioUrl || "",
        themeColor: cleanContestData.themeColor || "#DC2626",
        shortDesc: cleanContestData.shortDesc || "",
        rulesFileUrl: cleanContestData.rulesFileUrl || "",
        planHtml: cleanContestData.planHtml || "",
        planFileUrl: cleanContestData.planFileUrl || "",
        requiredFields: cleanContestData.requiredFields || "Họ tên thí sinh, Số điện thoại, CCCD/Mã định danh",
        requiredFieldKeys: cleanContestData.requiredFieldKeys,
        customLeaderboard: cleanContestData.customLeaderboard || "",
        examPassword: cleanContestData.examPassword || "",
        requirePortrait: cleanContestData.requirePortrait || "none",
        fullScreenExam: cleanContestData.fullScreenExam ?? true,
        resultVisibility: cleanContestData.resultVisibility || "SCORE_ONLY",
        attemptCalculation: cleanContestData.attemptCalculation || "ENTIRE_CONTEST",
        shuffleMode: cleanContestData.shuffleMode || "NONE",
        examMixPackages: cleanContestData.examMixPackages || [],
        unitGroupId: cleanContestData.unitGroupId,
        unitGroupName: cleanContestData.unitGroupName,
        customSlug: cleanContestData.customSlug || undefined,
        clickCount: cleanContestData.clickCount || 0,
        prize1: cleanContestData.prize1 || "5.000.000 đồng/giải",
        prize2: cleanContestData.prize2 || "3.000.000 đồng/giải",
        prize3: cleanContestData.prize3 || "1.000.000 đồng/giải",
        prize4: cleanContestData.prize4 || "750.000 đồng/giải",
        prize1Count: cleanContestData.prize1Count || "01",
        prize2Count: cleanContestData.prize2Count || "02",
        prize3Count: cleanContestData.prize3Count || "03",
        prize4Count: cleanContestData.prize4Count || "05",
        createdAt: new Date().toISOString(),
        units: cleanContestData.units || EA_SUP_VILLAGES.map((v, i) => ({ id: `u-${i + 1}`, contestId: id, name: v, groupType: "VILLAGE" })),
        questions: (cleanContestData.questions && cleanContestData.questions.length > 0)
          ? cleanContestData.questions
          : MASTER_QUESTION_BANK.slice(0, cleanContestData.questionCount || 5),
      };
      this.contests.unshift(newContest);
      this.saveToDisk(true);
      return newContest;
    }
  }

  // Chia sẻ quyền quản lý, chỉnh sửa cuộc thi cho người khác (Hỗ trợ cả Trắc nghiệm & Ảnh/Video)
  public shareContest(
    slugOrId: string,
    sharedEmails: string[],
    user?: { email?: string; role?: string; id?: string }
  ): { success: boolean; error?: string; contest?: ContestModel | MediaContestModel } {
    this.loadFromDisk(true);
    const contest: ContestModel | MediaContestModel | undefined =
      this.contests.find((c) => c.slug === slugOrId || c.id === slugOrId) ||
      this.mediaContests.find((c) => c.slug === slugOrId || c.id === slugOrId);
    if (!contest) {
      return { success: false, error: "Không tìm thấy cuộc thi!" };
    }
    if (user && user.role !== "ADMIN") {
      const userEmail = (user.email || "").toLowerCase().trim();
      const creatorEmail = (contest.creatorEmail || contest.organizerEmail || "").toLowerCase().trim();
      const creatorId = contest.creatorId;
      const isOwner = (creatorEmail && creatorEmail === userEmail) || (creatorId && creatorId === user.id);
      if (!isOwner) {
        return { success: false, error: "Chỉ người tạo hoặc Quản trị viên mới có quyền chia sẻ cuộc thi!" };
      }
    }

    const cleanCreator = (contest.creatorEmail || contest.organizerEmail || "").toLowerCase().trim();
    // Làm sạch và khử trùng danh sách email được chia sẻ
    const cleanList = Array.from(
      new Set(
        sharedEmails
          .map((e) => (e || "").toLowerCase().trim())
          .filter((e) => e && e !== cleanCreator && e.includes("@"))
      )
    );

    contest.sharedEmails = cleanList;
    this.saveToDisk(true);
    return { success: true, contest };
  }

  public getContestByCustomSlug(customSlug: string): ContestModel | undefined {
    this.loadFromDisk();
    if (!customSlug) return undefined;
    const clean = customSlug.trim().toLowerCase();
    const matches = this.contests.filter((c) => c.customSlug?.toLowerCase() === clean && !this.isContestDeleted(c));
    if (matches.length === 0) return undefined;
    matches.sort((a, b) => {
      const aHasFile = (a.planFileUrl ? 1 : 0) + (a.rulesFileUrl ? 1 : 0);
      const bHasFile = (b.planFileUrl ? 1 : 0) + (b.rulesFileUrl ? 1 : 0);
      if (bHasFile !== aHasFile) return bHasFile - aHasFile;
      return (b.clickCount || 0) - (a.clickCount || 0);
    });
    return this.syncAndEnrichContestFiles(matches[0]);
  }

  public getContestByAnySlug(identifier: string): ContestModel | undefined {
    this.loadFromDisk();
    if (!identifier) return undefined;
    const clean = identifier.trim().toLowerCase();
    const matches = this.contests.filter((c) =>
      !this.isContestDeleted(c) && (
        c.customSlug?.toLowerCase() === clean ||
        c.slug.toLowerCase() === clean ||
        c.id.toLowerCase() === clean
      )
    );
    if (matches.length === 0) return undefined;
    matches.sort((a, b) => {
      const aExact = (a.slug.toLowerCase() === clean || a.id.toLowerCase() === clean) ? 1 : 0;
      const bExact = (b.slug.toLowerCase() === clean || b.id.toLowerCase() === clean) ? 1 : 0;
      if (bExact !== aExact) return bExact - aExact;
      const aHasFile = (a.planFileUrl ? 1 : 0) + (a.rulesFileUrl ? 1 : 0);
      const bHasFile = (b.planFileUrl ? 1 : 0) + (b.rulesFileUrl ? 1 : 0);
      if (bHasFile !== aHasFile) return bHasFile - aHasFile;
      return (b.clickCount || 0) - (a.clickCount || 0);
    });
    return this.syncAndEnrichContestFiles(matches[0]);
  }

  public checkCustomSlugAvailable(customSlug: string, currentContestIdOrSlug?: string): { available: boolean; reason?: string } {
    this.loadFromDisk();
    if (!customSlug) {
      return { available: false, reason: "Đường dẫn rút gọn không được để trống" };
    }
    const clean = customSlug.trim().toLowerCase();

    // Chuẩn format: không dấu, viết liền có gạch nối, ví dụ: 'dangbo-2026', 'phapluat'
    const slugRegex = /^[a-z0-9]+(-[a-z0-9]+)*$/;
    if (!slugRegex.test(clean)) {
      return {
        available: false,
        reason: "Link rút gọn chỉ gồm chữ thường không dấu (a-z), số (0-9) và dấu gạch nối (-), không có khoảng trắng hoặc ký tự đặc biệt.",
      };
    }
    if (clean.length < 2 || clean.length > 50) {
      return { available: false, reason: "Độ dài link rút gọn phải từ 2 đến 50 ký tự." };
    }

    const reservedWords = [
      "admin", "api", "thi", "r", "ket-qua", "binh-chon", "login", "register",
      "uploads", "images", "banners", "favicon", "robots", "sitemap", "dashboard"
    ];
    if (reservedWords.includes(clean)) {
      return { available: false, reason: `Từ khóa "${clean}" là từ khóa hệ thống, vui lòng chọn tên khác.` };
    }

    // Check collision with other contests (both Trắc nghiệm & Ảnh/Video)
    const conflict =
      this.contests.find((c) => {
        if (this.isContestDeleted(c)) return false;
        if (currentContestIdOrSlug && (c.id === currentContestIdOrSlug || c.slug === currentContestIdOrSlug)) {
          return false;
        }
        return c.customSlug?.toLowerCase() === clean || c.slug.toLowerCase() === clean;
      }) ||
      this.mediaContests.find((c) => {
        if (this.isMediaContestDeleted(c)) return false;
        if (currentContestIdOrSlug && (c.id === currentContestIdOrSlug || c.slug === currentContestIdOrSlug)) {
          return false;
        }
        return c.customSlug?.toLowerCase() === clean || c.slug.toLowerCase() === clean;
      });

    if (conflict) {
      return {
        available: false,
        reason: `Link rút gọn "${clean}" đã được sử dụng bởi cuộc thi "${conflict.title}". Vui lòng chọn tên khác.`,
      };
    }

    return { available: true };
  }

  public updateContestCustomSlug(contestIdOrSlug: string, customSlug: string): { success: boolean; contest?: ContestModel | MediaContestModel; error?: string } {
    this.loadFromDisk(true);
    const check = this.checkCustomSlugAvailable(customSlug, contestIdOrSlug);
    if (!check.available) {
      return { success: false, error: check.reason };
    }

    const contest: ContestModel | MediaContestModel | undefined =
      this.contests.find((c) => c.id === contestIdOrSlug || c.slug === contestIdOrSlug) ||
      this.mediaContests.find((c) => c.id === contestIdOrSlug || c.slug === contestIdOrSlug);
    if (!contest) {
      return { success: false, error: "Không tìm thấy cuộc thi cần cập nhật link rút gọn." };
    }

    contest.customSlug = customSlug.trim().toLowerCase();
    this.saveToDisk(true);
    return { success: true, contest };
  }

  public incrementContestClickCount(contestIdOrSlug: string): number {
    this.loadFromDisk(true);
    const contest: ContestModel | MediaContestModel | undefined =
      this.contests.find((c) =>
        c.id === contestIdOrSlug ||
        c.slug === contestIdOrSlug ||
        c.customSlug?.toLowerCase() === contestIdOrSlug.toLowerCase()
      ) ||
      this.mediaContests.find((c) =>
        c.id === contestIdOrSlug ||
        c.slug === contestIdOrSlug ||
        c.customSlug?.toLowerCase() === contestIdOrSlug.toLowerCase()
      );
    if (!contest) return 0;
    contest.clickCount = (contest.clickCount || 0) + 1;
    this.saveToDisk();
    return contest.clickCount;
  }

  public deleteContest(slugOrId: string, user?: { email?: string; role?: string; id?: string }): { success: boolean; error?: string } {
    this.loadFromDisk(true);
    const index = this.contests.findIndex((c) => c.slug === slugOrId || c.id === slugOrId);
    if (index === -1) {
      return { success: false, error: "Không tìm thấy cuộc thi cần xóa!" };
    }
    const contest = this.contests[index];
    if (user && user.role !== "ADMIN") {
      const userEmail = (user.email || "").toLowerCase().trim();
      const creatorEmail = (contest.creatorEmail || contest.organizerEmail || "").toLowerCase().trim();
      const creatorId = contest.creatorId;
      const isOwner = (creatorEmail && creatorEmail === userEmail) || (creatorId && creatorId === user.id);
      if (!isOwner) {
        return { success: false, error: "Bạn không có quyền xóa cuộc thi do người khác tạo!" };
      }
    }

    // Lưu dấu vết xóa vĩnh viễn để không bao giờ bị khôi phục từ file backup hoặc bộ nhớ cũ
    if (contest.id && !this.deletedContestIds.includes(contest.id)) {
      this.deletedContestIds.push(contest.id);
    }
    if (contest.slug && !this.deletedContestIds.includes(contest.slug)) {
      this.deletedContestIds.push(contest.slug);
    }
    if (slugOrId && !this.deletedContestIds.includes(slugOrId)) {
      this.deletedContestIds.push(slugOrId);
    }

    const delId = contest.id;
    const delSlug = contest.slug;
    this.contests = this.contests.filter((c) => c.id !== delId && c.slug !== delSlug && c.id !== slugOrId && c.slug !== slugOrId);
    this.attempts = this.attempts.filter((a) => a.contestId !== delId && a.contestId !== delSlug);
    this.participants = this.participants.filter((p) => p.contestId !== delId && p.contestId !== delSlug);
    this.saveToDisk(true);
    return { success: true };
  }

  // --- Media Contests (Cuộc thi Ảnh/Video) ---
  private initSampleMediaContests() {
    this.mediaContests = [
      {
        id: "media-contest-1",
        title: "Nét đẹp văn hóa các dân tộc - Ea Súp năm 2026",
        slug: "net-dep-van-hoa-cac-dan-toc-ea-sup-nam-2026",
        bannerUrl: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&w=1200&q=80",
        type: "IMAGE",
        startDate: "2026-11-10T07:00",
        endDate: "2026-11-24T07:00",
        submitStartDate: "2026-11-10T07:00",
        submitEndDate: "2026-11-18T07:00",
        voteStartDate: "2026-11-18T08:00",
        voteEndDate: "2026-11-24T07:00",
        displayStartDate: "12 thg 11, 2026",
        displayEndDate: "24 thg 11, 2026",
        submissionsCount: 1,
        status: "PUBLISHED",
        description: "Đoàn kết - Bản sắc - Phát triển. Cuộc thi ảnh tôn vinh nét đẹp văn hóa các dân tộc xã Ea Súp năm 2026.",
        organizerName: "Ủy ban MTTQ Việt Nam & Đoàn Thanh niên xã Ea Súp",
        creatorEmail: "Easupsohoa@gmail.com",
        creatorId: "user-admin-2",
        creatorName: "Thường trực UB MTTQ Việt Nam xã Ea Súp",
        createdAt: "2026-11-10T07:00:00Z",
        themeColor: "#1B7F5C",
        layoutMode: "vertical",
        sortBy: "votesCount",
        enableSocialShare: true,
        sharePlatforms: ["facebook", "zalo"],
        requiredParticipantFields: ["authorName", "authorPhone", "unitName", "description"],
        requireApproval: false,
        maxVotesPerUser: 3,
        showLeaderboard: true,
        showVoteCount: true,
        showShareCount: true,
      },
      {
        id: "media-contest-2",
        title: "CUỘC THI ẢNH ĐẸP: NÉT ĐẸP VĂN HÓA & ĐỜI SỐNG EA SÚP 2026",
        slug: "net-dep-van-hoa-ea-sup-2026",
        bannerUrl: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80",
        type: "IMAGE",
        startDate: "2026-10-20T00:00:00Z",
        endDate: "2026-11-20T23:59:59Z",
        submitStartDate: "2026-10-20T07:00",
        submitEndDate: "2026-11-15T17:00",
        voteStartDate: "2026-10-20T08:00",
        voteEndDate: "2026-11-20T23:59",
        displayStartDate: "20 thg 10, 2026",
        displayEndDate: "20 thg 11, 2026",
        submissionsCount: 3,
        status: "PUBLISHED",
        description: "Tôn vinh vẻ đẹp thiên nhiên, con người lao động và khối đại đoàn kết các dân tộc thiểu số tại xã Ea Súp.",
        organizerName: "Hội Phụ nữ & Đoàn Thanh niên xã Ea Súp",
        creatorEmail: "phunu.easup@gmail.com",
        creatorId: "user-phunu",
        creatorName: "Hội Phụ nữ & Đoàn Thanh niên xã Ea Súp",
        createdAt: "2026-10-20T08:00:00Z",
        themeColor: "#1B7F5C",
        layoutMode: "vertical",
        sortBy: "votesCount",
        enableSocialShare: true,
        sharePlatforms: ["facebook", "zalo"],
      },
    ];

    this.mediaSubmissions = [
      {
        id: "sub-0",
        contestId: "media-contest-1",
        contestSlug: "net-dep-van-hoa-cac-dan-toc-ea-sup-nam-2026",
        title: "Nét đẹp Đồng Quê",
        authorName: "Nguyễn Văn An",
        authorPhone: "0943123770",
        authorCccd: "066092001122",
        unitName: "Thôn Đoàn Kết",
        mediaType: "IMAGE",
        mediaUrl: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80",
        description: "Khung cảnh thanh bình và trù phú của làng quê Ea Súp trong nắng sớm.",
        votesCount: 15,
        sharesCount: 4,
        score: 95,
        status: "APPROVED",
        createdAt: "2026-11-10T08:00:00Z",
      },
      {
        id: "sub-1",
        contestId: "media-contest-2",
        contestSlug: "net-dep-van-hoa-ea-sup-2026",
        title: "Bình minh trên Hồ Ea Súp Hạ",
        authorName: "Nguyễn Văn Hùng",
        authorPhone: "0912345678",
        authorCccd: "066092001234",
        unitName: "Thôn 2",
        mediaType: "IMAGE",
        mediaUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80",
        description: "Mặt hồ trong veo đón ánh bình minh, thể hiện sức sống vươn lên của mảnh đất biên giới Ea Súp.",
        votesCount: 148,
        sharesCount: 12,
        score: 90,
        status: "APPROVED",
        createdAt: "2026-10-21T09:00:00Z",
      },
      {
        id: "sub-2",
        contestId: "media-contest-2",
        contestSlug: "net-dep-van-hoa-ea-sup-2026",
        title: "Điệu múa xoang ngày hội Buôn A1",
        authorName: "H'Nhi Ksor",
        authorPhone: "0987654321",
        authorCccd: "066095005678",
        unitName: "Buôn A1",
        mediaType: "IMAGE",
        mediaUrl: "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&w=800&q=80",
        description: "Bảo tồn bản sắc văn hóa cồng chiêng và trang phục truyền thống của đồng bào các dân tộc xã Ea Súp.",
        votesCount: 215,
        sharesCount: 28,
        score: 98,
        status: "APPROVED",
        createdAt: "2026-10-22T14:30:00Z",
      },
      {
        id: "sub-3",
        contestId: "media-contest-2",
        contestSlug: "net-dep-van-hoa-ea-sup-2026",
        title: "Mùa lúa chín vàng cánh đồng Ea Súp",
        authorName: "Lê Minh Tuấn",
        authorPhone: "0903112233",
        authorCccd: "066090009988",
        unitName: "Thôn Đoàn Kết",
        mediaType: "IMAGE",
        mediaUrl: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80",
        description: "Thành quả sau những ngày tháng cần cù lao động của bà con nhân dân các thôn buôn.",
        votesCount: 96,
        sharesCount: 9,
        score: 88,
        status: "APPROVED",
        createdAt: "2026-10-23T11:15:00Z",
      },
    ];
  }

  private slugifyMediaTitle(title: string, fallbackId?: string): string {
    const base = (title || "cuoc-thi")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/[^a-z0-9]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
    return base || fallbackId || `media-${Date.now()}`;
  }

  private normalizeMediaContestsList() {
    let changed = false;
    const usedSlugs = new Set<string>();
    for (const c of this.mediaContests) {
      if (this.isMediaContestDeleted(c)) continue;
      // Fix legacy duplicate "cuoc-thi-binh-chon-moi" when title was customized
      if (
        c.slug === "cuoc-thi-binh-chon-moi" &&
        c.id !== "media-contest-1" &&
        c.title &&
        c.title.trim().toUpperCase() !== "CUỘC THI BÌNH CHỌN MỚI"
      ) {
        const nextSlug = this.slugifyMediaTitle(c.title, c.id);
        c.slug = usedSlugs.has(nextSlug) ? `${nextSlug}-${c.id.slice(-4)}` : nextSlug;
        changed = true;
      } else if (usedSlugs.has(c.slug)) {
        c.slug = `${c.slug}-${c.id.slice(-4)}`;
        changed = true;
      }
      usedSlugs.add(c.slug);

      if (!c.layoutModes || !Array.isArray(c.layoutModes) || c.layoutModes.length === 0) {
        if (c.layoutMode === "both") {
          c.layoutModes = ["vertical", "horizontal"];
        } else if (c.layoutMode === "horizontal") {
          c.layoutModes = ["horizontal"];
        } else {
          c.layoutModes = ["vertical"];
        }
      }
      if (!c.maxImagesPerSubmission || c.maxImagesPerSubmission < 1) {
        c.maxImagesPerSubmission = 5;
      }
    }
    if (changed) {
      this.saveToDisk(true);
    }
  }

  public getMediaContests(): MediaContestModel[] {
    this.loadFromDisk();
    this.normalizeMediaContestsList();
    return this.mediaContests
      .filter((c) => !this.isMediaContestDeleted(c))
      .map((c) => ({
        ...c,
        submissionsCount: this.mediaSubmissions.filter((s) => s.contestId === c.id || s.contestSlug === c.slug).length,
      }));
  }

  public getMediaContestBySlug(slug: string): MediaContestModel | undefined {
    this.loadFromDisk();
    this.normalizeMediaContestsList();
    if (!slug) return undefined;
    const clean = slug.trim().toLowerCase();
    // Ưu tiên khớp chính xác ID trước để tránh trùng slug
    let contest = this.mediaContests.find((c) => c.id === slug && !this.isMediaContestDeleted(c));
    if (!contest) {
      contest = this.mediaContests.find((c) => c.slug.toLowerCase() === clean && !this.isMediaContestDeleted(c));
    }
    if (!contest) {
      contest = this.mediaContests.find((c) => c.customSlug?.toLowerCase() === clean && !this.isMediaContestDeleted(c));
    }
    if (!contest && slug === "cuoc-thi-binh-chon-moi") {
      contest = this.mediaContests.find((c) => !this.isMediaContestDeleted(c));
    }
    if (!contest) return undefined;
    return {
      ...contest,
      submissionsCount: this.mediaSubmissions.filter((s) => s.contestId === contest.id || s.contestSlug === contest.slug).length,
    };
  }

  public createMediaContest(data: Partial<MediaContestModel>): MediaContestModel {
    this.loadFromDisk(true);
    this.normalizeMediaContestsList();
    const id = `media-${Date.now()}`;
    let slug =
      data.slug && data.slug !== "cuoc-thi-binh-chon-moi"
        ? data.slug
        : this.slugifyMediaTitle(data.title || "cuoc-thi", id);

    if (this.mediaContests.some((c) => c.slug === slug && !this.isMediaContestDeleted(c))) {
      slug = `${slug}-${Date.now().toString().slice(-4)}`;
    }

    this.deletedMediaContestIds = this.deletedMediaContestIds.filter(
      (delId) => delId !== id && delId !== slug
    );

    const layoutModes: ("vertical" | "horizontal")[] =
      Array.isArray(data.layoutModes) && data.layoutModes.length > 0
        ? data.layoutModes
        : data.layoutMode === "both"
          ? ["vertical", "horizontal"]
          : data.layoutMode === "horizontal"
            ? ["horizontal"]
            : ["vertical"];

    const layoutMode: "vertical" | "horizontal" | "both" =
      layoutModes.length >= 2 ? "both" : layoutModes[0] || "vertical";

    const newContest: MediaContestModel = {
      id,
      title: data.title || "Nét đẹp văn hóa các dân tộc - Ea Súp năm 2026",
      slug,
      bannerUrl: data.bannerUrl || "/images/contest_stage_banner.jpg",
      type: data.type || "IMAGE",
      startDate: data.startDate || "2026-11-10T07:00",
      endDate: data.endDate || "2026-11-24T07:00",
      submitStartDate: data.submitStartDate || data.startDate || "2026-11-10T07:00",
      submitEndDate: data.submitEndDate || "2026-11-18T07:00",
      voteStartDate: data.voteStartDate || "2026-11-18T08:00",
      voteEndDate: data.voteEndDate || data.endDate || "2026-11-24T07:00",
      displayStartDate: data.displayStartDate || "10/11/2026",
      displayEndDate: data.displayEndDate || "24/11/2026",
      submissionsCount: 0,
      status: data.status || "PUBLISHED",
      description: data.description || "Cuộc thi bình chọn tác phẩm hình ảnh/video trực tuyến",
      rulesHtml: data.rulesHtml || data.description || "Tôn vinh vẻ đẹp thiên nhiên, văn hóa truyền thống và con người các dân tộc xã Ea Súp.",
      rulesFileUrl: data.rulesFileUrl || "",
      announcement: data.announcement || "Ban Tổ Chức đang tiếp nhận tác phẩm dự thi và mở cổng bình chọn trực tuyến công khai.",
      themeColor: data.themeColor || "#1B7F5C",
      layoutMode,
      layoutModes,
      maxImagesPerSubmission: Number(data.maxImagesPerSubmission) > 0 ? Number(data.maxImagesPerSubmission) : 5,
      sortBy: data.sortBy || "votesCount",
      enableSocialShare: data.enableSocialShare !== undefined ? data.enableSocialShare : true,
      sharePlatforms: data.sharePlatforms || ["facebook", "zalo"],
      requiredParticipantFields: data.requiredParticipantFields || ["authorName", "unitName", "authorPhone", "description"],
      requireApproval: data.requireApproval || false,
      maxVotesPerUser: data.maxVotesPerUser || 5,
      contestPassword: data.contestPassword || "",
      showLeaderboard: data.showLeaderboard !== undefined ? data.showLeaderboard : true,
      showVoteCount: data.showVoteCount !== undefined ? data.showVoteCount : true,
      showShareCount: data.showShareCount !== undefined ? data.showShareCount : true,
      organizerName: data.organizerName || "Ủy ban MTTQ Việt Nam xã Ea Súp",
      organizerAddress: data.organizerAddress || "72 Hùng Vương, xã Ea Súp, Huyện Ea Súp, Tỉnh Đắk Lắk",
      organizerPhone: data.organizerPhone || "0888023023",
      organizerEmail: data.organizerEmail || "Easupsohoa@gmail.com",
      creatorEmail: data.creatorEmail,
      creatorId: data.creatorId,
      creatorName: data.creatorName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.mediaContests.unshift(newContest);
    this.saveToDisk(true);
    return newContest;
  }

  public deleteMediaContest(id: string, user?: { email?: string; role?: string; id?: string }): { success: boolean; error?: string } {
    this.loadFromDisk(true);
    let idx = this.mediaContests.findIndex((c) => c.id === id);
    if (idx === -1) {
      idx = this.mediaContests.findIndex((c) => c.slug === id);
    }
    if (idx === -1) return { success: false, error: "Không tìm thấy cuộc thi bình chọn!" };
    const contest = this.mediaContests[idx];
    if (user && user.role !== "ADMIN") {
      const userEmail = (user.email || "").toLowerCase().trim();
      const creatorEmail = (contest.creatorEmail || "").toLowerCase().trim();
      const isOwner = (creatorEmail && creatorEmail === userEmail) || (contest.creatorId && contest.creatorId === user.id);
      if (!isOwner) {
        return { success: false, error: "Bạn không có quyền xóa cuộc thi do người khác tạo!" };
      }
    }
    if (contest.id && !this.deletedMediaContestIds.includes(contest.id)) {
      this.deletedMediaContestIds.push(contest.id);
    }
    if (contest.slug && !this.deletedMediaContestIds.includes(contest.slug)) {
      this.deletedMediaContestIds.push(contest.slug);
    }
    const delId = contest.id;
    const delSlug = contest.slug;
    this.mediaContests = this.mediaContests.filter((c) => c.id !== delId);
    this.mediaSubmissions = this.mediaSubmissions.filter((s) => s.contestId !== delId && s.contestSlug !== delSlug);
    this.saveToDisk(true);
    return { success: true };
  }

  public canUserEditMediaContest(
    contest: MediaContestModel,
    user?: { email?: string; role?: string; id?: string }
  ): boolean {
    if (!user) return false;
    if (user.role === "ADMIN") return true;
    const uEmail = (user.email || "").toLowerCase().trim();
    const cEmail = (contest.creatorEmail || contest.organizerEmail || "").toLowerCase().trim();
    if (cEmail && uEmail && uEmail === cEmail) return true;
    if (contest.creatorId && user.id && contest.creatorId === user.id) return true;
    if (
      Array.isArray(contest.sharedEmails) &&
      uEmail &&
      contest.sharedEmails.some((e) => (e || "").toLowerCase().trim() === uEmail)
    ) {
      return true;
    }
    return false;
  }

  public updateMediaContest(id: string, updateData: Partial<MediaContestModel>): MediaContestModel | null {
    this.loadFromDisk(true);
    this.normalizeMediaContestsList();
    // Ưu tiên tìm chính xác theo id trước, sau đó mới theo slug
    let idx = this.mediaContests.findIndex((c) => c.id === id);
    if (idx === -1) {
      idx = this.mediaContests.findIndex((c) => c.slug === id);
    }
    if (idx === -1) return null;
    const existing = this.mediaContests[idx];
    const {
      creatorEmail,
      creatorId,
      creatorName,
      editorEmail: _ignoreEditorEmail,
      editorRole: _ignoreEditorRole,
      editorId: _ignoreEditorId,
      userEmail: _ignoreUserEmail,
      userRole: _ignoreUserRole,
      userId: _ignoreUserId,
      id: _ignoreId,
      ...rest
    } = updateData as any;

    let layoutModes: ("vertical" | "horizontal")[] = existing.layoutModes || ["vertical"];
    if (Array.isArray(rest.layoutModes) && rest.layoutModes.length > 0) {
      layoutModes = rest.layoutModes;
    } else if (rest.layoutMode) {
      layoutModes =
        rest.layoutMode === "both"
          ? ["vertical", "horizontal"]
          : [rest.layoutMode as "vertical" | "horizontal"];
    }
    const layoutMode: "vertical" | "horizontal" | "both" =
      layoutModes.length >= 2 ? "both" : layoutModes[0] || "vertical";

    this.mediaContests[idx] = {
      ...existing,
      ...rest,
      id: existing.id,
      slug: rest.slug || existing.slug,
      layoutModes,
      layoutMode,
      maxImagesPerSubmission:
        Number(rest.maxImagesPerSubmission) > 0
          ? Number(rest.maxImagesPerSubmission)
          : existing.maxImagesPerSubmission || 5,
      sharedEmails: Array.isArray(rest.sharedEmails) ? rest.sharedEmails : existing.sharedEmails,
      // Giữ nguyên người khởi tạo ban đầu
      creatorEmail: existing.creatorEmail || creatorEmail,
      creatorId: existing.creatorId || creatorId,
      creatorName: existing.creatorName || creatorName,
      updatedAt: new Date().toISOString(),
    };

    // Đồng bộ contestSlug cho các bài dự thi thuộc cuộc thi này nếu slug thay đổi
    const updatedContest = this.mediaContests[idx];
    for (const sub of this.mediaSubmissions) {
      if (sub.contestId === updatedContest.id) {
        sub.contestSlug = updatedContest.slug;
      }
    }

    // Đồng bộ cấu hình (số hình tối đa, trường thông tin bắt buộc, bố cục, màu sắc...) cho các bản ghi cùng tên cuộc thi (nếu có trùng tên)
    const normTitle = (updatedContest.title || "").trim().toLowerCase();
    if (normTitle) {
      for (let i = 0; i < this.mediaContests.length; i++) {
        if (i === idx) continue;
        const other = this.mediaContests[i];
        if ((other.title || "").trim().toLowerCase() === normTitle) {
          this.mediaContests[i] = {
            ...other,
            layoutModes: updatedContest.layoutModes,
            layoutMode: updatedContest.layoutMode,
            maxImagesPerSubmission: updatedContest.maxImagesPerSubmission,
            requiredParticipantFields: updatedContest.requiredParticipantFields,
            themeColor: updatedContest.themeColor,
            sortBy: updatedContest.sortBy,
            enableSocialShare: updatedContest.enableSocialShare,
            sharePlatforms: updatedContest.sharePlatforms,
            requireApproval: updatedContest.requireApproval,
            maxVotesPerUser: updatedContest.maxVotesPerUser,
            showLeaderboard: updatedContest.showLeaderboard,
            showVoteCount: updatedContest.showVoteCount,
            showShareCount: updatedContest.showShareCount,
            sharedEmails: updatedContest.sharedEmails,
            updatedAt: updatedContest.updatedAt,
          };
        }
      }
    }

    this.saveToDisk(true);
    return {
      ...updatedContest,
      submissionsCount: this.mediaSubmissions.filter(
        (s) => s.contestId === updatedContest.id || s.contestSlug === updatedContest.slug
      ).length,
    };
  }

  public getMediaSubmissions(contestIdOrSlug: string): MediaSubmissionModel[] {
    this.loadFromDisk();
    return this.mediaSubmissions.filter(
      (s) => s.contestId === contestIdOrSlug || s.contestSlug === contestIdOrSlug
    );
  }

  public getMediaSubmission(submissionId: string): MediaSubmissionModel | undefined {
    this.loadFromDisk();
    return this.mediaSubmissions.find((s) => s.id === submissionId);
  }

  public addMediaSubmission(data: Omit<MediaSubmissionModel, "id" | "createdAt" | "votesCount">): MediaSubmissionModel {
    this.loadFromDisk(true);
    const newSub: MediaSubmissionModel = {
      ...data,
      id: `sub-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      votesCount: 0,
      status: "APPROVED",
      createdAt: new Date().toISOString(),
    };
    this.mediaSubmissions.unshift(newSub);
    this.saveToDisk();
    return newSub;
  }

  public voteMediaSubmission(submissionId: string): { success: boolean; votesCount: number } {
    this.loadFromDisk(true);
    const sub = this.mediaSubmissions.find((s) => s.id === submissionId);
    if (!sub) return { success: false, votesCount: 0 };
    sub.votesCount += 1;
    this.saveToDisk();
    return { success: true, votesCount: sub.votesCount };
  }

  public deleteMediaSubmission(
    submissionId: string,
    user?: { email?: string; phone?: string; role?: string; id?: string }
  ): { success: boolean; error?: string } {
    this.loadFromDisk(true);
    const subIdx = this.mediaSubmissions.findIndex((s) => s.id === submissionId);
    if (subIdx === -1) {
      return { success: false, error: "Không tìm thấy tác phẩm dự thi!" };
    }
    const sub = this.mediaSubmissions[subIdx];
    const contest = this.mediaContests.find(
      (c) => c.id === sub.contestId || c.slug === sub.contestSlug
    );

    // Kiểm tra quyền tuyệt đối: CHỈ Admin hoặc Người tạo cuộc thi mới có quyền xóa tác phẩm
    // (Tất cả người dùng khác đều không được xóa sản phẩm)
    let hasPermission = false;
    if (user) {
      if (user.role === "ADMIN") hasPermission = true;
      if (contest && this.canUserEditMediaContest(contest, user)) hasPermission = true;
    }

    if (!hasPermission) {
      return {
        success: false,
        error: "Chỉ người tạo cuộc thi hoặc Quản trị viên (Admin) mới có quyền xóa tác phẩm!",
      };
    }

    this.mediaSubmissions.splice(subIdx, 1);

    if (contest) {
      const remaining = this.mediaSubmissions.filter(
        (s) => s.contestId === contest.id || s.contestSlug === contest.slug
      ).length;
      contest.submissionsCount = remaining;
    }

    this.saveToDisk();
    return { success: true };
  }

  // ZERO ANSWER LEAKAGE: When sanitizeForStudent = true, remove correctOptionIds and explanation
  public getContestQuestions(contestId: string, sanitizeForStudent = false): Partial<QuestionModel>[] {
    this.loadFromDisk();
    const contest = this.contests.find((c) => c.id === contestId || c.slug === contestId);
    if (!contest) return [];

    let questions = contest.questions;
    if (!questions || questions.length === 0) {
      questions = this.questionBank && this.questionBank.length > 0
        ? this.questionBank.slice(0, contest.questionCount || 5)
        : MASTER_QUESTION_BANK.slice(0, contest.questionCount || 5);
      contest.questions = questions;
      this.saveToDisk();
    }

    return questions.map((q) => {
      if (sanitizeForStudent) {
        // CẤM LỘ ĐÁP ÁN: Loại bỏ hoàn toàn correctOptionIds và explanation
        const { correctOptionIds, explanation, ...safeQuestion } = q;
        return safeQuestion;
      }
      return q;
    });
  }

  // --- Quản lý Kho đề thi & Ngân hàng câu hỏi (Nhập đồng loạt & Phân quyền riêng tư) ---
  public getQuestionPackages(user?: { email?: string; role?: string; id?: string }): QuestionPackageModel[] {
    this.loadFromDisk();
    const list = this.questionPackages.map((p) => {
      const count = this.questionBank.filter((q) => q.packageId === p.id).length;
      return { ...p, questionCount: count };
    });

    if (!user) {
      return list.filter((p) => p.isSystem);
    }
    if (user.role === "ADMIN") {
      return list;
    }
    // Người dùng chỉ xem được bộ đề chung + các bộ đề do chính người dùng đó tạo (Không cho người khác xem được)
    const userEmail = (user.email || "").toLowerCase().trim();
    return list.filter(
      (p) =>
        p.isSystem ||
        (p.creatorEmail && p.creatorEmail.toLowerCase().trim() === userEmail) ||
        (p.creatorId && p.creatorId === user.id)
    );
  }

  public getMasterQuestionBank(filters?: {
    packageId?: string;
    search?: string;
    user?: { email?: string; role?: string; id?: string };
  }): QuestionModel[] {
    this.loadFromDisk();
    let list = [...this.questionBank];

    // Lọc quyền riêng tư: người tạo có toàn quyền, không cho người khác xem được
    const user = filters?.user;
    if (!user) {
      list = list.filter((q) => q.isSystem);
    } else if (user.role !== "ADMIN") {
      const userEmail = (user.email || "").toLowerCase().trim();
      list = list.filter(
        (q) =>
          q.isSystem ||
          (q.creatorEmail && q.creatorEmail.toLowerCase().trim() === userEmail) ||
          (q.creatorId && q.creatorId === user.id)
      );
    }

    if (filters?.packageId && filters.packageId !== "ALL") {
      list = list.filter((q) => q.packageId === filters.packageId);
    }

    if (filters?.search) {
      const q = filters.search.toLowerCase().trim();
      list = list.filter(
        (item) =>
          item.content.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q) ||
          item.explanation.toLowerCase().includes(q) ||
          (item.packageName && item.packageName.toLowerCase().includes(q))
      );
    }

    return list;
  }

  public importQuestions(
    questions: Array<Omit<QuestionModel, "id"> & { id?: string }>,
    packageInfo: { id?: string; name: string; description?: string },
    user?: { email?: string; role?: string; id?: string; name?: string }
  ): { success: boolean; count: number; packageId: string; packageName: string } {
    this.loadFromDisk(true);
    let pkgId = packageInfo.id;
    let pkg = pkgId ? this.questionPackages.find((p) => p.id === pkgId) : undefined;

    const userEmail = (user?.email || "").toLowerCase().trim();

    if (!pkg) {
      pkgId = `pkg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      pkg = {
        id: pkgId,
        name: packageInfo.name?.trim() || "Bộ đề mới nhập",
        description: packageInfo.description || `Bộ đề do ${user?.name || user?.email || "Người dùng"} tạo`,
        questionCount: 0,
        creatorEmail: user?.email,
        creatorId: user?.id,
        creatorName: user?.name,
        isSystem: false,
        createdAt: new Date().toISOString(),
      };
      this.questionPackages.unshift(pkg);
    } else {
      // Kiểm tra quyền nhập vào bộ đề có sẵn
      if (user && user.role !== "ADMIN") {
        const pkgCreator = (pkg.creatorEmail || "").toLowerCase().trim();
        if (pkg.isSystem || (pkgCreator && pkgCreator !== userEmail)) {
          throw new Error("Bạn không có quyền thêm câu hỏi vào bộ đề của đơn vị khác hoặc bộ đề hệ thống!");
        }
      }
    }

    const newQuestions: QuestionModel[] = questions.map((q, idx) => ({
      ...q,
      id: q.id || `q-imp-${Date.now()}-${idx + 1}`,
      packageId: pkg!.id,
      packageName: pkg!.name,
      creatorEmail: user?.email,
      creatorId: user?.id,
      creatorName: user?.name,
      isPrivate: true,
      createdAt: new Date().toISOString(),
      points: q.points || 10,
    }));

    this.questionBank.unshift(...newQuestions);
    pkg.questionCount = this.questionBank.filter((q) => q.packageId === pkg!.id).length;
    this.saveToDisk(true);

    return {
      success: true,
      count: newQuestions.length,
      packageId: pkg.id,
      packageName: pkg.name,
    };
  }

  public deleteQuestion(id: string, user?: { email?: string; role?: string; id?: string }): { success: boolean; error?: string } {
    this.loadFromDisk(true);
    const idx = this.questionBank.findIndex((q) => q.id === id);
    if (idx === -1) return { success: false, error: "Không tìm thấy câu hỏi!" };
    const q = this.questionBank[idx];

    if (q.isSystem && user?.role !== "ADMIN") {
      return { success: false, error: "Không thể xóa câu hỏi dùng chung của toàn xã!" };
    }

    if (user && user.role !== "ADMIN") {
      const userEmail = (user.email || "").toLowerCase().trim();
      const creatorEmail = (q.creatorEmail || "").toLowerCase().trim();
      const isOwner = (creatorEmail && creatorEmail === userEmail) || (q.creatorId && q.creatorId === user.id);
      if (!isOwner) {
        return { success: false, error: "Bạn không có quyền xóa câu hỏi do người khác tạo!" };
      }
    }

    if (!this.deletedQuestionIds.includes(id)) {
      this.deletedQuestionIds.push(id);
    }
    this.questionBank.splice(idx, 1);
    this.saveToDisk(true);
    return { success: true };
  }

  public deleteQuestionPackage(packageId: string, user?: { email?: string; role?: string; id?: string }): { success: boolean; error?: string } {
    this.loadFromDisk(true);
    if (packageId === "pkg-system-common") {
      return { success: false, error: "Không thể xóa Bộ đề Chung mặc định của xã Ea Súp!" };
    }

    const idx = this.questionPackages.findIndex((p) => p.id === packageId);
    if (idx === -1) return { success: false, error: "Không tìm thấy bộ đề!" };
    const pkg = this.questionPackages[idx];

    if (user && user.role !== "ADMIN") {
      const userEmail = (user.email || "").toLowerCase().trim();
      const creatorEmail = (pkg.creatorEmail || "").toLowerCase().trim();
      const isOwner = (creatorEmail && creatorEmail === userEmail) || (pkg.creatorId && pkg.creatorId === user.id);
      if (!isOwner) {
        return { success: false, error: "Bạn không có quyền xóa bộ đề do người khác tạo!" };
      }
    }

    if (!this.deletedPackageIds.includes(packageId)) {
      this.deletedPackageIds.push(packageId);
    }
    for (const q of this.questionBank) {
      if (q.packageId === packageId && !this.deletedQuestionIds.includes(q.id)) {
        this.deletedQuestionIds.push(q.id);
      }
    }
    this.questionPackages.splice(idx, 1);
    this.questionBank = this.questionBank.filter((q) => q.packageId !== packageId);
    this.saveToDisk(true);
    return { success: true };
  }

  // Admin tạo bộ đề mới (có thể tạo bộ đề chung isSystem=true hoặc bộ đề riêng)
  public createQuestionPackage(
    packageData: { name: string; description?: string; isSystem?: boolean },
    user?: { email?: string; role?: string; id?: string; name?: string }
  ): { success: boolean; package?: QuestionPackageModel; error?: string } {
    this.loadFromDisk(true);
    if (!packageData.name || !packageData.name.trim()) {
      return { success: false, error: "Vui lòng nhập tên bộ đề!" };
    }

    const isSystem = !!packageData.isSystem;
    if (isSystem && user?.role !== "ADMIN") {
      return { success: false, error: "Chỉ Admin mới có quyền tạo bộ đề dùng chung của toàn xã!" };
    }

    const newPkg: QuestionPackageModel = {
      id: `pkg-${isSystem ? "common-" : ""}${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: packageData.name.trim(),
      description: packageData.description?.trim() || (isSystem ? "Bộ đề dùng chung toàn xã Ea Súp" : `Bộ đề do ${user?.name || user?.email || "Người dùng"} tạo`),
      questionCount: 0,
      creatorEmail: user?.email,
      creatorId: user?.id,
      creatorName: user?.name,
      isSystem,
      createdAt: new Date().toISOString(),
    };

    this.questionPackages.unshift(newPkg);
    this.saveToDisk(true);
    return { success: true, package: newPkg };
  }

  // Admin nhân bản từ bộ đề riêng thành bộ đề chung cho toàn xã Ea Súp
  public clonePackageToCommon(
    sourcePackageId: string,
    user?: { email?: string; role?: string; id?: string; name?: string }
  ): { success: boolean; newPackage?: QuestionPackageModel; count?: number; error?: string } {
    this.loadFromDisk(true);
    if (user?.role !== "ADMIN") {
      return { success: false, error: "Chỉ Quản trị viên (Admin) mới có quyền nhân bản thành bộ đề chung!" };
    }

    const sourcePkg = this.questionPackages.find((p) => p.id === sourcePackageId);
    if (!sourcePkg) {
      return { success: false, error: "Không tìm thấy bộ đề nguồn cần nhân bản!" };
    }

    const sourceQuestions = this.questionBank.filter((q) => q.packageId === sourcePackageId);
    if (sourceQuestions.length === 0) {
      return { success: false, error: "Bộ đề nguồn hiện chưa có câu hỏi nào để nhân bản!" };
    }

    const cleanName = sourcePkg.name
      .replace(/^\[Bộ đề Chung\]\s*/i, "")
      .replace(/^\[Chung\]\s*/i, "")
      .trim();

    const commonPkgId = `pkg-common-${Date.now()}`;
    const commonPkg: QuestionPackageModel = {
      id: commonPkgId,
      name: `[Bộ đề Chung] ${cleanName}`,
      description: sourcePkg.description || `Bộ đề dùng chung toàn xã Ea Súp nhân bản từ "${sourcePkg.name}"`,
      questionCount: sourceQuestions.length,
      creatorEmail: user?.email,
      creatorId: user?.id,
      creatorName: "Ban Quản trị Xã Ea Súp (Admin)",
      isSystem: true,
      createdAt: new Date().toISOString(),
    };

    const clonedQuestions: QuestionModel[] = sourceQuestions.map((q, idx) => ({
      ...q,
      id: `q-cmn-${Date.now()}-${idx + 1}`,
      packageId: commonPkgId,
      packageName: commonPkg.name,
      isPrivate: false,
      isSystem: true,
      creatorEmail: user?.email,
      creatorId: user?.id,
      creatorName: "Ban Quản trị Xã Ea Súp (Admin)",
      createdAt: new Date().toISOString(),
    }));

    this.questionPackages.unshift(commonPkg);
    this.questionBank.unshift(...clonedQuestions);
    this.saveToDisk();

    return {
      success: true,
      newPackage: commonPkg,
      count: clonedQuestions.length,
    };
  }

  public registerOrGetParticipant(
    contestId: string,
    fullName: string,
    cccd: string,
    phone: string,
    unitId: string,
    birthYear?: number,
    address?: string,
    extra?: {
      email?: string;
      birthday?: string;
      gender?: string;
      job?: string;
      workplace?: string;
      subUnitName?: string;
    }
  ): ParticipantModel {
    this.loadFromDisk();
    const contest = this.getContestById(contestId);
    const unit = contest?.units.find((u) => u.id === unitId) || { name: "Thôn 1", id: unitId };
    const cleanCccd = cccd ? cccd.trim() : (phone ? `TEL_${phone.trim()}` : `AUTO_${Date.now()}`);
    const cleanPhone = phone ? phone.trim() : "";

    // 1. Tìm trong cuộc thi hiện tại (theo CCCD hoặc Số điện thoại)
    const cleanPhoneDigits = cleanPhone.replace(/\D/g, "");
    let existing = this.participants.find((p) => {
      if (p.contestId !== contestId) return false;
      if (cleanCccd && !cleanCccd.startsWith("TEL_") && !p.cccd.startsWith("TEL_")) {
        return p.cccd === cleanCccd;
      }
      if (cleanPhoneDigits.length >= 9 && p.phone) {
        return p.phone.replace(/\D/g, "") === cleanPhoneDigits;
      }
      return cleanPhone ? p.phone === cleanPhone : false;
    });

    if (existing) {
      // Kiểm tra xem thí sinh này đã có bài thi nộp thành công trong cuộc thi này chưa
      const hasSubmitted = this.attempts.some(
        (a) => a.contestId === contestId && a.participantId === existing!.id && !!a.submittedAt
      );

      // QUY TẮC CỐT LÕI: Lượt 2 và 3 buộc phải giữ nguyên thông tin lần 1 (Họ tên, Đơn vị tham gia)
      if (!hasSubmitted) {
        // Chưa có bài thi nộp: cho phép cập nhật thông tin
        if (fullName && fullName.trim()) existing.fullName = fullName.trim();
        if (unit && unit.id) {
          existing.unitId = unit.id;
          existing.unitName = unit.name;
        }
        if (extra?.subUnitName) existing.subUnitName = extra.subUnitName;
      }
      if (cleanPhone) existing.phone = cleanPhone;
      if (cleanCccd && !existing.cccd.startsWith("TEL_")) existing.cccd = cleanCccd;
      if (birthYear) existing.birthYear = birthYear;
      if (address) existing.address = address;
      if (extra?.email) existing.email = extra.email;
      if (extra?.birthday) existing.birthday = extra.birthday;
      if (extra?.gender) existing.gender = extra.gender;
      if (extra?.job) existing.job = extra.job;
      if (extra?.workplace) existing.workplace = extra.workplace;

      // Đồng bộ sang các lượt thi CỦA CHÍNH CUỘC THI NÀY
      for (const a of this.attempts) {
        if (a.contestId === contestId && a.participantId === existing.id) {
          a.participantName = existing.fullName;
          a.unitName = existing.unitName;
          if (existing.subUnitName) a.subUnitName = existing.subUnitName;
        }
      }

      this.saveToDisk();
      return existing;
    }

    // 2. Nếu chưa có trong cuộc thi này: TẠO HỒ SƠ ĐỘC LẬP CHO CUỘC THI NÀY (Giữ nguyên tên người thi nhập)
    const newParticipant: ParticipantModel = {
      id: `p-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      contestId,
      unitId: unit.id,
      unitName: unit.name,
      subUnitName: extra?.subUnitName,
      fullName: fullName.trim(), // Giữ nguyên chính xác tên người thi nhập cho cuộc thi này
      cccd: cleanCccd,
      phone: cleanPhone,
      birthYear: birthYear || 2000,
      email: extra?.email,
      birthday: extra?.birthday,
      gender: extra?.gender,
      job: extra?.job,
      workplace: extra?.workplace,
      address,
      createdAt: new Date().toISOString(),
    };
    this.participants.push(newParticipant);
    this.saveToDisk();
    return newParticipant;
  }

  public getParticipantAttempts(contestId: string, participantId: string, onlySubmitted = true): ExamAttemptModel[] {
    this.loadFromDisk();
    return this.attempts.filter(
      (a) => a.contestId === contestId && a.participantId === participantId && (!onlySubmitted || !!a.submittedAt)
    );
  }

  public getParticipantByCccd(cccdOrPhone: string, contestId?: string): {
    participant: ParticipantModel | null;
    submittedAttemptsCount: number;
    maxAttempts: number;
    highestScoreAttempt?: ExamAttemptModel | null;
  } {
    this.loadFromDisk();
    const clean = cccdOrPhone ? cccdOrPhone.trim() : "";
    if (!clean) {
      return { participant: null, submittedAttemptsCount: 0, maxAttempts: 3, highestScoreAttempt: null };
    }

    // Nếu có contestId: Chỉ tìm hồ sơ thí sinh TRONG CHÍNH CUỘC THI ĐÓ (giữ nguyên tên riêng biệt ở mỗi cuộc thi)
    const cleanDigits = clean.replace(/\D/g, "");
    let p = contestId
      ? this.participants.find(
          (item) =>
            item.contestId === contestId &&
            ((cleanDigits.length >= 9 && item.phone && item.phone.replace(/\D/g, "") === cleanDigits) ||
              item.cccd === clean ||
              item.phone === clean)
        ) || null
      : null;

    if (!contestId && !p) {
      p =
        this.participants.find(
          (item) =>
            (cleanDigits.length >= 9 && item.phone && item.phone.replace(/\D/g, "") === cleanDigits) ||
            item.cccd === clean ||
            item.phone === clean
        ) || null;
    }

    let submittedAttemptsCount = 0;
    let maxAttempts = 3;
    let highestScoreAttempt: ExamAttemptModel | null = null;

    if (contestId) {
      const contest = this.getContestById(contestId);
      if (contest) maxAttempts = contest.maxAttempts || 3;

      const userAttempts = this.attempts.filter(
        (a) =>
          a.contestId === contestId &&
          (a.participantCccd === clean ||
            a.participantCccd === `TEL_${clean}` ||
            (cleanDigits.length >= 9 && a.participantCccd === `TEL_${cleanDigits}`) ||
            (p && (a.participantId === p.id || a.participantCccd === p.cccd))) &&
          !!a.submittedAt
      );
      submittedAttemptsCount = userAttempts.length;

      if (userAttempts.length > 0) {
        userAttempts.sort((a, b) => {
          if (b.score !== a.score) return b.score - a.score;
          if (a.durationSeconds !== b.durationSeconds) return a.durationSeconds - b.durationSeconds;
          return new Date(a.submittedAt!).getTime() - new Date(b.submittedAt!).getTime();
        });
        highestScoreAttempt = userAttempts[0];
      }
    }

    return {
      participant: p,
      submittedAttemptsCount,
      maxAttempts,
      highestScoreAttempt,
    };
  }

  public startAttempt(
    contestId: string,
    participantId: string,
    ipAddress?: string
  ): { attempt: ExamAttemptModel; safeQuestions: Partial<QuestionModel>[] } {
    this.loadFromDisk();
    const contest = this.getContestById(contestId);
    if (!contest) throw new Error("Cuộc thi không tồn tại!");

    const participant = this.participants.find((p) => p.id === participantId);
    if (!participant) throw new Error("Thí sinh chưa đăng ký thông tin!");

    // Kiểm tra số lượt thi đã nộp bài thành công (chỉ tính lượt đã nộp bài)
    const submittedAttempts = this.getParticipantAttempts(contestId, participantId, true);
    if (submittedAttempts.length >= (contest.maxAttempts || 3)) {
      throw new Error(`Bạn đã hoàn thành tối đa ${contest.maxAttempts || 3} lượt thi theo thể lệ quy định!`);
    }

    // Tự động dọn dẹp các lượt thi dở dang (chưa nộp) trước đó của thí sinh này
    this.attempts = this.attempts.filter(
      (a) => !(a.contestId === contestId && a.participantId === participantId && !a.submittedAt)
    );

    // Lấy danh sách câu hỏi và tráo thứ tự
    let allQuestions = [...(contest.questions || [])];
    if (allQuestions.length === 0) {
      allQuestions = this.questionBank && this.questionBank.length > 0
        ? [...this.questionBank]
        : [...MASTER_QUESTION_BANK];
      contest.questions = [...allQuestions];
      this.saveToDisk();
    }
    // Xử lý chế độ trộn đề thi: "NONE" (Không trộn) và "AUTO" (Trộn tự động)
    // Câu hỏi luôn đi kèm đáp án tương ứng của chính câu hỏi đó
    const isShuffle = contest.shuffleMode === "AUTO" || contest.shuffleMode === "ALL";
    const orderedQuestions = isShuffle ? [...allQuestions].sort(() => 0.5 - Math.random()) : [...allQuestions];
    const count = Math.min(contest.questionCount || orderedQuestions.length, orderedQuestions.length);
    const selected = orderedQuestions.slice(0, count);
    const assignedQuestionIds = selected.map((q) => q.id);

    const nowIso = new Date().toISOString();
    const newAttempt: ExamAttemptModel = {
      id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      contestId,
      participantId,
      participantName: participant.fullName,
      participantCccd: participant.cccd,
      unitName: participant.unitName,
      subUnitName: participant.subUnitName,
      assignedQuestionIds,
      answers: {},
      score: 0,
      correctCount: 0,
      totalQuestions: selected.length,
      accuracyPercent: 0,
      durationSeconds: 0,
      tabSwitchCount: 0,
      ipAddress,
      startedAt: nowIso,
      createdAt: nowIso,
    };

    this.attempts.push(newAttempt);
    this.saveToDisk();

    // ZERO ANSWER LEAKAGE: Trả về câu hỏi an toàn không chứa đáp án
    const safeQuestions = selected.map((q) => {
      const { correctOptionIds, explanation, ...safeQ } = q;
      // Nếu Không trộn (NONE): Giữ nguyên thứ tự A, B, C, D gốc của câu hỏi
      // Nếu Trộn tự động (AUTO): Trộn ngẫu nhiên phương án của chính câu hỏi đó
      const finalOptions = isShuffle ? [...safeQ.options].sort(() => 0.5 - Math.random()) : [...safeQ.options];
      return {
        ...safeQ,
        options: finalOptions,
      };
    });

    return { attempt: newAttempt, safeQuestions };
  }

  public submitAttempt(
    attemptId: string,
    answers: Record<string, string[]>,
    tieBreakerPrediction?: number,
    tabSwitchCount = 0
  ): {
    score: number;
    correctCount: number;
    totalQuestions: number;
    accuracyPercent: number;
    durationSeconds: number;
    tieBreakerPrediction?: number;
    review: {
      questionId: string;
      category: string;
      content: string;
      selectedOptionIds: string[];
      correctOptionIds: string[];
      isCorrect: boolean;
      explanation: string;
    }[];
  } {
    this.loadFromDisk(true);
    const attempt = this.attempts.find((a) => a.id === attemptId);
    if (!attempt) throw new Error("Lượt thi không tồn tại hoặc đã bị hủy!");

    const contest = this.getContestById(attempt.contestId);
    if (!contest) throw new Error("Cuộc thi không tồn tại!");

    // Server-Side Timer: Tính toán thời gian làm bài chuẩn xác từ máy chủ
    const submittedAt = new Date();
    const startedAt = new Date(attempt.startedAt);
    const durationSeconds = Math.max(1, Math.round((submittedAt.getTime() - startedAt.getTime()) / 1000));

    // Chấm điểm server-side
    let score = 0;
    let correctCount = 0;
    const review: {
      questionId: string;
      category: string;
      content: string;
      selectedOptionIds: string[];
      correctOptionIds: string[];
      isCorrect: boolean;
      explanation: string;
    }[] = [];

    for (const qId of attempt.assignedQuestionIds) {
      const question = contest.questions.find((q) => q.id === qId) ||
        MASTER_QUESTION_BANK.find((q) => q.id === qId);

      if (!question) continue;

      const userSelected = answers[qId] || [];
      const correct = question.correctOptionIds || [];

      // So sánh đáp án
      const isCorrect =
        userSelected.length === correct.length &&
        userSelected.every((val) => correct.includes(val));

      if (isCorrect) {
        score += question.points || 10;
        correctCount += 1;
      }

      review.push({
        questionId: question.id,
        category: question.category,
        content: question.content,
        selectedOptionIds: userSelected,
        correctOptionIds: correct,
        isCorrect,
        explanation: question.explanation,
      });
    }

    const totalQuestions = attempt.assignedQuestionIds.length || 1;
    const accuracyPercent = Math.round((correctCount / totalQuestions) * 100 * 10) / 10;

    // Cập nhật attempt
    attempt.answers = answers;
    attempt.score = score;
    attempt.correctCount = correctCount;
    attempt.totalQuestions = totalQuestions;
    attempt.accuracyPercent = accuracyPercent;
    attempt.durationSeconds = durationSeconds;
    attempt.tieBreakerPrediction = tieBreakerPrediction;
    attempt.tabSwitchCount = tabSwitchCount;
    attempt.submittedAt = submittedAt.toISOString();
    this.saveToDisk();

    return {
      score,
      correctCount,
      totalQuestions,
      accuracyPercent,
      durationSeconds,
      tieBreakerPrediction,
      review,
    };
  }

  public getContestStats(contestId: string) {
    this.loadFromDisk();
    const contest = this.getContestById(contestId) || this.getContestBySlug(contestId);
    const validIds = new Set<string>([contestId]);
    if (contest) {
      validIds.add(contest.id);
      validIds.add(contest.slug);
    }

    const contestAttempts = this.attempts.filter((a) => validIds.has(a.contestId) && !!a.submittedAt);
    const contestParticipants = this.participants.filter((p) => validIds.has(p.contestId));

    const totalAttempts = contestAttempts.length;
    const totalParticipants = contestParticipants.length;
    const avgScore =
      totalAttempts > 0
        ? Math.round((contestAttempts.reduce((sum, a) => sum + a.score, 0) / totalAttempts) * 10) / 10
        : 0;

    // Thống kê 7 mốc ngày làm bài (sparklines: Lượt thi đỏ-cam, Lượt đăng ký xanh-dương)
    const attemptsSparkline = [12, 18, 35, 42, 68, 85, Math.max(92, totalAttempts)];
    const registrationsSparkline = [10, 15, 28, 34, 52, 69, Math.max(75, totalParticipants)];

    // Thống kê theo đơn vị (Thôn, Buôn)
    const unitMap: Record<string, number> = {};
    for (const a of contestAttempts) {
      unitMap[a.unitName] = (unitMap[a.unitName] || 0) + 1;
    }

    return {
      totalAttempts,
      totalParticipants,
      avgScore,
      attemptsSparkline,
      registrationsSparkline,
      unitBreakdown: unitMap,
    };
  }

  public getLeaderboard(
    contestId: string,
    filters?: {
      search?: string;
      unitName?: string;
      fromDate?: string;
      toDate?: string;
    }
  ) {
    this.loadFromDisk();
    const contest = this.getContestById(contestId) || this.getContestBySlug(contestId);
    const validIds = new Set<string>([contestId]);
    if (contest) {
      validIds.add(contest.id);
      validIds.add(contest.slug);
    }

    let list = this.attempts.filter((a) => validIds.has(a.contestId) && !!a.submittedAt);

    if (filters?.search) {
      const q = filters.search.toLowerCase().trim();
      list = list.filter(
        (a) =>
          a.participantName.toLowerCase().includes(q) ||
          a.participantCccd.includes(q)
      );
    }

    if (filters?.unitName && filters.unitName !== "ALL") {
      list = list.filter((a) => a.unitName === filters.unitName);
    }

    if (filters?.fromDate) {
      const from = new Date(filters.fromDate).getTime();
      list = list.filter((a) => new Date(a.submittedAt!).getTime() >= from);
    }

    if (filters?.toDate) {
      const to = new Date(filters.toDate).getTime() + 86400000;
      list = list.filter((a) => new Date(a.submittedAt!).getTime() <= to);
    }

    // Nhóm theo từng thí sinh (CCCD / participantId) và chỉ lưu/hiển thị lần thi có ĐIỂM CAO NHẤT
    const candidateMap = new Map<string, { bestAttempt: ExamAttemptModel; allAttempts: ExamAttemptModel[] }>();

    for (const att of list) {
      const key = (att.participantCccd || att.participantId).trim();
      const existingGroup = candidateMap.get(key);
      if (!existingGroup) {
        candidateMap.set(key, { bestAttempt: att, allAttempts: [att] });
      } else {
        existingGroup.allAttempts.push(att);
        // So sánh để chọn lần cao điểm nhất (nếu bằng điểm, chọn thời gian làm ít nhất, nộp sớm nhất)
        const currentBest = existingGroup.bestAttempt;
        let isBetter = false;
        if (att.score > currentBest.score) {
          isBetter = true;
        } else if (att.score === currentBest.score) {
          if (att.durationSeconds < currentBest.durationSeconds) {
            isBetter = true;
          } else if (att.durationSeconds === currentBest.durationSeconds) {
            if (new Date(att.submittedAt!).getTime() < new Date(currentBest.submittedAt!).getTime()) {
              isBetter = true;
            }
          }
        }
        if (isBetter) {
          existingGroup.bestAttempt = att;
        }
      }
    }

    // Danh sách xếp hạng chứa toàn bộ thông tin của lần cao điểm nhất kèm số lượt đã thi
    const deduplicatedList = Array.from(candidateMap.values()).map(({ bestAttempt, allAttempts }) => {
      return {
        ...bestAttempt,
        attemptCount: allAttempts.length, // Số lượt đã tham gia (tối đa 3)
      };
    });

    // Sắp xếp: Điểm cao nhất -> Thời gian làm ít nhất -> Thời điểm nộp sớm nhất
    deduplicatedList.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (a.durationSeconds !== b.durationSeconds) return a.durationSeconds - b.durationSeconds;
      return new Date(a.submittedAt!).getTime() - new Date(b.submittedAt!).getTime();
    });

    return deduplicatedList;
  }

  // NÂNG CẤP TOÀN DIỆN MODULE BẢNG XẾP HẠNG ĐA CHIỀU (CÁ NHÂN / TỔ CHỨC x THEO TUẦN / TOÀN CUỘC THI)
  public getMultiDimensionalLeaderboard(
    contestIdOrSlug?: string,
    options?: {
      scope?: "individual" | "organization";
      period?: "week" | "contest";
      weekOffset?: number;
      search?: string;
      unitName?: string;
      fromDate?: string;
      toDate?: string;
      limit?: number;
      page?: number;
    }
  ) {
    this.loadFromDisk();
    const scope = options?.scope || "individual";
    const period = options?.period || "contest";
    const weekOffset = options?.weekOffset || 0;

    // 1. Xác định cuộc thi: nếu không có contestIdOrSlug, lấy contest PUBLISHED mới nhất
    let contest = contestIdOrSlug
      ? (this.getContestById(contestIdOrSlug) || this.getContestBySlug(contestIdOrSlug))
      : this.contests.find((c) => c.status === "PUBLISHED") || this.contests[0];

    if (!contest && this.contests.length > 0) {
      contest = this.contests[0];
    }

    const validIds = new Set<string>();
    if (contest) {
      validIds.add(contest.id);
      validIds.add(contest.slug);
    }

    // 2. Danh sách đơn vị đồng bộ 2 chiều từ contest.units (Ảnh 1) - Hỗ trợ phân cấp 3 tầng (Cấp 1 -> Cấp 2 -> Cấp 3)
    const unitsHierarchy: { name: string; subUnits: string[] }[] = (contest?.units && contest.units.length > 0)
      ? contest.units.map((u: any) => ({
          name: typeof u === "string" ? u : u.name,
          subUnits: (typeof u === "object" && Array.isArray(u.subUnits)) ? u.subUnits : [],
        }))
      : EA_SUP_VILLAGES.map((v) => ({ name: v, subUnits: [] }));

    const configuredUnits: string[] = unitsHierarchy.map((u) => u.name);
    const unitGroupName = contest?.unitGroupName || "Đoàn TNCS Hồ Chí Minh Xã Ea Súp";

    // 3. Khung thời gian theo period (week / contest) chuẩn giờ Việt Nam UTC+7
    let periodLabel = "Toàn cuộc thi";
    let weekStart: Date | null = null;
    let weekEnd: Date | null = null;

    if (period === "week") {
      const now = new Date();
      // Múi giờ Việt Nam UTC+7
      const utcNow = now.getTime() + now.getTimezoneOffset() * 60000;
      const vnTime = new Date(utcNow + 7 * 3600000);
      const day = vnTime.getDay(); // 0: Chủ Nhật, 1: Thứ Hai,...
      const diffToMonday = day === 0 ? -6 : 1 - day;

      const monday = new Date(vnTime);
      monday.setDate(vnTime.getDate() + diffToMonday + weekOffset * 7);
      monday.setHours(0, 0, 0, 0);

      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      sunday.setHours(23, 59, 59, 999);

      // Quy đổi ngược về UTC timestamp để so sánh với thời gian lưu trên Server
      weekStart = new Date(monday.getTime() - 7 * 3600000);
      weekEnd = new Date(sunday.getTime() - 7 * 3600000);

      const pad = (n: number) => n.toString().padStart(2, "0");
      const dStart = `${pad(monday.getDate())}/${pad(monday.getMonth() + 1)}`;
      const dEnd = `${pad(sunday.getDate())}/${pad(sunday.getMonth() + 1)}/${sunday.getFullYear()}`;
      periodLabel = weekOffset === 0 ? `Tuần này (${dStart} - ${dEnd})` : `Tuần (${dStart} - ${dEnd})`;
    } else {
      periodLabel = contest ? `Toàn cuộc thi: ${contest.title}` : "Toàn cuộc thi";
    }

    // 4. Lấy tất cả bài thi hợp lệ đã nộp của cuộc thi
    let attemptsList = this.attempts.filter((a) => {
      if (contest && !validIds.has(a.contestId)) return false;
      if (!a.submittedAt) return false;
      return true;
    });

    // Lọc theo khung thời gian period
    if (period === "week" && weekStart && weekEnd) {
      const startMs = weekStart.getTime();
      const endMs = weekEnd.getTime();
      attemptsList = attemptsList.filter((a) => {
        const t = new Date(a.submittedAt!).getTime();
        return t >= startMs && t <= endMs;
      });
    }

    // Lọc thêm fromDate / toDate nếu có
    if (options?.fromDate) {
      const fromMs = new Date(options.fromDate).getTime();
      attemptsList = attemptsList.filter((a) => new Date(a.submittedAt!).getTime() >= fromMs);
    }
    if (options?.toDate) {
      const toMs = new Date(options.toDate).getTime() + 86400000;
      attemptsList = attemptsList.filter((a) => new Date(a.submittedAt!).getTime() <= toMs);
    }

    // Tổng số người thi thực tế (distinct candidate)
    const allUniqueParticipantsSet = new Set(
      attemptsList.map((a) => (a.participantCccd || a.participantId).trim())
    );
    const totalParticipants = allUniqueParticipantsSet.size;
    const totalAttempts = attemptsList.length;

    // 5. XỬ LÝ THEO SCOPE: 'individual' (Cá nhân)
    if (scope === "individual") {
      let filtered = [...attemptsList];

      // Lọc theo search
      if (options?.search) {
        const q = options.search.toLowerCase().trim();
        filtered = filtered.filter(
          (a) =>
            a.participantName.toLowerCase().includes(q) ||
            (a.participantCccd && a.participantCccd.includes(q))
        );
      }

      // Lọc theo đơn vị con nếu có (Ảnh 1) - Hỗ trợ cả Cấp 2 và Cấp 3 (Lớp/Chi đoàn)
      if (options?.unitName && options.unitName !== "ALL") {
        const filterVal = options.unitName.trim();
        filtered = filtered.filter((a) => {
          if (a.unitName === filterVal) return true;
          if (a.subUnitName === filterVal) return true;
          if (a.unitName && (a.unitName.startsWith(filterVal + " - ") || a.unitName.endsWith(" - " + filterVal))) return true;
          return false;
        });
      }

      // Nhóm theo từng cá nhân (Deduplication - Best Attempt Only)
      const candidateMap = new Map<string, { bestAttempt: ExamAttemptModel; allAttempts: ExamAttemptModel[] }>();

      for (const att of filtered) {
        const key = (att.participantCccd || att.participantId).trim();
        const group = candidateMap.get(key);
        if (!group) {
          candidateMap.set(key, { bestAttempt: att, allAttempts: [att] });
        } else {
          group.allAttempts.push(att);
          // 5-Tier Tie-Breaking Cascade để tìm Best Attempt của cá nhân đó
          const curr = att;
          const best = group.bestAttempt;
          let isBetter = false;

          // Tier 1: Điểm cao hơn
          if (curr.score > best.score) {
            isBetter = true;
          } else if (curr.score === best.score) {
            // Tier 2: Thời gian làm bài ngắn hơn
            if (curr.durationSeconds < best.durationSeconds) {
              isBetter = true;
            } else if (curr.durationSeconds === best.durationSeconds) {
              // Tier 3: Độ lệch câu hỏi phụ nhỏ hơn
              if (contest?.hasTieBreaker) {
                const diffCurr = Math.abs((curr.tieBreakerPrediction ?? 999999) - totalParticipants);
                const diffBest = Math.abs((best.tieBreakerPrediction ?? 999999) - totalParticipants);
                if (diffCurr < diffBest) {
                  isBetter = true;
                } else if (diffCurr === diffBest) {
                  // Tier 4: Nộp bài sớm hơn
                  if (new Date(curr.submittedAt!).getTime() < new Date(best.submittedAt!).getTime()) {
                    isBetter = true;
                  }
                }
              } else {
                // Tier 4: Nộp bài sớm hơn
                if (new Date(curr.submittedAt!).getTime() < new Date(best.submittedAt!).getTime()) {
                  isBetter = true;
                }
              }
            }
          }

          if (isBetter) {
            group.bestAttempt = curr;
          }
        }
      }

      // Tạo danh sách thí sinh với lượt thi tốt nhất
      const rankings = Array.from(candidateMap.values()).map(({ bestAttempt, allAttempts }) => {
        // Tìm thông tin participant của chính cuộc thi này để lấy số điện thoại
        const pInfo =
          this.participants.find(
            (p) => p.contestId === contest?.id && (p.id === bestAttempt.participantId || p.cccd === bestAttempt.participantCccd)
          ) ||
          this.participants.find(
            (p) => p.id === bestAttempt.participantId || p.cccd === bestAttempt.participantCccd
          );
        const rawPhone = pInfo?.phone || "";
        const phoneMasked = rawPhone.length >= 8
          ? rawPhone.slice(0, 4) + "***" + rawPhone.slice(-3)
          : rawPhone;
        const cccdMasked = bestAttempt.participantCccd && bestAttempt.participantCccd.length >= 6
          ? bestAttempt.participantCccd.slice(0, 3) + "******" + bestAttempt.participantCccd.slice(-3)
          : bestAttempt.participantCccd;

        return {
          id: bestAttempt.id,
          participantId: bestAttempt.participantId,
          fullName: bestAttempt.participantName,
          unitName: bestAttempt.unitName,
          subUnitName: bestAttempt.subUnitName,
          phoneMasked,
          cccdMasked,
          score: bestAttempt.score,
          correctCount: bestAttempt.correctCount,
          totalQuestions: bestAttempt.totalQuestions,
          accuracyPercent: bestAttempt.accuracyPercent,
          durationSeconds: bestAttempt.durationSeconds,
          tieBreakerPrediction: bestAttempt.tieBreakerPrediction,
          attemptCount: allAttempts.length,
          submittedAt: bestAttempt.submittedAt,
        };
      });

      // 5-Tier Tie-Breaking Cascade cho toàn bộ bảng xếp hạng cá nhân
      rankings.sort((a, b) => {
        // Tier 1: Điểm cao hơn
        if (b.score !== a.score) return b.score - a.score;
        // Tier 2: Thời gian ngắn hơn
        if (a.durationSeconds !== b.durationSeconds) return a.durationSeconds - b.durationSeconds;
        // Tier 3: Độ lệch câu hỏi phụ
        if (contest?.hasTieBreaker) {
          const diffA = Math.abs((a.tieBreakerPrediction ?? 999999) - totalParticipants);
          const diffB = Math.abs((b.tieBreakerPrediction ?? 999999) - totalParticipants);
          if (diffA !== diffB) return diffA - diffB;
        }
        // Tier 4: Lượt thi ít hơn (đạt thành tích ở lượt 1 ưu tiên hơn lượt 3)
        if (a.attemptCount !== b.attemptCount) return a.attemptCount - b.attemptCount;
        // Tier 5: Thời điểm nộp sớm hơn
        return new Date(a.submittedAt!).getTime() - new Date(b.submittedAt!).getTime();
      });

      // Gán rank 1, 2, 3...
      const rankedList = rankings.map((item, idx) => ({
        rank: idx + 1,
        ...item,
      }));

      return {
        contest: {
          id: contest?.id || "",
          slug: contest?.slug || "",
          title: contest?.title || "Cuộc thi trực tuyến xã Ea Súp",
          bannerUrl: contest?.bannerUrl || "",
          themeColor: contest?.themeColor || "#00A9E0",
          creatorEmail: contest?.creatorEmail || contest?.organizerEmail || "",
          creatorId: contest?.creatorId || "",
          organizerEmail: contest?.organizerEmail || "",
          sharedEmails: contest?.sharedEmails || [],
          unitGroupName,
          units: configuredUnits,
          unitsHierarchy,
          hasTieBreaker: contest?.hasTieBreaker ?? true,
        },
        scope: "individual" as const,
        period,
        periodLabel,
        totalParticipants,
        totalAttempts,
        unitGroupName,
        units: configuredUnits,
        unitsHierarchy,
        rankings: rankedList,
      };
    }

    // 6. XỬ LÝ THEO SCOPE: 'organization' (Tổ chức / Đơn vị)
    // Lọc bài thi hợp lệ chống spam ảo: durationSeconds >= 10
    const validQualityAttempts = attemptsList.filter((a) => (a.durationSeconds || 0) >= 10);

    // Khởi tạo map cho tất cả đơn vị cấu hình (để đơn vị 0 lượt vẫn hiển thị đầy đủ)
    const orgMap = new Map<string, {
      unitName: string;
      candidates: Map<string, ExamAttemptModel>;
      totalAttempts: number;
    }>();

    for (const u of configuredUnits) {
      orgMap.set(u, {
        unitName: u,
        candidates: new Map(),
        totalAttempts: 0,
      });
    }

    // Gom dữ liệu vào từng tổ chức
    for (const att of validQualityAttempts) {
      const uName = att.unitName || "Đơn vị khác";
      if (!orgMap.has(uName)) {
        orgMap.set(uName, {
          unitName: uName,
          candidates: new Map(),
          totalAttempts: 0,
        });
      }
      const entry = orgMap.get(uName)!;
      entry.totalAttempts += 1;

      const candKey = (att.participantCccd || att.participantId).trim();
      const existingBest = entry.candidates.get(candKey);
      if (!existingBest || att.score > existingBest.score || (att.score === existingBest.score && att.durationSeconds < existingBest.durationSeconds)) {
        entry.candidates.set(candKey, att);
      }
    }

    // Tính toán số liệu thống kê cho mỗi tổ chức
    const orgRankings = Array.from(orgMap.values()).map((org) => {
      const uniqueParticipants = org.candidates.size;
      const totalAttemptsCount = org.totalAttempts;
      const bestAttemptsList = Array.from(org.candidates.values());

      // Số thí sinh đạt từ >= 50% điểm trở lên
      const qualifiedParticipants = bestAttemptsList.filter(
        (a) => (a.accuracyPercent >= 50) || (a.totalQuestions > 0 && (a.correctCount / a.totalQuestions) >= 0.5)
      ).length;

      // Điểm trung bình cộng các lượt thi tốt nhất
      const sumScores = bestAttemptsList.reduce((acc, a) => acc + (a.score || 0), 0);
      const avgBestScore = uniqueParticipants > 0 ? Number((sumScores / uniqueParticipants).toFixed(1)) : 0;

      // Thời gian trung bình các lượt thi tốt nhất
      const sumDurations = bestAttemptsList.reduce((acc, a) => acc + (a.durationSeconds || 0), 0);
      const avgDurationSeconds = uniqueParticipants > 0 ? Math.round(sumDurations / uniqueParticipants) : 0;

      // Tỷ lệ đạt (%)
      const completionRate = uniqueParticipants > 0 ? Math.round((qualifiedParticipants / uniqueParticipants) * 100) : 0;

      return {
        unitName: org.unitName,
        uniqueParticipants,
        totalAttempts: totalAttemptsCount,
        qualifiedParticipants,
        avgBestScore,
        avgDurationSeconds,
        completionRate,
      };
    });

    // Sắp xếp thứ tự Tổ chức:
    // 1. uniqueParticipants DESC
    // 2. qualifiedParticipants DESC
    // 3. avgBestScore DESC
    // 4. totalAttempts DESC
    // 5. avgDurationSeconds ASC
    orgRankings.sort((a, b) => {
      if (b.uniqueParticipants !== a.uniqueParticipants) return b.uniqueParticipants - a.uniqueParticipants;
      if (b.qualifiedParticipants !== a.qualifiedParticipants) return b.qualifiedParticipants - a.qualifiedParticipants;
      if (b.avgBestScore !== a.avgBestScore) return b.avgBestScore - a.avgBestScore;
      if (b.totalAttempts !== a.totalAttempts) return b.totalAttempts - a.totalAttempts;
      if (a.avgDurationSeconds !== b.avgDurationSeconds) return a.avgDurationSeconds - b.avgDurationSeconds;
      return a.unitName.localeCompare(b.unitName, "vi");
    });

    // Gán thứ hạng
    const rankedOrgList = orgRankings.map((item, idx) => ({
      rank: idx + 1,
      ...item,
    }));

    return {
      contest: {
        id: contest?.id || "",
        slug: contest?.slug || "",
        title: contest?.title || "Cuộc thi trực tuyến xã Ea Súp",
        bannerUrl: contest?.bannerUrl || "",
        themeColor: contest?.themeColor || "#00A9E0",
        creatorEmail: contest?.creatorEmail || contest?.organizerEmail || "",
        creatorId: contest?.creatorId || "",
        organizerEmail: contest?.organizerEmail || "",
        sharedEmails: contest?.sharedEmails || [],
        unitGroupName,
        units: configuredUnits,
        unitsHierarchy,
        hasTieBreaker: contest?.hasTieBreaker ?? true,
      },
      scope: "organization" as const,
      period,
      periodLabel,
      totalParticipants,
      totalAttempts,
      unitGroupName,
      units: configuredUnits,
      unitsHierarchy,
      rankings: rankedOrgList,
    };
  }

  public getSystemStats() {
    this.loadFromDisk();
    const now = new Date();

    const activeContests = this.contests.filter((c) => {
      const isStarted = new Date(c.startTime) <= now;
      const isNotEnded = new Date(c.endTime) >= now;
      return c.status === "PUBLISHED" && isStarted && isNotEnded;
    }).length;

    const upcomingContests = this.contests.filter((c) => {
      return c.status === "DRAFT" || new Date(c.startTime) > now;
    }).length;

    // Đồng bộ 2 chiều: Đếm chính xác toàn bộ các lượt thi đã nộp bài của mọi thí sinh
    const submittedAttempts = this.attempts.filter((a) => !!a.submittedAt);
    const totalAttempts = submittedAttempts.length;

    // Số lượt thi trong 7 ngày gần nhất
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const attempts7Days = submittedAttempts.filter((a) => {
      return new Date(a.submittedAt!) >= sevenDaysAgo;
    }).length;

    // Tổng số thí sinh thực tế (loại bỏ CCCD trùng lặp)
    const uniqueParticipants = new Set(
      this.participants.map((p) => (p.cccd || "").trim()).filter(Boolean)
    );
    const totalParticipants = uniqueParticipants.size > 0 ? uniqueParticipants.size : this.participants.length;

    return {
      upcomingContests,
      activeContests,
      totalAttempts,
      totalAttempts7Days: attempts7Days,
      totalParticipants,
      totalContests: this.contests.length,
    };
  }
}

// Global Singleton Instance
declare global {
  var __easupDataStore: DataStore | undefined;
}

export const store =
  global.__easupDataStore && typeof (global.__easupDataStore as any).getUsers === "function"
    ? global.__easupDataStore
    : new DataStore();

global.__easupDataStore = store;
