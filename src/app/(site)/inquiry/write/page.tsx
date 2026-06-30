import { redirect } from "next/navigation";
import InquiryWrite from "@/components/inquiry/InquiryWrite";
import { getCurrentUser } from "@/lib/auth";

export default async function InquiryWritePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return <InquiryWrite />;
}
