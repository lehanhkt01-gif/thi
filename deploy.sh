#!/bin/bash
# =====================================================================
# SCRIPT DEPLOY HỆ THỐNG THI TRẮC NGHIỆM XÃ EA SÚP (thi.easupso.com)
# Thư mục triển khai trên VPS: /var/www/thi
# Port Forward: 8077
# =====================================================================

set -e

echo "🚀 [1/4] Đang chuyển vào thư mục dự án /var/www/thi..."
cd /var/www/thi

echo "📥 [2/4] Đang cập nhật mã nguồn mới nhất từ GitHub..."
git pull origin main

echo "📁 [3/4] Kiểm tra thư mục dữ liệu bền vững (data & uploads)..."
mkdir -p data public/uploads storage/tts storage/uploads
chmod -R 777 data public/uploads storage

echo "🐳 [4/4] Khởi động hệ thống với Docker Compose trên cổng 8077..."
docker compose down || true
docker compose up -d --build

echo ""
echo "====================================================================="
echo "✅ Triển khai hoàn tất!"
echo "🌐 Ứng dụng đang chạy tại: http://192.168.200.193:8077"
echo "🔒 Tên miền chính thức: https://thi.easupso.com"
echo "====================================================================="
