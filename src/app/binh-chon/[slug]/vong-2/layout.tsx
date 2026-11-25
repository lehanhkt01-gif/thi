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
    ? `20 tác phẩm vào vòng 2 | ${contest.title}`
    : "20 tác phẩm vào vòng 2 | Cuộc thi trực tuyến Xã Ea Súp";
  const description = contest?.title
    ? `Danh sách 20 tác phẩm vào vòng 2 có số lượt bình chọn thực tế cao nhất - ${contest.title} (${contest.organizerName || "Xã Ea Súp"})`
    : "Danh sách 20 tác phẩm vào vòng 2 có số lượt bình chọn thực tế cao nhất tại Cổng số Xã Ea Súp (thi.easupso.com)";

  const ogImageUrl = `https://thi.easupso.com/api/og-banner/${encodeURIComponent(decodedSlug)}`;
  const pageUrl = `https://thi.easupso.com/binh-chon/${encodeURIComponent(decodedSlug)}/vong-2`;

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
          alt: title,
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

export default function Round2Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
