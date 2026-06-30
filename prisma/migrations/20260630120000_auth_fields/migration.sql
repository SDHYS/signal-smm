-- AlterTable: 회원 인증/잔액 필드 추가
ALTER TABLE "users" ADD COLUMN "username" TEXT NOT NULL;
ALTER TABLE "users" ADD COLUMN "signupChannel" TEXT;
ALTER TABLE "users" ADD COLUMN "balance" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");
