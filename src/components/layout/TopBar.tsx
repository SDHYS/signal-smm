import { Search, LayoutGrid, Newspaper, Bell } from "lucide-react";

export default function TopBar() {
  return (
    <header className="w-full px-4 py-6 sm:px-8">
      <div className="mx-auto flex w-full max-w-[1380px] items-center justify-between gap-4">
        {/* 검색 */}
        <div className="flex w-full max-w-[360px] items-center gap-1.5 rounded-full bg-soft px-6 py-3.5">
          <Search size={22} strokeWidth={1.5} className="shrink-0 text-muted" />
          <input
            type="text"
            placeholder="검색어를 입력해주세요"
            className="w-full bg-transparent text-sm text-navy placeholder:text-gray focus:outline-none"
          />
        </div>

        {/* 우측 아이콘 + 프로필 */}
        <div className="flex items-center gap-7">
          <div className="flex items-center gap-3.5 text-ink">
            <button aria-label="전체 메뉴" className="transition-opacity hover:opacity-60">
              <LayoutGrid size={26} strokeWidth={1.5} />
            </button>
            <button aria-label="소식" className="transition-opacity hover:opacity-60">
              <Newspaper size={26} strokeWidth={1.5} />
            </button>
            <button aria-label="알림" className="relative transition-opacity hover:opacity-60">
              <Bell size={26} strokeWidth={1.5} />
              <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full border border-white bg-[#ED1C24]" />
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="h-[38px] w-[38px] rounded-full bg-[#D9D9D9]" />
            <span className="hidden text-base font-medium text-navy sm:inline">
              시그널디코드
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
