-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "QuoteStatus" AS ENUM ('sent', 'follow_up_due', 'waiting', 'at_risk', 'won', 'lost');

-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('call', 'text', 'email', 'note', 'status_change');

-- CreateTable
CREATE TABLE "Quote" (
    "id" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "contactName" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "jobAddress" TEXT NOT NULL,
    "estimateAmount" INTEGER NOT NULL,
    "dateSent" TIMESTAMP(3) NOT NULL,
    "status" "QuoteStatus" NOT NULL,
    "nextFollowUpAt" TIMESTAMP(3),
    "lastContactAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Quote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Activity" (
    "id" TEXT NOT NULL,
    "quoteId" TEXT NOT NULL,
    "type" "ActivityType" NOT NULL,
    "summary" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Activity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Quote_status_idx" ON "Quote"("status");

-- CreateIndex
CREATE INDEX "Quote_nextFollowUpAt_idx" ON "Quote"("nextFollowUpAt");

-- CreateIndex
CREATE INDEX "Activity_quoteId_createdAt_idx" ON "Activity"("quoteId", "createdAt");

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

