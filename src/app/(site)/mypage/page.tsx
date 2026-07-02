import { redirect } from "next/navigation";
import MyPage from "@/components/mypage/MyPage";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function MyPageRoute() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const row = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      username: true,
      name: true,
      email: true,
      phone: true,
      balance: true,
      createdAt: true,
    },
  });
  if (!row) redirect("/login");

  return (
    <MyPage
      info={{
        username: row.username,
        name: row.name,
        email: row.email,
        phone: row.phone,
        balance: row.balance,
        createdAt: row.createdAt.toISOString(),
      }}
    />
  );
}
