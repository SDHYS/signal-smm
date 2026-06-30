import NoticeDetail from "@/components/notice/NoticeDetail";

export default async function NoticeDetailPage({
  params,
}: {
  params: Promise<{ no: string }>;
}) {
  const { no } = await params;
  return <NoticeDetail no={no} />;
}
