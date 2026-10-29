import type { Metadata } from "next";
import { store } from "@/lib/store";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const contest = store.getContestBySlug(slug);

  if (!contest) {
    return {
      title: "Bảng xếp hạng cuộc thi | thi.easupso.com",
      openGraph: {
        images: ["/banner-easup.png"],
      },
    };
  }

  const title = `Bảng xếp hạng & Kết quả: ${contest.title} | thi.easupso.com`;
  const description =
    `Xem bảng xếp hạng kết quả thi trắc nghiệm cuộc thi "${contest.title}" xã Ea Súp.`;

  let bannerUrl = contest.bannerUrl || "/banner-easup.png";
  if (!bannerUrl.startsWith("http") && !bannerUrl.startsWith("/")) {
    bannerUrl = `/${bannerUrl}`;
  }

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://thi.easupso.com/ket-qua/${slug}`,
      siteName: "thi.easupso.com",
      images: [
        {
          url: bannerUrl,
          width: 1200,
          height: 630,
          alt: contest.title,
        },
      ],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [bannerUrl],
    },
  };
}

export default function ResultsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
