import type { Metadata } from "next";
import { store } from "@/lib/store";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}): Promise<Metadata> {
  const { slug, id } = await params;
  const decodedSlug = decodeURIComponent(slug || "");
  const contest = store.getMediaContestBySlug(decodedSlug);
  const sub = store.getMediaSubmission(id);

  if (!sub) {
    const title = contest?.title
      ? `Cuộc thi: ${contest.title} | thi.easupso.com`
      : "Cuộc thi Ảnh đẹp trực tuyến Xã Ea Súp";
    return { title };
  }

  const title = `${sub.title} - Tác giả: ${sub.authorName} (${sub.unitName}) | ${contest?.title || "Cuộc thi Ảnh đẹp Xã Ea Súp"}`;
  const description =
    sub.description ||
    `Tác phẩm "${sub.title}" của tác giả ${sub.authorName} (${sub.unitName}) tham gia cuộc thi ${contest?.title || "ảnh đẹp trực tuyến Xã Ea Súp"}. Hãy bình chọn ngay!`;

  // Ưu tiên hình ảnh của chính tác phẩm
  let imageUrl = sub.mediaUrl;
  if (Array.isArray(sub.mediaUrls) && sub.mediaUrls.length > 0) {
    imageUrl = sub.mediaUrls[0];
  }
  if (!imageUrl.startsWith("http")) {
    imageUrl = `https://thi.easupso.com${imageUrl.startsWith("/") ? "" : "/"}${imageUrl}`;
  }

  const pageUrl = `https://thi.easupso.com/binh-chon/${encodeURIComponent(decodedSlug)}/tac-pham/${encodeURIComponent(id)}`;

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
          url: imageUrl,
          width: 1200,
          height: 900,
          alt: sub.title,
        },
      ],
      locale: "vi_VN",
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
    },
  };
}

export default function ArtworkDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
