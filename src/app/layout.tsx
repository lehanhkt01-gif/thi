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
  metadataBase: new URL("https://thi.easupso.com"),
  title: "Cuộc thi trực tuyến Xã Ea Súp | thi.easupso.com",
  description:
    "Cổng thông tin và tổ chức các cuộc thi trắc nghiệm tìm hiểu pháp luật, nghị quyết, chuyển đổi số và lịch sử cho cán bộ và nhân dân 20 thôn buôn xã Ea Súp, huyện Ea Súp, tỉnh Đắk Lắk.",
  keywords: [
    "Ea Súp",
    "thi trực tuyến",
    "thi trắc nghiệm",
    "thi.easupso.com",
    "cuocthi.easupso.com",
    "easupso",
    "tìm hiểu pháp luật",
    "Đắk Lắk",
    "chuyển đổi số Ea Súp",
  ],
  authors: [{ name: "UBND Xã Ea Súp - Hệ sinh thái easupso.com" }],
  icons: {
    icon: [
      { url: "/logo.png", type: "image/png" },
      { url: "/favicon.ico" },
    ],
    apple: "/logo.png",
    shortcut: "/logo.png",
  },
  openGraph: {
    title: "Cuộc thi trực tuyến Xã Ea Súp | thi.easupso.com",
    description: "Tri thức - Kết nối - Lan tỏa - Vì một Ea Súp phát triển",
    url: "https://thi.easupso.com",
    siteName: "thi.easupso.com",
    images: [
      {
        url: "/banner-easup.png",
        width: 1200,
        height: 630,
        alt: "Cuộc thi trực tuyến Xã Ea Súp",
      },
    ],
    locale: "vi_VN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Cuộc thi trực tuyến Xã Ea Súp | thi.easupso.com",
    description: "Tri thức - Kết nối - Lan tỏa - Vì một Ea Súp phát triển",
    images: ["/banner-easup.png"],
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
