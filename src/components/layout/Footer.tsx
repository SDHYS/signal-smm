import Link from "next/link";
import type { CompanyInfo } from "@/lib/settings";

// 사이트 하단 사업자 정보 + 약관 링크. 값이 비어 있는 항목은 표기하지 않는다.
export default function Footer({
  siteName,
  company,
}: {
  siteName: string;
  company: CompanyInfo;
}) {
  const rows: [string, string][] = [
    ["상호", company.name],
    ["대표", company.ceo],
    ["사업자등록번호", company.bizno],
    ["통신판매업신고", company.mailorder],
    ["주소", company.address],
    ["이메일", company.email],
  ];
  const filled = rows.filter(([, v]) => v);

  return (
    <footer className="mt-auto border-t border-line bg-soft/60">
      <div className="mx-auto flex w-full max-w-[1380px] flex-col gap-3 px-4 py-8 sm:px-8">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm">
          <span className="font-semibold text-navy">{siteName}</span>
          <Link href="/terms" className="text-gray hover:text-navy hover:underline">
            이용약관
          </Link>
          <Link href="/privacy" className="font-medium text-gray hover:text-navy hover:underline">
            개인정보처리방침
          </Link>
        </div>
        {filled.length > 0 && (
          <p className="text-xs leading-5 text-gray">
            {filled.map(([label, value], i) => (
              <span key={label}>
                {i > 0 && <span className="mx-1.5 text-line">|</span>}
                {label} {value}
              </span>
            ))}
          </p>
        )}
        <p className="text-xs text-muted">
          © {new Date().getFullYear()} {siteName}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
