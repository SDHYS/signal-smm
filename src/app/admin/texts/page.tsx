import { prisma } from "@/lib/prisma";
import { COPY_SECTIONS } from "@/lib/copy";
import TextsForm, { type TextSection } from "@/components/admin/TextsForm";

export default async function AdminTextsPage() {
  const rows = await prisma.setting.findMany({
    where: { key: { startsWith: "copy_" } },
  });
  const saved = Object.fromEntries(
    rows.map((r) => [r.key.slice("copy_".length), r.value]),
  );

  // 서버 레지스트리를 직렬화 가능한 형태로 전달
  const sections: TextSection[] = COPY_SECTIONS.map((s) => ({
    title: s.title,
    page: s.page,
    items: s.items.map((i) => ({
      key: i.key,
      label: i.label,
      default: i.default,
      textarea: i.textarea,
      hint: i.hint,
    })),
  }));

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-navy">문구 관리</h1>
        <p className="text-base text-gray">
          유저 페이지에 노출되는 안내·마케팅 문구를 수정합니다. 비워두면 기본
          문구가 사용되고, 저장 즉시 사이트에 반영됩니다.
        </p>
      </div>
      <TextsForm sections={sections} saved={saved} />
    </div>
  );
}
