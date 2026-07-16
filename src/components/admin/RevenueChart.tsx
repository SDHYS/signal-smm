// 최근 30일 일별 매출 바 차트 — 서버 렌더 + CSS 호버 툴팁.
// 단일 시리즈(레전드 불필요), 데이터 끝 4px 라운드, 바 사이 2px 간격,
// 표 보기(details) 제공으로 색각·스크린리더 접근성 확보.

export type DayRevenue = { date: string; label: string; amount: number; orders: number };

const won = (n: number) => `${n.toLocaleString()}원`;

export default function RevenueChart({
  days,
  total,
}: {
  days: DayRevenue[];
  total: number;
}) {
  const max = Math.max(...days.map((d) => d.amount), 1);

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-line bg-white p-6">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold text-navy">매출 추이 — 최근 30일</h2>
          <p className="text-sm text-gray">환불 제외 주문 금액 기준</p>
        </div>
        <p className="text-2xl font-bold text-navy">{won(total)}</p>
      </div>

      {/* 차트 영역 */}
      <div className="flex h-40 items-end gap-[2px]">
        {days.map((d) => {
          const h = d.amount > 0 ? Math.max(4, (d.amount / max) * 100) : 0;
          return (
            <div
              key={d.date}
              className="group relative flex h-full flex-1 items-end"
              title={`${d.label} — ${won(d.amount)} (${d.orders}건)`}
            >
              {/* 호버 툴팁 */}
              <span className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 whitespace-nowrap rounded bg-navy px-2 py-1 text-xs text-white group-hover:block">
                {d.label} · {won(d.amount)} · {d.orders}건
              </span>
              <div
                className="w-full rounded-t-[4px] bg-blue transition group-hover:brightness-110"
                style={{ height: `${h}%`, minHeight: d.amount > 0 ? 4 : 0 }}
              />
              {/* 0원 날은 베이스라인 표시 */}
              {d.amount === 0 && <div className="h-[2px] w-full bg-line" />}
            </div>
          );
        })}
      </div>

      {/* x축 라벨 (시작/중간/끝만 — 과밀 방지) */}
      <div className="flex justify-between text-xs text-muted">
        <span>{days[0]?.label}</span>
        <span>{days[Math.floor(days.length / 2)]?.label}</span>
        <span>{days[days.length - 1]?.label}</span>
      </div>

      {/* 표 보기 (접근성/정확값) */}
      <details>
        <summary className="cursor-pointer text-sm text-gray hover:text-navy">
          일별 표로 보기
        </summary>
        <div className="mt-3 max-h-64 overflow-y-auto rounded border border-line">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-soft text-left text-gray">
              <tr>
                <th className="px-4 py-2 font-medium">날짜</th>
                <th className="px-4 py-2 text-right font-medium">주문 수</th>
                <th className="px-4 py-2 text-right font-medium">매출</th>
              </tr>
            </thead>
            <tbody>
              {[...days].reverse().map((d) => (
                <tr key={d.date} className="border-t border-line">
                  <td className="px-4 py-2 text-navy">{d.label}</td>
                  <td className="px-4 py-2 text-right text-gray">{d.orders}</td>
                  <td className="px-4 py-2 text-right font-medium text-navy">{won(d.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
