import LoginForm from "@/components/auth/LoginForm";
import { getCopy } from "@/lib/copy";

export default async function LoginPage() {
  const copy = await getCopy();
  return <LoginForm copy={copy} />;
}
