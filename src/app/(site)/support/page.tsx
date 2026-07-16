import SupportCenter from "@/components/support/SupportCenter";
import { getSupportInfo } from "@/lib/settings";
import { getCopy } from "@/lib/copy";

export default async function SupportPage() {
  const [{ kakao, phone }, copy] = await Promise.all([getSupportInfo(), getCopy()]);
  return <SupportCenter kakao={kakao} phone={phone} copy={copy} />;
}
