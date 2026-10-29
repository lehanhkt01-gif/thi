# CONTEXT.md - TÀI LIỆU LƯU TRỮ NGỮ CẢNH & TRẠNG THÁI DỰ ÁN
**Hệ thống**: Nền tảng Thi Trắc nghiệm & Tuyên truyền Pháp luật Trực tuyến Đa Tổ chức Xã Ea Súp  
**Tên miền chính thức**: `cuocthi.easupso.com` (Hệ sinh thái chuyển đổi số easupso.com)  
**Địa bàn**: Xã Ea Súp, Huyện Ea Súp, Tỉnh Đắk Lắk  
**Ngày cập nhật**: 27/10/2026  
**Trạng thái phiên làm việc**: Đã hoàn thiện toàn bộ mã nguồn, cấu hình hạ tầng, API backend, giao diện người dùng và kiểm thử E2E 100% đạt chuẩn.

---

## 🔗 1. BẢNG LIÊN KẾT LOCAL KIỂM THỬ TỨC THÌ (LOCAL TESTING LINKS)

Máy chủ phát triển (Development Server) đang hoạt động tại cổng **`:3002`** (hoặc cổng dự phòng `:3001` và `:3000`). Bấm vào các liên kết bên dưới để kiểm thử trực tiếp trên trình duyệt:

