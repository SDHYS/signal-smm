import "server-only";
import { prisma } from "./prisma";

// 알림은 부가 기능 — 생성 실패가 결제/주문 등 본 처리의 성공을 뒤집으면 안 됨
export async function notify(
  userId: string,
  input: { type?: string; title: string; body?: string; link?: string },
) {
  try {
    await prisma.notification.create({
      data: {
        userId,
        type: input.type ?? "system",
        title: input.title,
        body: input.body ?? null,
        link: input.link ?? null,
      },
    });
  } catch (e) {
    console.error("notify failed", { userId, title: input.title }, e);
  }
}
