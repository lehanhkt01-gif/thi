# AGENTS.md - HỆ THỐNG THI TRẮC NGHIỆM & TUYÊN TRUYỀN TRỰC TUYẾN ĐA TỔ CHỨC
**Tên miền chính thức**: `cuocthi.easupso.com` (Thuộc Hệ sinh thái chuyển đổi số easupso.com)  
**Địa bàn triển khai**: Xã Ea Súp, Huyện Ea Súp, Tỉnh Đắk Lắk  
**Tiêu chuẩn thiết kế**: @hallmark (Anti-AI-Slop, Editorial / Administrative Vermilion), @security-audit (Cloudflare Zero-Trust 6 pha), @agent-skills (Addy Osmani Spec-Driven)

---

## 🔗 LIÊN KẾT LOCAL KIỂM THỬ TỨC THÌ (LOCAL TESTING)
*Máy chủ phát triển đang chạy tại `http://localhost:3001` (dự phòng cổng `3002` và `3000`)*:
- 🏠 **Trang chủ Cổng Cuộc thi (Ảnh 1)**: [http://localhost:3001](http://localhost:3001) *(hoặc :3000)*
- 🌾 **Cuộc thi Hội Nông dân Xã Ea Súp (Ảnh 1 chuẩn)**: [http://localhost:3001/thi/cuoc-thi-tim-hieu-nghi-quyet-hoi-nong-dan-xa-ea-sup](http://localhost:3001/thi/cuoc-thi-tim-hieu-nghi-quyet-hoi-nong-dan-xa-ea-sup)
- 📝 **Phòng thi Xã Ea Súp Mobile-First**: [http://localhost:3001/thi/tim-hieu-phap-luat-ea-sup-2026](http://localhost:3001/thi/tim-hieu-phap-luat-ea-sup-2026)
- ⚙️ **Phân hệ Quản trị 5-Step Contest Wizard**: [http://localhost:3001/admin/tao-cuoc-thi](http://localhost:3001/admin/tao-cuoc-thi)
- 🚀 **Trực tiếp Bước 5 Xuất bản & Thống kê (?step=5)**: [http://localhost:3001/admin/tao-cuoc-thi?step=5](http://localhost:3001/admin/tao-cuoc-thi?step=5)
- 📸 **Quản trị Cuộc thi Ảnh / Video (Ảnh 1 & 2)**: [http://localhost:3001/admin](http://localhost:3001/admin)
- 🌟 **Trang Bình chọn Ảnh / Video & Flip Clock (Ảnh 3)**: [http://localhost:3001/binh-chon/cuoc-thi-binh-chon-moi](http://localhost:3001/binh-chon/cuoc-thi-binh-chon-moi)
- 🏆 **Bảng xếp hạng Hội Nông Dân**: [http://localhost:3001/ket-qua/cuoc-thi-tim-hieu-nghi-quyet-hoi-nong-dan-xa-ea-sup](http://localhost:3001/ket-qua/cuoc-thi-tim-hieu-nghi-quyet-hoi-nong-dan-xa-ea-sup)
- 📊 **Tải file Excel kết quả (.xlsx)**: [http://localhost:3001/api/contests/cuoc-thi-tim-hieu-nghi-quyet-hoi-nong-dan-xa-ea-sup/export](http://localhost:3001/api/contests/cuoc-thi-tim-hieu-nghi-quyet-hoi-nong-dan-xa-ea-sup/export)
- 📄 **Tài liệu ngữ cảnh đầy đủ**: [CONTEXT.md](file:///d:/Antigravity/7.%20Cuocthi%20var/CONTEXT.md)
- 🖥️ **Bảng điều khiển kiểm thử 1-click**: [LOCAL_TEST.html](file:///d:/Antigravity/7.%20Cuocthi%20var/LOCAL_TEST.html)


---

## 1. KIẾN TRÚC TỔNG THỂ & MÔ HÌNH ĐA TỔ CHỨC (MULTI-TENANT)

### 1.1. Các Khối Tổ Chức (Tenants)
- **Đảng ủy xã Ea Súp**: Nghị quyết, công tác xây dựng Đảng, lịch sử Đảng bộ.
- **Hội đồng Nhân dân (HĐND) xã**: Hoạt động giám sát, văn bản pháp luật, quyền công dân.
- **Ủy ban Nhân dân (UBND) xã**: Cải cách hành chính, chuyển đổi số, pháp luật chuyên ngành.
- **Ủy ban Mặt trận Tổ quốc Việt Nam xã**: Khối đại đoàn kết, giám sát phản biện, tuyên truyền chính sách dân tộc - tôn giáo.
- **Hội Cựu chiến binh (CCB)**, **Hội Nông dân (ND)**, **Hội Phụ nữ (PN)**, **Đoàn Thanh niên (TN)**.
- **Khối Giáo dục**: Trường THPT, THCS, Tiểu học trên địa bàn.
- **20 Thôn, Buôn** thuộc xã Ea Súp.

### 1.2. Danh sách chuẩn 20 Thôn, Buôn Xã Ea Súp
1. Thôn 1
2. Thôn 2
3. Thôn 3
4. Thôn 4
5. Thôn 5
6. Thôn 6
7. Thôn 7
8. Thôn 8
9. Thôn 9
10. Thôn 10
11. Thôn Đoàn Kết
12. Thôn Quyết Thắng
13. Thôn Thanh Niên
14. Thôn Hợp Thành
15. Thôn Tân Lập
16. Buôn Ea Súp
17. Buôn A1
18. Buôn A2
19. Buôn B
20. Buôn C

---

## 2. KỶ LUẬT BẢO MẬT PHÒNG THI & ZERO-TRUST (@security-audit)

1. **Zero Answer Leakage (Chống lộ đáp án tuyệt đối)**:
   - Endpoint `GET /api/contests/[slug]/start` khi nạp đề thi cho trình duyệt thí sinh: **CẤM TUYỆT ĐỐI** trả về `correctOptionIds` hoặc `explanation`.
   - Đáp án đúng và giải thích chỉ nằm an toàn trên Server.
   - Thí sinh nộp bài qua `POST /api/contests/[slug]/submit`, Server tính điểm, ghi log rồi mới trả kết quả.

2. **Server-Side Timer & Anti-Cheat**:
   - Ghi nhận `startedAt` chuẩn xác tại Server khi bấm "Bắt đầu thi".
   - Khi nộp bài: `durationSeconds = Math.round((submittedAt - startedAt) / 1000)`. Chặn hack thời gian phía client.
   - Bắt sự kiện `document.addEventListener("visibilitychange")` để đếm số lần chuyển tab (`tabSwitchCount`).

3. **LocalStorage Auto-Save (Lưu nháp mạng 4G chập chờn)**:
   - Tự động lưu đáp án đã chọn vào LocalStorage theo key `easup_draft_[contestId]_[cccd]`.
   - Nếu điện thoại mất sóng 4G hoặc vô tình reload trang, hệ thống tự khôi phục phiên thi mà không mất dữ liệu.

4. **Phân quyền ABAC + RBAC (Chống IDOR)**:
   - `SUPER_ADMIN` & `EXECUTIVE`: Xem và quản lý mọi cuộc thi trong toàn xã.
   - `ORG_ADMIN`: Chỉ quản lý các cuộc thi thuộc `organizationId` của đơn vị mình.
   - `VILLAGE_LEADER`: Xem danh sách và thống kê số liệu của thôn/buôn phụ trách.

---

## 3. QUY CÁCH GIAO DIỆN CHỐNG RẬP KHUÔN (@hallmark STANDARD)

- **Bảng màu**: Nền sáng thanh lịch `#F8FAFC`, Điểm nhấn Đỏ son hành chính `#DC2626` (Bước 1-5 Wizard phong cách MyAloha), Xanh thông tin `#0284C7`, Văn bản đậm `#0F172A`.
- **Cấm hoàn toàn**: Gradient tím-xanh AI slop rập khuôn, chữ tiêu đề in nghiêng, số liệu ảo không có thực.
- **Mobile-First**: `overflow-x: clip`, kích thước nút tối ưu ngón cái điện thoại (320px - 414px) khi mở trực tiếp từ liên kết Zalo.
- **8 Trạng thái linh kiện**: `default`, `hover`, `:focus-visible`, `:active`, `disabled`, `loading`, `error`, `success`.
- **Thanh công cụ nổi Quick-Action**: Cài đặt đề, Xem mobile, Bảo mật cuộc thi, Chia sẻ Link/QR, Thống kê nhanh.

---

## 4. LOA TRUYỀN THANH SỐ "AN NHIÊN" (DIGITAL TTS)

- Chuẩn hóa văn bản hành chính: `UBND` -> "Ủy ban nhân dân", `HĐND` -> "Hội đồng nhân dân", `UBMTTQ` -> "Ủy ban Mặt trận Tổ quốc", `CCCD` -> "Căn cước công dân", `DTTS` -> "Dân tộc thiểu số".
- Bộ đọc âm thanh: Ưu tiên Vbee AI Voice -> Web Speech API / TTS tích hợp.
- Hỗ trợ tốc độ: `1.0X`, `1.25X`, `1.5X`, `2.0X` phục vụ bà con đồng bào DTTS và người cao tuổi.

---

## 5. BẢNG TRẠNG THÁI TIẾN ĐỘ TRIỂN KHAI (TASK TRACKER)

| Hạng mục | Trạng thái | Ghi chú kỹ thuật |
|---|:---:|---|
| Khởi tạo Repo & Package.json | [x] | Next.js 15, TailwindCSS, Prisma, Lucide, XLSX |
| Cấu hình Docker Compose & Dockerfile | [x] | 4 containers: web, db, nginx, dozzle; persistent volumes |
| Thiết kế Schema Prisma & Seed Data | [x] | 20 thôn buôn, các tổ chức đoàn thể, 1 cuộc thi mẫu |
| API Backend: Bắt đầu & Chấm thi Server-side | [x] | Zero Answer Leakage, Server Timer, Anti-cheat |
| API Backend: AI Soạn đề từ PDF/DOCX | [x] | Tích hợp Google Gemini API + trích dẫn điều khoản |
| API Backend: Kho câu hỏi & Xuất Excel | [x] | Question Bank, thư viện `xlsx` xuất báo cáo xếp hạng |
| Giao diện Cổng Cuộc thi (Trang chủ) | [x] | Danh sách cuộc thi đang mở/sắp diễn ra, banner hành chính |
| Giao diện Phòng thi Mobile-First | [x] | Auto-save 4G, cảnh báo chuyển tab, âm thanh giọng đọc |
| Giao diện 5-Step Contest Wizard MyAloha | [x] | 5 bước chuẩn mực + Floating Quick-Action Bar |
| Báo cáo Thống kê & Bảng xếp hạng | [x] | 2 Sparkline Charts, bộ lọc ngày, CCCD, đơn vị, xuất Excel |
| Phân quyền Đăng nhập Admin & Người dùng | [x] | RBAC: Admin toàn quyền xét duyệt/phân quyền; User tạo thi/xuất Excel |
| Đóng gói & Kiểm tra hoàn tất | [x] | Chuẩn hóa quy trình vận hành cuocthi.easupso.com |

---

## 6. KỶ LUẬT TRIỂN KHAI & ĐỒNG BỘ MÃ NGUỒN (DEPLOYMENT DISCIPLINE)

1. **Quy tắc Vàng về Đồng bộ Git (Push trước - Pull sau)**:
   - **BẮT BUỘC**: Bất kỳ khi nào thực hiện chỉnh sửa, tính năng hoặc sửa lỗi ở local, Agent **PHẢI thực hiện commit và `git push origin main` lên GitHub (`https://github.com/lehanhkt01-gif/thi.git`) TRƯỚC**.
   - Tuyệt đối KHÔNG BAO GIỜ hướng dẫn người dùng chạy lệnh `git pull` trên VPS khi mã nguồn mới chưa được push lên GitHub thành công.

2. **Môi trường & Thông số triển khai**:
   - **Repository GitHub**: `https://github.com/lehanhkt01-gif/thi.git` (Nhánh: `main`)
   - **Thư mục VPS chính thức**: `/var/www/thi` (CasaOS / Ubuntu Server)
   - **Tên miền hoạt động**: `https://thi.easupso.com`
   - **Cổng chuyển tiếp (Proxy Host Port)**: `8077` (Ánh xạ `8077:3000` qua Docker Compose)
   - **Dữ liệu lưu trữ bền vững (Persistent Storage)**: Luôn mount thư mục `./data:/app/data` và `./public/uploads:/app/public/uploads` để không mất dữ liệu thi cử.
   - **Lệnh cập nhật & Rebuild chuẩn trên VPS**: Do Next.js chạy đóng gói container production (`standalone`), khi kéo code mới phải dùng cờ `--build`:
     ```bash
     cd /var/www/thi && git pull origin main && docker compose up -d --build web
     ```

---

## 7. QUY ƯỚC MODULE BẢNG XẾP HẠNG ĐA CHIỀU (LEADERBOARD MATRIX)

### 7.1. Ma trận 2 Bộ lọc cốt lõi
- **Bộ lọc 1 (`scope`)**: `individual` (Cá nhân) | `organization` (Tổ chức / Đơn vị - 20 thôn buôn hoặc các đơn vị con của cuộc thi).
- **Bộ lọc 2 (`period`)**: `week` (Theo tuần: Thứ Hai 00:00:00 - Chủ Nhật 23:59:59.999 UTC+7) | `contest` (Toàn cuộc thi).
- **Bộ lọc Đơn vị con (`unitName`)**: **Đồng bộ 2 chiều** với các tổ chức/đơn vị con mà người dùng cấu hình ở Bước 3 khi tạo cuộc thi (`contest.units`).

### 7.2. Xếp hạng Cá nhân (`scope = 'individual'`)
- **Deduplication (Best Attempt Only)**: Mỗi thí sinh (định danh duy nhất qua `participantId` hoặc `cccd`/`phone`) **CHỈ XUẤT HIỆN 01 LẦN DUY NHẤT** trên bảng xếp hạng với lượt thi có thành tích tốt nhất trong kỳ.
- **5-Tier Tie-Breaking Cascade**:
  1. `score` DESC (hoặc `correctCount` DESC, `accuracyPercent` DESC): Điểm cao nhất xếp trên.
  2. `durationSeconds` ASC: Thời gian làm bài ngắn hơn (tính bằng giây) xếp trên.
  3. `tieBreakerDiff` ASC: Độ lệch câu hỏi phụ nhỏ hơn xếp trên (`|tieBreakerPrediction - actualParticipants|`).
  4. `attemptNumber` ASC: Đạt điểm số đó ở lượt thi thứ ít hơn (lần 1 < lần 2 < lần 3) xếp trên.
  5. `submittedAt` ASC: Nộp bài sớm hơn theo giờ Server xếp trên.
- **Privacy Masking**: Public UI che 3 số giữa của Số điện thoại (`0943***770`) và che CCCD (`066******789`).

### 7.3. Xếp hạng Tổ chức / Đơn vị (`scope = 'organization'`)
- **Anti-Spam Filter**: Lượt thi hợp lệ khi `submittedAt IS NOT NULL` và `durationSeconds >= 10`.
- **Chỉ số thống kê mỗi đơn vị**:
  - `uniqueParticipants`: Số lượng thí sinh thực tế tham gia (`COUNT(DISTINCT)`).
  - `totalAttempts`: Tổng số lượt thi hợp lệ của đơn vị trong kỳ.
  - `qualifiedParticipants`: Số thí sinh đạt từ `>= 50%` số điểm trở lên.
  - `avgBestScore`: Điểm trung bình cộng tính trên lượt thi tốt nhất của các thí sinh trong đơn vị.
  - `avgDurationSeconds`: Thời gian trung bình của các lượt thi tốt nhất.
  - `completionRate`: Tỷ lệ đạt (`qualifiedParticipants / uniqueParticipants * 100%`).
- **Organization Tie-Breaking**:
  1. `uniqueParticipants` DESC
  2. `qualifiedParticipants` DESC
  3. `avgBestScore` DESC
  4. `totalAttempts` DESC
  5. `avgDurationSeconds` ASC
- **Hiển thị đầy đủ đơn vị**: Danh sách tổ chức / thôn buôn hiển thị đầy đủ, đơn vị chưa có bài thi hiển thị `0` ở cuối bảng để BTC dễ đôn đốc.

---

## 8. QUY ƯỚC CẤU TRÚC ĐƠN VỊ PHÂN CẤP 3 TẦNG (3-TIER HIERARCHICAL UNITS)

### 8.1. Mô hình 3 Cấp
- **Cấp 1 (Cơ quan / Tổ chức cấp trên / Ban Tổ Chức)**:
  - Khái niệm: Cơ quan quản trị hoặc chủ quản cuộc thi (`contest.unitGroupName`).
  - Ví dụ: *Đoàn TNCS Hồ Chí Minh Xã Ea Súp*, *UBND Xã Ea Súp*, *Phòng Giáo dục & Đào tạo*.
- **Cấp 2 (Đơn vị con / Trường học / Chi đoàn cơ sở)**:
  - Khái niệm: Các đơn vị cấp cơ sở trực thuộc Cấp 1 (`contest.units[].name`).
  - Ví dụ: *Trường THPT Ea Súp*, *Trường THCS Lê Hồng Phong*, *Chi đoàn Thôn 1*, *Chi đoàn Công an xã*.
- **Cấp 3 (Đơn vị trực thuộc / Chi đoàn con / Lớp học)**:
  - Khái niệm: Các đơn vị trực thuộc bên trong đơn vị Cấp 2 (`contest.units[].subUnits[]`).
  - Ví dụ: Trong *Trường THPT Ea Súp* có *Lớp 10A1*, *Lớp 10A2*, *Lớp 11A1*, *Lớp 12A1*...; trong *Chi đoàn Thôn 1* có *Tổ 1*, *Tổ 2*...

### 8.2. Nghiệp vụ Quản trị & Thí sinh
- **Quản trị Bước 3 Wizard**:
  - Hỗ trợ thêm/xóa nhanh đơn vị Cấp 2.
  - Mỗi đơn vị Cấp 2 có nút `+ Cấp 3` để mở modal chuyên dụng quản lý, thêm từng lớp hoặc dán nhiều lớp.
  - Hỗ trợ cú pháp nhập nhanh thông minh: `Trường THPT Ea Súp: Lớp 10A1, Lớp 10A2, Lớp 11A1` -> tự động phân tách Cấp 2 và Cấp 3.
  - Cung cấp sẵn các mẫu 3 cấp chuẩn: *Đoàn xã - Trường THPT*, *Khối Trường học - Khối Lớp*.
- **Phòng thi (Thí sinh đăng ký)**:
  - Thí sinh chọn Đơn vị (Cấp 2). Nếu đơn vị đó có cấu hình Cấp 3, hệ thống tự động hiển thị thêm dropdown chọn Lớp/Chi đoàn trực thuộc (Cấp 3).
  - Kết quả và bài thi lưu trữ cả `unitName` (Cấp 2) và `subUnitName` (Cấp 3).
- **Bảng xếp hạng & Bộ lọc (Ảnh 1 & 2)**:
  - Bộ lọc Dropdown đơn vị hiển thị phân cấp 3 tầng với thụt dòng `↳` trực quan.
  - Cho phép xem kết quả chung của toàn trường hoặc lọc chi tiết theo từng lớp con.

---

## 9. QUY ƯỚC LINK RÚT GỌN TÙY CHỈNH & MÃ QR TUYÊN TRUYỀN (CUSTOM SHORTLINK & QR)

### 9.1. Định danh & Cơ sở dữ liệu
- Trường `customSlug` / `custom_slug`: Chuỗi duy nhất, không dấu tiếng Việt, viết liền có gạch nối (Ví dụ: `dangbo-2026`, `phapluat`). Độ dài 2 - 50 ký tự.
- Trường `clickCount` / `click_count`: Biến đếm số lượt click chuyển tiếp qua link rút gọn để đo lường hiệu quả truyền thông.

### 9.2. Logic Chuyển hướng 302
- Route chuyển tiếp: `/r/[slug]` nhận diện `customSlug` hoặc `slug` gốc hoặc `id` cuộc thi.
- Tự động tăng `clickCount` lên 1 và thực hiện HTTP 302 chuyển hướng về `/thi/[slug]`.

### 9.3. Giao diện Quản trị & In ấn
- Nút `[ 🔗 Tùy chỉnh link ]`: Modal kiểm tra realtime trùng lặp, xem trước URL `https://thi.easupso.com/r/{slug}`.
- Nút `[ 📋 Sao chép ]`: Copy 1-chạm vào clipboard kèm toast.
- Nút `[ 📱 Tạo mã QR ]`: Sử dụng thư viện `qrcode`, hỗ trợ xem trước và xuất ảnh PNG độ phân giải cao (1000x1280px) có sẵn tiêu đề, khung viền hành chính phục vụ in ấn tờ rơi tại 20 thôn buôn.


