import "server-only";
import { prisma } from "./prisma";

export async function notify(
  userId: string,
  input: { type?: string; title: string; body?: string; link?: string },
) {
  await prisma.notification.create({
    data: {
      userId,
      type: input.type ?? "system",
      title: input.title,
      body: input.body ?? null,
      link: input.link ?? null,
    },
  });
}
