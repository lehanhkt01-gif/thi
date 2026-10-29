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
      title: "Cuộc thi trực tuyến | thi.easupso.com",
      openGraph: {
        images: ["/banner-easup.png"],
      },
    };
  }

  const title = `${contest.title} | thi.easupso.com`;
  const description =
    contest.shortDesc ||
    "Hệ thống thi trắc nghiệm và tuyên truyền pháp luật trực tuyến Xã Ea Súp.";
  
  // URL banner của cuộc thi (ưu tiên banner của chính cuộc thi đó làm banner đường link web)
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
      url: `https://thi.easupso.com/thi/${slug}`,
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

export default function ContestLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
