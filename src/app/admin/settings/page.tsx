import { getAllSettings } from "@/lib/settings";
import SettingsForm from "@/components/admin/SettingsForm";

export default async function AdminSettingsPage() {
  const initial = await getAllSettings();

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-navy">설정</h1>
        <p className="text-base text-gray">
          입금 계좌·고객센터 연락처·회사소개 문구를 관리합니다. 저장 즉시 사이트에 반영됩니다.
        </p>
      </div>
      <SettingsForm initial={initial} />
    </div>
  );
}
