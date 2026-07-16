import FindId from "@/components/auth/FindId";
import { getCopy } from "@/lib/copy";

export default async function FindIdPage() {
  const copy = await getCopy();
  return <FindId eyebrow={copy.findid_eyebrow} />;
}
