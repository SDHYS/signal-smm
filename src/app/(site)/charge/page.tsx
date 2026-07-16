import ChargePage from "@/components/charge/ChargePage";
import { getCurrentUser } from "@/lib/auth";
import { getBankInfo, getChargePresets, getVatRate } from "@/lib/settings";
import { getCopy } from "@/lib/copy";
import { prisma } from "@/lib/prisma";

export default async function Charge() {
  const user = await getCurrentUser();
  const bank = await getBankInfo();
  const copy = await getCopy();
  const presets = await getChargePresets();
  const vatRate = await getVatRate();

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
      balance={user?.balance ?? 0}
      bank={bank}
      copy={copy}
      presets={presets}
      vatRate={vatRate}
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
