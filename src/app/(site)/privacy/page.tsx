import { prisma } from "@/lib/prisma";

export default async function PrivacyPage() {
  const row = await prisma.setting.findUnique({ where: { key: "privacy_content" } });
  const content = row?.value.trim();

  return (
    <div className="mx-auto flex w-full max-w-[900px] flex-col gap-8 pt-2">
      <div className="flex flex-col gap-2.5">
        <p className="text-base font-normal text-[#767676]">개인정보 보호 안내</p>
        <h1 className="text-[26px] font-bold leading-9 sm:text-[34px] sm:leading-[46px] lg:text-[40px] lg:leading-[52px] text-black">
          개인정보처리방침
        </h1>
      </div>
      {content ? (
        <div className="whitespace-pre-line border-t border-line py-8 text-base font-normal leading-[28px] text-gray">
          {content}
        </div>
      ) : (
        <p className="rounded-xl bg-soft p-8 text-base text-gray">
          개인정보처리방침을 준비 중입니다.
        </p>
      )}
    </div>
  );
}
