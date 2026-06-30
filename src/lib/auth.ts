import "server-only";
import { cache } from "react";
import { prisma } from "./prisma";
import { getSessionUserId } from "./session";

export type CurrentUser = {
  id: string;
  username: string;
  name: string;
  email: string;
  role: "USER" | "ADMIN";
  balance: number;
};

// 요청 단위 캐시 — 한 요청에서 여러 번 호출해도 DB 1회만 조회
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const userId = await getSessionUserId();
  if (!userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      name: true,
      email: true,
      role: true,
      balance: true,
    },
  });
  return user;
});
