import BlogList, { type BlogCard } from "@/components/blog/BlogList";
import { prisma } from "@/lib/prisma";

import { getCopy } from "@/lib/copy";

export default async function BlogPage() {
  const copy = await getCopy();
  const rows = await prisma.blogPost.findMany({
    orderBy: { createdAt: "desc" },
    take: 60,
    select: { id: true, title: true, category: true, thumbnailUrl: true },
  });

  const posts: BlogCard[] = rows.map((p) => ({
    id: p.id,
    title: p.title,
    category: p.category,
    thumbnailUrl: p.thumbnailUrl,
  }));

  return <BlogList eyebrow={copy.blog_eyebrow} posts={posts} />;
}
