import Link from "next/link";

export type Stat = {
  label: string;
  value: string;
  sub?: string;
  href?: string;
  accent?: "orange" | "blue" | "green" | "navy" | "red";
};

const ACCENT: Record<NonNullable<Stat["accent"]>, string> = {
  orange: "text-orange",
  blue: "text-blue",
  green: "text-[#04B014]",
  navy: "text-navy",
  red: "text-[#ED1C24]",
};

function Card({ s }: { s: Stat }) {
  const body = (
    <div className="flex h-full flex-col gap-1 rounded-xl border border-line bg-white p-5 transition hover:border-navy/30">
      <span className="text-sm text-gray">{s.label}</span>
      <span className={`text-2xl font-bold ${ACCENT[s.accent ?? "navy"]}`}>{s.value}</span>
      {s.sub && <span className="mt-auto text-xs text-gray">{s.sub}</span>}
    </div>
  );
  return s.href ? (
    <Link href={s.href} className="block h-full">
      {body}
    </Link>
  ) : (
    body
  );
}

export default function DashboardStats({ stats }: { stats: Stat[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 auto-rows-fr md:grid-cols-4">
      {stats.map((s) => (
        <Card key={s.label} s={s} />
      ))}
    </div>
  );
}
