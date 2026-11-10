import type { Metadata } from "next";
import { store } from "@/lib/store";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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

  const ogImageUrl = `/api/og-banner/${encodeURIComponent(decodedSlug)}`;
  const pageUrl = `https://thi.easupso.com/binh-chon/${encodeURIComponent(decodedSlug)}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: pageUrl,
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
