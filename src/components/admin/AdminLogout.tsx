"use client";

import { useRouter } from "next/navigation";
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
      className="rounded-lg border border-line px-4 py-2 text-sm font-medium text-gray transition hover:bg-soft"
    >
      로그아웃
    </button>
  );
}
