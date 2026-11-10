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
  return `/api/og-banner/${safeSlug}`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug || "");
  const contest =
    store.getContestBySlug(decodedSlug) ||
    store.getContestById(decodedSlug) ||
    store.getContestByAnySlug(decodedSlug);

  const title = contest?.title
    ? `${contest.title} | Cuộc thi trực tuyến Xã Ea Súp`
    : "Cuộc thi trực tuyến Xã Ea Súp | thi.easupso.com";
  const description =
    contest?.shortDesc ||
    (contest?.organizerName
      ? `Đơn vị tổ chức: ${contest.organizerName} - Tham gia dự thi trực tuyến tại thi.easupso.com`
      : "Cổng thi trắc nghiệm trực tuyến tìm hiểu pháp luật, nghị quyết và chuyển đổi số Xã Ea Súp.");

  const ogImageUrl = resolveOgBannerUrl(decodedSlug, contest?.bannerUrl);

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://thi.easupso.com/thi/${encodeURIComponent(decodedSlug)}`,
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

export default function ExamContestLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
