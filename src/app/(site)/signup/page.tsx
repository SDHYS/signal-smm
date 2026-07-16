import SignupWizard from "@/components/auth/SignupWizard";
import { getSignupChannels } from "@/lib/settings";
import { getCopy } from "@/lib/copy";

export default async function SignupPage() {
  const [copy, channels] = await Promise.all([getCopy(), getSignupChannels()]);
  return <SignupWizard copy={copy} channels={channels} />;
}