| Phân hệ / Chức năng | Liên kết Local Chính (Cổng 3001) | Liên kết Cổng 3002 | Mục đích kiểm thử |
|---|---|---|---|
| 🏠 **Trang chủ Cổng Cuộc thi (Ảnh 1)** | [http://localhost:3001](http://localhost:3001) | [http://localhost:3002](http://localhost:3002) | Giao diện chuẩn Cổng Cuộc thi: 3 thẻ thống kê, khối Quảng cáo cuocthi.easupso.com trao bằng tốt nghiệp, các cuộc thi lớn đang diễn ra & Tin tức mới Cuộc Thi AI®. |
| ⭐ **Cuộc thi Trực tuyến & Đăng ký dự thi (Ảnh 2, 3, 4, 5)** | [http://localhost:3001/thi/phong-chong-te-nan-2026](http://localhost:3001/thi/phong-chong-te-nan-2026) | [http://localhost:3002/thi/phong-chong-te-nan-2026](http://localhost:3002/thi/phong-chong-te-nan-2026) | Giao diện chuẩn ảnh: Hero Banner, Marquee chữ chạy, Đồng hồ đếm ngược tích tắc, Nút THAM GIA, Modal Đăng ký dự thi (Ảnh 5), 3 thẻ Đối tượng/Nội dung/Hình thức, Cơ cấu giải thưởng và Bảng xếp hạng Top 3 Podium (Ảnh 4). |
| 📝 **Phòng thi Xã Ea Súp Mobile-First** | [http://localhost:3001/thi/tim-hieu-phap-luat-ea-sup-2026](http://localhost:3001/thi/tim-hieu-phap-luat-ea-sup-2026) | [http://localhost:3002/thi/tim-hieu-phap-luat-ea-sup-2026](http://localhost:3002/thi/tim-hieu-phap-luat-ea-sup-2026) | Kiểm thử đăng ký thí sinh, đồng hồ đếm ngược Server, chống lộ đáp án, tự lưu nháp 4G, cảnh báo chuyển tab, nộp bài & xem trích dẫn luật. |
| 🏛️ **Bảng Điều Khiển Ban Tổ Chức (Ảnh 1 & 2)** | [http://localhost:3001/admin](http://localhost:3001/admin) | [http://localhost:3002/admin](http://localhost:3002/admin) | Giao diện chuẩn ảnh mới: Menu bên trái (Trang chủ, Cuộc thi Trắc nghiệm, Cuộc thi Ảnh/Video Mới, Nút viền đứt Tạo mới, KHO NỘI DUNG: Đề thi, Thông báo BTC, Đơn vị), 2 nút Tạo mới/Hướng dẫn lớn và Banner Robot AI. |
| ⚙️ **5-Step Contest Wizard (Admin & Auth Gate)** | [http://localhost:3001/admin/tao-cuoc-thi](http://localhost:3001/admin/tao-cuoc-thi) | [http://localhost:3002/admin/tao-cuoc-thi](http://localhost:3002/admin/tao-cuoc-thi) | Cổng xác thực Ban Tổ Chức (Auth Gate): Chỉ khi đã đăng ký và đăng nhập mới vào được giao diện khởi tạo cuộc thi (Quy trình 5 bước). Kèm nút kiểm thử nhanh 1-Click quyền: Thường trực UB MTTQ Việt Nam xã Ea Súp. |
| 🏆 **Bảng xếp hạng & Kết quả** | [http://localhost:3001/ket-qua/phong-chong-te-nan-2026](http://localhost:3001/ket-qua/phong-chong-te-nan-2026) | [http://localhost:3002/ket-qua/phong-chong-te-nan-2026](http://localhost:3002/ket-qua/phong-chong-te-nan-2026) | Tra cứu điểm, độ chính xác %, thời gian làm bài, lọc theo ngày, tìm kiếm CCCD và theo từng đơn vị. |
| 📊 **Xuất Báo Cáo Excel (.xlsx)** | [http://localhost:3001/api/contests/phong-chong-te-nan-2026/export](http://localhost:3001/api/contests/phong-chong-te-nan-2026/export) | [http://localhost:3002/api/contests/phong-chong-te-nan-2026/export](http://localhost:3002/api/contests/phong-chong-te-nan-2026/export) | Tải trực tiếp file Excel xếp hạng chi tiết (.xlsx) phục vụ tổng kết khen thưởng. |
| 🤖 **API AI Soạn đề (Gemini)** | `POST http://localhost:3001/api/admin/ai-generate-questions` | — | Đọc file văn bản pháp luật (.pdf/.docx) sinh đề trắc nghiệm chuẩn cấu trúc. |
| 📢 **API Loa số An Nhiên (TTS)** | `POST http://localhost:3001/api/tts` | — | Chuẩn hóa các từ viết tắt hành chính (UBND, HĐND, UBMTTQ, DTTS, CCCD...). |

### Thông tin Thí sinh mẫu để thi thử nhanh:
- **Họ và tên**: Lê Hạnh (hoặc Y Blôk Niê, H'Lan Byă)
- **Số CCCD**: `066092001122`
- **Số điện thoại**: `0984112233`
- **Đơn vị dự thi**: Chọn `Buôn Ea Súp` hoặc bất kỳ thôn nào trong 20 thôn, buôn.

---

## 2. TỔNG QUAN DỰ ÁN & TIÊU CHUẨN KỸ THUẬT

### 2.1. Ngăn xếp Công nghệ (Tech Stack)
- **Framework**: Next.js 15.5+ (App Router, Server Actions, TypeScript strict mode).
- **Styling**: TailwindCSS 3.4 tuân thủ bộ quy chuẩn thiết kế **@hallmark** (Editorial / Administrative Vermilion, cấm triệt để gradient tím-xanh AI).
- **Cơ sở dữ liệu**: PostgreSQL 16 Alpine kết hợp Prisma ORM 6.4+. Có lớp Hybrid Data Store (`src/lib/store.ts`) hỗ trợ chạy offline lẫn kết nối database trực tiếp.
- **Trí tuệ nhân tạo (AI)**: Google Gemini API (`@google/generative-ai`) phân tích văn bản pháp luật (.pdf, .docx thông qua `pdf-parse` & `mammoth`) để tự động sinh đề thi trắc nghiệm kèm trích dẫn điều khoản luật.
- **Loa truyền thanh số "An Nhiên"**: Tích hợp module xử lý ngôn ngữ [src/utils/ttsNormalizer.ts](file:///d:/Antigravity/7.%20Cuocthi%20var/src/utils/ttsNormalizer.ts) đọc chuẩn xác danh xưng hành chính, hỗ trợ điều chỉnh tốc độ `1.0X`, `1.25X`, `1.5X`, `2.0X`.
- **Báo cáo & Thống kê**: Thư viện `xlsx` xuất file Excel bảng xếp hạng; component SVG Sparkline không phụ thuộc thư viện nặng.
- **Hạ tầng Docker**: Multi-stage `Dockerfile`, `docker-compose.yml` gồm 4 container (`web`, `db`, `nginx`, `dozzle`) kết nối qua mạng `internal_net` cô lập, volume lưu trữ lâu dài.

---

## 3. DANH SÁCH 20 THÔN, BUÔN & CÁC TỔ CHỨC ĐA MỤC TIÊU (MULTI-TENANT)

Hệ thống được thiết kế theo mô hình Multi-tenant phục vụ nhiều cơ quan và địa bàn xã Ea Súp:
1. **Khối cơ quan & đoàn thể**:
   - UBND xã Ea Súp
   - Đảng ủy xã Ea Súp
   - HĐND xã Ea Súp
   - Ủy ban MTTQ Việt Nam xã Ea Súp
   - Đoàn TNCS Hồ Chí Minh xã
   - Hội Liên hiệp Phụ nữ xã
   - Hội Nông dân xã
   - Hội Cựu chiến binh xã
   - Khối Trường học (THPT, THCS, Tiểu học)
2. **20 Thôn, Buôn chuẩn xã Ea Súp**:
   - Thôn 1 đến Thôn 10
   - Thôn Đoàn Kết, Thôn Quyết Thắng, Thôn Thanh Niên, Thôn Hợp Thành, Thôn Tân Lập
   - Buôn Ea Súp, Buôn A1, Buôn A2, Buôn B, Buôn C

---

## 4. BẢO MẬT PHÒNG THI & QUY TẮC SỐNG CÒN (@security-audit)

1. **Zero Answer Leakage (Chống lộ đáp án tuyệt đối)**:
   - Endpoint `GET` và `POST` `/api/contests/[slug]/start` khi nạp câu hỏi cho trình duyệt **cấm tuyệt đối** gửi trường `correctOptionIds` và `explanation`.
   - Đáp án đúng và trích dẫn điều khoản chỉ nằm an toàn trên Server. Thí sinh chỉ xem được lời giải thích sau khi đã nộp bài (`/api/contests/[slug]/submit`).
2. **Server-Side Timer & Anti-Cheat**:
   - Thời gian thi được tính từ timestamp `startedAt` do Server ghi nhận.
   - Khi nộp bài: `durationSeconds = Math.round((submittedAt - startedAt) / 1000)`. Chặn hoàn toàn việc chỉnh sửa đồng hồ thiết bị.
   - Trình duyệt bắt sự kiện `visibilitychange` để ghi nhận số lần chuyển tab (`tabSwitchCount`).
3. **LocalStorage Auto-Save**:
   - Tự động lưu phương án đã chọn vào LocalStorage theo mã `easup_draft_[contestId]_[cccd]`, giúp bà con không bị mất dữ liệu khi mạng 4G chập chờn hoặc reload trang.
4. **Cô lập CSDL trong Docker**:
   - Port 5432 của PostgreSQL **không mở ra ngoài Internet hay máy chủ Host**.
   - Mọi giao tiếp diễn ra bên trong mạng cầu nối nội bộ `internal_net`.

---

## 5. CẤU TRÚC THƯ MỤC DỰ ÁN

```
7. Cuocthi var/
├── AGENTS.md                  # Anchor file ngữ cảnh quy tắc, bảo mật & tiến độ
├── CONTEXT.md                 # Tệp lưu trữ ngữ cảnh & link kiểm thử chi tiết này
├── LOCAL_TEST.html            # Dashboard mở bằng trình duyệt để kiểm thử nhanh 1-click
├── docker-compose.yml         # 4 dịch vụ (web, db, nginx, dozzle)
├── Dockerfile                 # Multi-stage Docker build Next.js 15
├── .env.example               # Mẫu cấu hình Bitwarden ENV_CUOCTHI_EASUPSO
├── nginx/
│   └── nginx.conf             # Reverse Proxy cho cuocthi.easupso.com
├── prisma/
│   ├── schema.prisma          # PostgreSQL Schema 8 bảng
│   └── seed.ts                # Dữ liệu nạp sẵn 20 thôn buôn & cuộc thi mẫu
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── admin/ai-generate-questions/route.ts  # Gemini AI đọc PDF/DOCX
│   │   │   ├── contests/route.ts                     # CRUD cuộc thi
│   │   │   ├── contests/[slug]/route.ts              # Chi tiết cuộc thi
│   │   │   ├── contests/[slug]/start/route.ts        # Bắt đầu thi (Zero leakage)
│   │   │   ├── contests/[slug]/submit/route.ts       # Chấm điểm Server-side
│   │   │   ├── contests/[slug]/results/route.ts      # Thống kê Sparklines & BXH
│   │   │   ├── contests/[slug]/export/route.ts       # Xuất Excel .xlsx
│   │   │   ├── questions/bank/route.ts               # Kho ngân hàng câu hỏi
│   │   │   └── tts/route.ts                          # API giọng đọc An Nhiên
│   │   ├── admin/tao-cuoc-thi/page.tsx               # 5-Step Contest Wizard MyAloha
│   │   ├── thi/[slug]/page.tsx                       # Phòng thi Mobile-First
│   │   ├── ket-qua/[slug]/page.tsx                   # Bảng xếp hạng công khai
│   │   ├── layout.tsx                                # Header, Footer, SEO Meta
│   │   ├── page.tsx                                  # Trang chủ cổng cuộc thi
│   │   └── globals.css                               # Tokens Hallmark & 8 trạng thái
│   ├── components/
│   │   ├── Navbar.tsx                                # Thanh điều hướng hành chính
│   │   ├── Footer.tsx                                # Chân trang thông tin xã Ea Súp
│   │   ├── AudioPlayerAnNhien.tsx                    # Loa truyền thanh số (1x, 1.25x, 1.5x, 2x)
│   │   ├── SparklineChart.tsx                        # Biểu đồ sóng SVG 2 thẻ đỏ cam & xanh dương
│   │   └── FloatingActionBar.tsx                     # Thanh công cụ nổi 5 nút bên phải
│   ├── lib/
│   │   └── store.ts                                  # Data Store hợp nhất (Zero Leakage, Timer, CRUD)
│   └── utils/
│       └── ttsNormalizer.ts                          # Chuẩn hóa từ viết tắt hành chính xã Ea Súp
└── test-e2e.mjs               # Bộ kịch bản kiểm thử E2E tự động (Node.js)
```

---

## 6. HƯỚNG DẪN LỆNH VẬN HÀNH (COMMAND CHEATSHEET)

### Khi mở phiên làm việc mới:
1. **Khởi động môi trường phát triển**:
   ```powershell
   npm.cmd run dev
   ```
   (Truy cập cổng `http://localhost:3001` hoặc `http://localhost:3000`).

2. **Chạy kiểm thử tự động toàn hệ thống**:
   ```powershell
   node test-e2e.mjs
   ```

3. **Kiểm tra biên dịch và build mã nguồn**:
   ```powershell
   npm.cmd run build
   ```

4. **Đồng bộ Schema cơ sở dữ liệu Prisma**:
   ```powershell
   npx.cmd prisma generate
   npx.cmd prisma db push
   ```

5. **Chạy qua Docker trong môi trường sản xuất**:
   ```bash
   docker compose up -d --build
   ```

---

## 7. KẾ HOẠCH NÂNG CẤP TIẾP THEO (ROADMAP)
- [ ] Tích hợp dịch vụ SMS Brandname hoặc tin nhắn Zalo ZNS tự động gửi thông báo kết quả thi đến số điện thoại thí sinh.
- [ ] Bổ sung chứng nhận điện tử (Certificate PDF) có chữ ký số hoặc mã QR xác thực kết quả thi để thí sinh tải về chia sẻ mạng xã hội.
- [ ] Phân quyền tài khoản SSO nội bộ qua hệ sinh thái `easupso.com`.
