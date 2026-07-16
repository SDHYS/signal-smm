"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { label: "입금확인", href: "/admin" },
  { label: "주문관리", href: "/admin/orders" },
  { label: "상품관리", href: "/admin/products" },
  { label: "회원관리", href: "/admin/members" },
  { label: "공지사항", href: "/admin/notices" },
  { label: "블로그", href: "/admin/blog" },
  { label: "1:1 문의", href: "/admin/inquiries" },
  { label: "문구", href: "/admin/texts" },
  { label: "설정", href: "/admin/settings" },
];

export default function AdminNav() {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  return (
    <nav className="flex flex-wrap gap-2">
      {items.map((it) => {
        const active = isActive(it.href);
        return (
          <Link
            key={it.href}
            href={it.href}
            className={`rounded-full px-5 py-2.5 text-sm font-medium transition ${
              active ? "bg-navy text-white" : "bg-white text-gray-2 hover:bg-soft"
            }`}
          >
            {it.label}
          </Link>
        );
      })}
    </nav>
  );
}
