-- CreateEnum
CREATE TYPE "InquiryStatus" AS ENUM ('PENDING', 'ANSWERED');

-- CreateTable
CREATE TABLE "notices" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "authorName" TEXT NOT NULL DEFAULT '관리자',
    "views" INTEGER NOT NULL DEFAULT 0,
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blog_posts" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT '업데이트',
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "authorName" TEXT NOT NULL DEFAULT '관리자',
    "thumbnailUrl" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "views" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "blog_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inquiries" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "status" "InquiryStatus" NOT NULL DEFAULT 'PENDING',
    "answer" TEXT,
    "answeredById" TEXT,
    "answeredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inquiries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "notices_createdAt_idx" ON "notices"("createdAt");
CREATE INDEX "blog_posts_category_idx" ON "blog_posts"("category");
CREATE INDEX "blog_posts_createdAt_idx" ON "blog_posts"("createdAt");
CREATE INDEX "inquiries_userId_idx" ON "inquiries"("userId");
CREATE INDEX "inquiries_status_idx" ON "inquiries"("status");

-- AddForeignKey
ALTER TABLE "inquiries" ADD CONSTRAINT "inquiries_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
