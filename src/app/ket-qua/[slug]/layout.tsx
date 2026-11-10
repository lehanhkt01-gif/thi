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
  const contest =
    store.getContestBySlug(decodedSlug) ||
    store.getContestById(decodedSlug) ||
    store.getContestByAnySlug(decodedSlug);

  const title = contest?.title
    ? `Bảng xếp hạng: ${contest.title} | thi.easupso.com`
    : "Bảng xếp hạng Cuộc thi trực tuyến Xã Ea Súp | thi.easupso.com";
  const description =
    contest?.shortDesc ||
    "Tra cứu kết quả và bảng xếp hạng trực tuyến Cổng Cuộc thi Xã Ea Súp.";
  const ogImageUrl = `/api/og-banner/${encodeURIComponent(decodedSlug)}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://thi.easupso.com/ket-qua/${encodeURIComponent(decodedSlug)}`,
      siteName: "thi.easupso.com",
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: contest?.title || "Bảng xếp hạng cuộc thi",
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

export default function ContestResultsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
