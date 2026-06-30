import ChargePage from "@/components/charge/ChargePage";
import { getCurrentUser } from "@/lib/auth";
import { getBankInfo } from "@/lib/settings";
import { prisma } from "@/lib/prisma";

export default async function Charge() {
  const user = await getCurrentUser();
  const bank = await getBankInfo();

  const history = user
    ? await prisma.chargeRequest.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          amount: true,
          total: true,
          depositorName: true,
          status: true,
          createdAt: true,
        },
      })
    : [];

  return (
    <ChargePage
      isLoggedIn={!!user}
      bank={bank}
      history={history.map((h) => ({
        id: h.id,
        amount: h.amount,
        total: h.total,
        depositorName: h.depositorName,
        status: h.status,
        createdAt: h.createdAt.toISOString(),
      }))}
    />
  );
}
