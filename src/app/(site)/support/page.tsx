import SupportCenter from "@/components/support/SupportCenter";
import { getSupportInfo } from "@/lib/settings";

export default async function SupportPage() {
  const { kakao, phone } = await getSupportInfo();
  return <SupportCenter kakao={kakao} phone={phone} />;
}
