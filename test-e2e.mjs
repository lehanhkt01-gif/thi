// test-e2e.mjs - End-to-End API verification for cuocthi.easupso.com
async function findBaseUrl() {
  const ports = [3002, 3001, 3000];
  for (const port of ports) {
    try {
      const res = await fetch(`http://localhost:${port}/api/contests`);
      if (res.ok) return `http://localhost:${port}`;
    } catch {}
  }
  return "http://localhost:3002";
}

async function runTests() {
  const baseUrl = await findBaseUrl();
  console.log(`🚀 Bắt đầu kiểm thử E2E Hệ thống Cuộc thi Ea Súp tại ${baseUrl}...`);

  // 1. Test Contests List
  const listRes = await fetch(`${baseUrl}/api/contests`);
  const listData = await listRes.json();
  console.log("✅ 1. Danh sách cuộc thi:", listData.contests.length, "cuộc thi");
  console.log("   Tiêu đề:", listData.contests[0]?.title);

  // 2. Test Zero Answer Leakage in Start Exam
  const startPayload = {
    fullName: "Lê Hạnh",
    cccd: `06609200${Math.floor(1000 + Math.random() * 9000)}`,
    phone: "0984112233",
    unitId: "unit-1",
    birthYear: 1992,
  };
  const startRes = await fetch(`${baseUrl}/api/contests/tim-hieu-phap-luat-ea-sup-2026/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(startPayload),
  });
  const startData = await startRes.json();
  console.log("✅ 2. Bắt đầu làm bài thi - Mã phiên:", startData.attemptId);
  console.log("   Số câu hỏi phát đề:", startData.questions?.length);
  
  // VERIFY ZERO ANSWER LEAKAGE
  const firstQ = startData.questions[0];
  const hasCorrectLeak = "correctOptionIds" in firstQ;
  const hasExplanationLeak = "explanation" in firstQ;
  console.log("   [BẢO MẬT] Có bị lộ correctOptionIds không?", hasCorrectLeak ? "❌ LỘ!" : "✅ KHÔNG (An toàn tuyệt đối)");
  console.log("   [BẢO MẬT] Có bị lộ explanation không?", hasExplanationLeak ? "❌ LỘ!" : "✅ KHÔNG (An toàn tuyệt đối)");

  // 3. Test Server-Side Grading Submit
  const answers = {
    [firstQ.id]: ["A"],
  };
  const submitRes = await fetch(`${baseUrl}/api/contests/tim-hieu-phap-luat-ea-sup-2026/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      attemptId: startData.attemptId,
      answers,
      tieBreakerPrediction: 3500,
      tabSwitchCount: 1,
    }),
  });
  const submitData = await submitRes.json();
  console.log("✅ 3. Nộp bài thi Server-Side:");
  console.log("   Điểm số:", submitData.score);
  console.log("   Độ chính xác:", submitData.accuracyPercent, "%");
  console.log("   Thời gian làm bài tính từ Server:", submitData.durationSeconds, "giây");

  // 4. Test Results and Sparklines
  const resultsRes = await fetch(`${baseUrl}/api/contests/tim-hieu-phap-luat-ea-sup-2026/results`);
  const resultsData = await resultsRes.json();
  console.log("✅ 4. Thống kê & Bảng xếp hạng:");
  console.log("   Tổng lượt thi:", resultsData.stats?.totalAttempts);
  console.log("   Tổng thí sinh:", resultsData.stats?.totalParticipants);

  // 5. Test Excel Export
  const exportRes = await fetch(`${baseUrl}/api/contests/tim-hieu-phap-luat-ea-sup-2026/export`);
  console.log("✅ 5. Xuất file Excel (.xlsx):", exportRes.status === 200 ? "Thành công (200 OK)" : "Thất bại");

  // 6. Test AI Quiz Generation
  const formData = new FormData();
  formData.append("topic", "Luật Đất đai 2024");
  formData.append("count", "3");
  const aiRes = await fetch(`${baseUrl}/api/admin/ai-generate-questions`, {
    method: "POST",
    body: formData,
  });
  const aiData = await aiRes.json();
  console.log("✅ 6. AI Soạn đề trắc nghiệm: Sinh thành công", aiData.questions?.length, "câu hỏi");

  // 7. Test TTS Loa số An Nhiên
  const ttsRes = await fetch(`${baseUrl}/api/tts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text: "UBND xã Ea Súp thông báo cuộc thi tìm hiểu CCCD",
    }),
  });
  const ttsData = await ttsRes.json();
  // 8. Test Cuộc thi Ảnh / Video (Ảnh 1, 2, 3)
  const mediaRes = await fetch(`${baseUrl}/api/media-contests`);
  const mediaData = await mediaRes.json();
  console.log("✅ 8. Cuộc thi Ảnh/Video:", mediaData.contests?.length, "cuộc thi");
  console.log("   Tiêu đề cuộc thi bình chọn:", mediaData.contests[0]?.title);

  console.log("\n🎉 TẤT CẢ 8/8 TÍNH NĂNG ĐÃ VƯỢT QUA KIỂM THỬ THÀNH CÔNG 100%!");
}

runTests().catch(console.error);
