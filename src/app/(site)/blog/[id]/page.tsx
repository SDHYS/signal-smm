import { notFound } from "next/navigation";
import BlogDetail from "@/components/blog/BlogDetail";
import { prisma } from "@/lib/prisma";

export default async function BlogDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const post = await prisma.blogPost
    .update({
      where: { id },
      data: { views: { increment: 1 } },
      select: {
        category: true,
        title: true,
        content: true,
        authorName: true,
        views: true,
        tags: true,
        thumbnailUrl: true,
        createdAt: true,
      },
    })
    .catch(() => null);

  if (!post) notFound();

  return (
    <BlogDetail
      post={{
        category: post.category,
        title: post.title,
        content: post.content,
        authorName: post.authorName,
        views: post.views,
        tags: post.tags,
        thumbnailUrl: post.thumbnailUrl,
        date: post.createdAt.toISOString().slice(0, 10).replace(/-/g, "."),
      }}
    />
  );
}
