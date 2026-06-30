-- CreateEnum
CREATE TYPE "ChargeStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED');

-- CreateTable
CREATE TABLE "charge_requests" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "vat" INTEGER NOT NULL DEFAULT 0,
    "total" INTEGER NOT NULL,
    "depositorName" TEXT NOT NULL,
    "receiptType" TEXT NOT NULL DEFAULT '신청안함',
    "status" "ChargeStatus" NOT NULL DEFAULT 'PENDING',
    "confirmedById" TEXT,
    "confirmedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "charge_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "charge_requests_userId_idx" ON "charge_requests"("userId");

-- CreateIndex
CREATE INDEX "charge_requests_status_idx" ON "charge_requests"("status");

-- AddForeignKey
ALTER TABLE "charge_requests" ADD CONSTRAINT "charge_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
