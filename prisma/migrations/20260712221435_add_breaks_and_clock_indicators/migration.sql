-- AlterTable
ALTER TABLE "ClockRecord" ADD COLUMN     "actualBreakMinutes" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "delayInMinutes" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "earlyOutMinutes" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "extraOutMinutes" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "plannedBreakMinutes" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "plannedIn" TIMESTAMP(3),
ADD COLUMN     "plannedOut" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "WorkSchedule" ADD COLUMN     "endTime" TEXT DEFAULT '17:00',
ADD COLUMN     "expectedDailyMinutes" INTEGER NOT NULL DEFAULT 480,
ADD COLUMN     "flexibleSchedule" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "startTime" TEXT DEFAULT '08:00',
ADD COLUMN     "timezone" TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
ADD COLUMN     "weeklyMinutes" INTEGER NOT NULL DEFAULT 2400;

-- CreateTable
CREATE TABLE "WorkScheduleDay" (
    "id" TEXT NOT NULL,
    "workScheduleId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "startTime" TEXT DEFAULT '08:00',
    "endTime" TEXT DEFAULT '17:00',
    "expectedDailyMinutes" INTEGER NOT NULL DEFAULT 480,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkScheduleDay_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkScheduleBreak" (
    "id" TEXT NOT NULL,
    "workScheduleId" TEXT NOT NULL,
    "dayOfWeek" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "paid" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkScheduleBreak_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WorkScheduleDay_workScheduleId_dayOfWeek_key" ON "WorkScheduleDay"("workScheduleId", "dayOfWeek");

-- CreateIndex
CREATE INDEX "WorkScheduleBreak_workScheduleId_idx" ON "WorkScheduleBreak"("workScheduleId");

-- AddForeignKey
ALTER TABLE "WorkScheduleDay" ADD CONSTRAINT "WorkScheduleDay_workScheduleId_fkey" FOREIGN KEY ("workScheduleId") REFERENCES "WorkSchedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkScheduleBreak" ADD CONSTRAINT "WorkScheduleBreak_workScheduleId_fkey" FOREIGN KEY ("workScheduleId") REFERENCES "WorkSchedule"("id") ON DELETE CASCADE ON UPDATE CASCADE;
