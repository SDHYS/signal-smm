import Link from "next/link";
import {
  Home,
  LogIn,
  UserPlus,
  Globe,
  Wallet,
  ReceiptText,
  FileText,
  MessageCircleQuestion,
  Headset,
  Megaphone,
  type LucideIcon,
} from "lucide-react";

type NavItem = { label: string; href: string; icon: LucideIcon };

const memberMenu: NavItem[] = [
  { label: "로그인", href: "/login", icon: LogIn },
  { label: "회원가입", href: "/signup", icon: UserPlus },
  { label: "블로그", href: "/blog", icon: Globe },
  { label: "잔액충전", href: "/charge", icon: Wallet },
  { label: "주문내역", href: "/orders", icon: ReceiptText },
];

const serviceMenu: NavItem[] = [
  { label: "서비스 안내", href: "/guide", icon: FileText },
  { label: "1:1 문의", href: "/inquiry", icon: MessageCircleQuestion },
  { label: "고객센터", href: "/support", icon: Headset },
  { label: "공지사항", href: "/notice", icon: Megaphone },
];

function NavLink({ item }: { item: NavItem }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className="flex items-center gap-2 rounded px-3 py-4 text-base font-medium text-navy transition-colors hover:bg-soft"
    >
      <Icon size={24} strokeWidth={1.5} className="shrink-0" />
      <span>{item.label}</span>
    </Link>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="px-1 text-sm font-normal text-gray">{children}</p>;
}

export default function Sidebar() {
  return (
    <aside className="sticky top-0 hidden h-screen w-[300px] shrink-0 flex-col justify-between overflow-y-auto border-r border-line bg-white px-6 py-9 lg:flex">
      <div className="flex flex-col gap-15">
        <div className="flex flex-col gap-6">
          {/* 로고 */}
          <Link href="/" className="flex items-center gap-1">
            <span className="h-[30px] w-[28px] rounded bg-gradient-to-br from-[#91A0FF] via-[#6B80FF] to-[#606DBC]" />
            <span className="text-2xl font-bold tracking-tight text-[#91A0FF]">
              LOGONAME
            </span>
          </Link>

          {/* 네비게이션 */}
          <nav className="flex flex-col gap-7">
            <Link
              href="/"
              className="flex items-center gap-2 rounded bg-soft px-3 py-4 text-base font-medium text-navy"
            >
              <Home size={24} strokeWidth={1.5} />
              <span>메인페이지</span>
            </Link>

            <div className="flex flex-col gap-4">
              <SectionLabel>회원 메뉴</SectionLabel>
              <div className="flex flex-col">
                {memberMenu.map((item) => (
                  <NavLink key={item.href} item={item} />
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <SectionLabel>서비스 안내</SectionLabel>
              <div className="flex flex-col">
                {serviceMenu.map((item) => (
                  <NavLink key={item.href} item={item} />
                ))}
              </div>
            </div>
          </nav>
        </div>

        {/* 보유잔액 + 충전하기 */}
        <div className="flex flex-col gap-3 pb-2">
          <div className="flex items-center justify-between rounded border border-line px-3 py-4">
            <span className="text-sm font-normal text-gray">보유잔액</span>
            <span className="text-lg font-medium text-navy">₩0</span>
          </div>
          <Link
            href="/charge"
            className="flex items-center justify-center rounded bg-gradient-to-r from-[#2E82FF] via-[#8DBBFF] to-[#2E82FF] px-3 py-4 text-lg font-semibold text-white shadow-[6px_6px_16px_rgba(46,130,255,0.48)] transition-transform hover:-translate-y-0.5"
          >
            충전하기
          </Link>
        </div>
      </div>
    </aside>
  );
}
