import ServiceGuide from "@/components/guide/ServiceGuide";
import { getCopy } from "@/lib/copy";

export default async function GuidePage() {
  const copy = await getCopy();
  return <ServiceGuide copy={copy} />;
}
