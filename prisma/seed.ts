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
      username: process.env.SEED_ADMIN_USERNAME ?? "admin",
      email: adminEmail,
      passwordHash: await bcrypt.hash(adminPw, 10),
      name: "관리자",
      role: "ADMIN",
    },
  });

  // 입금 계좌 등 사이트 설정
  const settings: Record<string, string> = {
    site_name: "SIGNAL SMM",
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

  // 샘플 공지/블로그 (없을 때만)
  if ((await prisma.notice.count()) === 0) {
    await prisma.notice.createMany({
      data: [
        { title: "[안내] SignalSMM 서비스 오픈 안내", content: "안녕하세요. SignalSMM 입니다.\n\n무통장입금 충전 후 다양한 SNS 마케팅 서비스를 이용하실 수 있습니다. 많은 이용 부탁드립니다.", pinned: true },
        { title: "[공지] 충전 및 입금 확인 안내", content: "충전 신청 후 안내된 계좌로 입금해주시면, 관리자 확인 후 잔액에 반영됩니다. 입금자명을 신청 시와 동일하게 입력해주세요." },
      ],
    });
  }
  if ((await prisma.blogPost.count()) === 0) {
    await prisma.blogPost.createMany({
      data: [
        { category: "인스타그램", title: "[TOP5] 인스타그램 자동 팔로워 늘리기 사이트 5 추천", content: "인스타그램 팔로워를 자연스럽게 늘리는 방법과 추천 서비스를 정리했습니다.", tags: ["인스타그램", "팔로워"] },
        { category: "유튜브", title: "유튜브 조회수 구매 전 꼭 체크해야 할 중요한 팁", content: "저렴한 조회수의 함정과 유효 조회수 확인 방법을 안내합니다.", tags: ["유튜브", "조회수"] },
      ],
    });
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
