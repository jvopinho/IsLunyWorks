-- CreateEnum
CREATE TYPE "ExtraHoursMode" AS ENUM ('BANK_HOURS', 'OVERTIME');

-- CreateEnum
CREATE TYPE "BankTransactionType" AS ENUM ('WORKED_EXTRA', 'MANUAL_CREDIT', 'MANUAL_DEBIT', 'USED_IN_WORKDAY', 'ADJUSTMENT');

-- CreateTable
CREATE TABLE "WorkSchedule" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "weeklyHours" DOUBLE PRECISION NOT NULL DEFAULT 40.0,
    "expectedDailyHours" DOUBLE PRECISION NOT NULL DEFAULT 8.0,
    "mondayEnabled" BOOLEAN NOT NULL DEFAULT true,
    "tuesdayEnabled" BOOLEAN NOT NULL DEFAULT true,
    "wednesdayEnabled" BOOLEAN NOT NULL DEFAULT true,
    "thursdayEnabled" BOOLEAN NOT NULL DEFAULT true,
    "fridayEnabled" BOOLEAN NOT NULL DEFAULT true,
    "saturdayEnabled" BOOLEAN NOT NULL DEFAULT false,
    "sundayEnabled" BOOLEAN NOT NULL DEFAULT false,
    "extraHoursMode" "ExtraHoursMode" NOT NULL DEFAULT 'BANK_HOURS',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkSchedule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BankHoursBalance" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "currentBalanceMinutes" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BankHoursBalance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BankHoursTransaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "BankTransactionType" NOT NULL,
    "minutes" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "referenceId" TEXT,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BankHoursTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WorkSchedule_userId_key" ON "WorkSchedule"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "BankHoursBalance_userId_key" ON "BankHoursBalance"("userId");

-- CreateIndex
CREATE INDEX "BankHoursTransaction_userId_idx" ON "BankHoursTransaction"("userId");

-- CreateIndex
CREATE INDEX "BankHoursTransaction_createdAt_idx" ON "BankHoursTransaction"("createdAt");

-- AddForeignKey
ALTER TABLE "WorkSchedule" ADD CONSTRAINT "WorkSchedule_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BankHoursBalance" ADD CONSTRAINT "BankHoursBalance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BankHoursTransaction" ADD CONSTRAINT "BankHoursTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
