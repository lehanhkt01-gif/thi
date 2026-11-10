import type { Metadata } from "next";
import { store } from "@/lib/store";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function resolveOgBannerUrl(slug: string, bannerUrl?: string): string {
  const safeSlug = encodeURIComponent(slug);
  if (!bannerUrl || bannerUrl.startsWith("data:")) {
    return `/api/og-banner/${safeSlug}`;
  }
  if (bannerUrl.startsWith("http://") || bannerUrl.startsWith("https://")) {
    return bannerUrl;
  }
  // Sử dụng API og-banner để đảm bảo mọi ảnh trong /uploads hoặc /storage đều trả về 200 OK chuẩn xác cho Zalo/Facebook
  return `/api/og-banner/${safeSlug}`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug || "");
  const contest = store.getMediaContestBySlug(decodedSlug);

  const title = contest?.title
    ? `${contest.title} | Cuộc thi Ảnh đẹp Xã Ea Súp`
    : "Cuộc thi Ảnh đẹp trực tuyến Xã Ea Súp | thi.easupso.com";
  const description =
    contest?.description ||
    (contest?.organizerName
      ? `Ban Tổ Chức: ${contest.organizerName} - Tham gia gửi tác phẩm và bình chọn trực tuyến tại thi.easupso.com`
      : "Tham gia gửi tác phẩm và bình chọn trực tuyến tại Cổng số Xã Ea Súp (thi.easupso.com)");

  const ogImageUrl = resolveOgBannerUrl(decodedSlug, contest?.bannerUrl);

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://thi.easupso.com/binh-chon/${encodeURIComponent(decodedSlug)}`,
      siteName: "thi.easupso.com",
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: contest?.title || "Ảnh bìa cuộc thi",
        },
      ],
      locale: "vi_VN",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImageUrl],
    },
  };
}

export default function MediaContestLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
