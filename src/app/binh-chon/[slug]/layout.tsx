import type { Metadata } from "next";
import { store } from "@/lib/store";

export const dynamic = "force-dynamic";
export const revalidate = 0;

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}

export async function generateMetadata(
  props: {
    params: Promise<{ slug: string }>;
    searchParams?: Promise<Record<string, string | string[] | undefined>>;
  }
): Promise<Metadata> {
  const { slug } = await props.params;
  const decodedSlug = decodeURIComponent(slug || "");
  const searchParams = props.searchParams ? await props.searchParams : {};
  const artworkParam = searchParams?.artwork;
  const artworkId = Array.isArray(artworkParam) ? artworkParam[0] : artworkParam;

  const contest = store.getMediaContestBySlug(decodedSlug);

  // 1. Trường hợp chia sẻ liên kết Tác phẩm cụ thể (?artwork=...)
  if (artworkId) {
    const submissions = store.getMediaSubmissions(contest?.id || decodedSlug);
    const sub = submissions.find(
      (s) => s.id === artworkId || s.id.toLowerCase() === artworkId.toLowerCase()
    );

    if (sub) {
      const artworkTitle = sub.title
        ? `Tác phẩm: "${sub.title}" - ${sub.authorName} (${sub.unitName})`
        : `Tác phẩm dự thi - ${sub.authorName}`;
      const artworkDesc = sub.description
        ? `${sub.description.slice(0, 180)}... Bình chọn cho tác phẩm của ${sub.authorName} (${sub.unitName}) tại Cuộc thi ${contest?.title || "Ảnh đẹp Ea Súp"}`
        : `Mời bạn vào xem và bình chọn cho tác phẩm "${sub.title}" của tác giả ${sub.authorName} (${sub.unitName}) tại Cuộc thi ${contest?.title || "Ảnh đẹp Ea Súp"}`;

      const artworkImageUrl =
        (Array.isArray(sub.mediaUrls) && sub.mediaUrls[0]) ||
        sub.mediaUrl ||
        contest?.bannerUrl ||
        "/banner-easup.png";

      const ogImageUrl = `/api/og-banner/${encodeURIComponent(decodedSlug)}?artwork=${encodeURIComponent(sub.id)}`;
      const pageUrl = `https://thi.easupso.com/binh-chon/${encodeURIComponent(decodedSlug)}?artwork=${encodeURIComponent(sub.id)}`;

      return {
        title: `${sub.title} - ${sub.authorName} | ${contest?.title || "Cuộc thi Ảnh đẹp Ea Súp"}`,
        description: artworkDesc,
        openGraph: {
          title: artworkTitle,
          description: artworkDesc,
          url: pageUrl,
          siteName: "thi.easupso.com",
          images: [
            {
              url: ogImageUrl,
              width: 1200,
              height: 630,
              alt: sub.title || "Tác phẩm dự thi",
            },
          ],
          locale: "vi_VN",
          type: "article",
        },
        twitter: {
          card: "summary_large_image",
          title: artworkTitle,
          description: artworkDesc,
          images: [ogImageUrl],
        },
      };
    }
  }

  // 2. Trường hợp chia sẻ liên kết Cuộc thi chung
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
