import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  // 관리자 계정
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@signalsmm.local";
  const adminPw = process.env.SEED_ADMIN_PASSWORD ?? "Admin1234!";
  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      passwordHash: await bcrypt.hash(adminPw, 10),
      name: "관리자",
      role: "ADMIN",
    },
  });

  // 입금 계좌 등 사이트 설정
  const settings: Record<string, string> = {
    site_name: "SignalSMM",
    bank_name: "국민은행",
    bank_account: "000000-00-000000",
    bank_holder: "(주)시그널",
  };
  for (const [key, value] of Object.entries(settings)) {
    await prisma.setting.upsert({
      where: { key },
      update: {},
      create: { key, value },
    });
  }

  // 샘플 상품(SMM 서비스)
  const products = [
    { category: "인스타그램", name: "인스타그램 한국인 팔로워", unitPrice: 120, minQty: 10, maxQty: 100000, sortOrder: 1 },
    { category: "인스타그램", name: "인스타그램 게시물 좋아요", unitPrice: 30, minQty: 20, maxQty: 50000, sortOrder: 2 },
    { category: "유튜브", name: "유튜브 조회수", unitPrice: 15, minQty: 100, maxQty: 1000000, sortOrder: 3 },
    { category: "유튜브", name: "유튜브 구독자", unitPrice: 200, minQty: 10, maxQty: 50000, sortOrder: 4 },
    { category: "틱톡", name: "틱톡 팔로워", unitPrice: 90, minQty: 10, maxQty: 100000, sortOrder: 5 },
  ];
  for (const p of products) {
    const existing = await prisma.product.findFirst({ where: { name: p.name } });
    if (!existing) {
      await prisma.product.create({ data: p });
    }
  }

  console.log("✅ 시드 완료:", { adminEmail, products: products.length });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
