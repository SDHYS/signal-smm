import Link from "next/link";

// 전역 404 — 존재하지 않는 경로 또는 notFound() 호출 시.
export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-[520px] flex-col items-center justify-center gap-5 px-4 text-center">
      <span className="text-5xl font-bold text-navy">404</span>
      <div className="flex flex-col gap-2">
        <h1 className="text-xl font-bold text-navy">페이지를 찾을 수 없습니다</h1>
        <p className="text-sm leading-6 text-gray">
          주소가 변경되었거나 삭제된 페이지일 수 있습니다.
        </p>
      </div>
      <Link
        href="/"
        className="rounded-lg bg-navy px-6 py-3 text-sm font-medium text-white transition hover:opacity-90"
      >
        홈으로
      </Link>
    </div>
  );
}
