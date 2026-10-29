import type { Metadata, Viewport } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#DC2626",
};

export const metadata: Metadata = {
  title: "Hệ thống Thi Trắc nghiệm & Tuyên truyền Pháp luật Xã Ea Súp | cuocthi.easupso.com",
  description:
    "Cổng thông tin và tổ chức các cuộc thi trắc nghiệm tìm hiểu pháp luật, nghị quyết, chuyển đổi số và lịch sử cho cán bộ và nhân dân 20 thôn buôn xã Ea Súp, huyện Ea Súp, tỉnh Đắk Lắk.",
  keywords: [
    "Ea Súp",
    "thi trắc nghiệm trực tuyến",
    "cuocthi.easupso.com",
    "easupso",
    "tìm hiểu pháp luật",
    "Đắk Lắk",
    "chuyển đổi số Ea Súp",
  ],
  authors: [{ name: "UBND Xã Ea Súp - Hệ sinh thái easupso.com" }],
  openGraph: {
    title: "Cổng Thi Trắc nghiệm & Tuyên truyền Trực tuyến Xã Ea Súp",
    description: "Nền tảng thi trực tuyến chính thức phục vụ nhân dân 20 thôn, buôn và cán bộ đoàn thể xã Ea Súp.",
    url: "https://cuocthi.easupso.com",
    siteName: "cuocthi.easupso.com",
    locale: "vi_VN",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body className="min-h-screen flex flex-col bg-[#F8FAFC] text-[#0F172A] antialiased">
        <Navbar />
        <main className="flex-1 w-full">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
