import { prisma } from "@/lib/prisma";
import AdminBlog, { type BlogItem } from "@/components/admin/AdminBlog";

export default async function AdminBlogPage() {
  const rows = await prisma.blogPost.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    select: { id: true, title: true, category: true, views: true, createdAt: true },
  });

  const posts: BlogItem[] = rows.map((p) => ({
    id: p.id,
    title: p.title,
    category: p.category,
    views: p.views,
    date: p.createdAt.toISOString().slice(0, 10).replace(/-/g, "."),
  }));

  return <AdminBlog posts={posts} />;
}
