"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { logoutAction } from "@/app/actions/auth";

export default function AdminLogout() {
  const router = useRouter();
  return (
    <button
      onClick={async () => {
        await logoutAction();
        router.push("/login");
        router.refresh();
      }}
      aria-label="로그아웃"
      title="로그아웃"
      className="text-[#ED1C24] transition hover:opacity-70"
    >
      <LogOut size={20} strokeWidth={2} />
    </button>
  );
}
