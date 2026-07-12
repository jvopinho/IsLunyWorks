import { prisma } from '@/lib/prisma';
import { calculateRecordWorkload } from '@/utils/workload';

export class ClockRecordRepository {
  static async findLastActiveRecord(userId: string) {
    return prisma.clockRecord.findFirst({
      where: {
        userId,
        clockOut: null,
      },
      orderBy: {
        clockIn: 'desc',
      },
    });
  }

  static async createClockIn(userId: string, notes?: string | null) {
    return prisma.clockRecord.create({
      data: {
        userId,
        clockIn: new Date(),
        notes,
      },
    });
  }

  static async updateClockOut(id: string, notes?: string | null) {
    const record = await prisma.clockRecord.findUnique({
      where: { id },
    });

    if (!record) {
      throw new Error('Registro de ponto não encontrado.');
    }

    const clockOut = new Date();
    const totalMinutes = Math.max(
      0,
      Math.round((clockOut.getTime() - record.clockIn.getTime()) / 60000)
    );

    const schedule = await prisma.workSchedule.findUnique({
      where: { userId: record.userId },
      include: {
        days: true,
        breaks: true,
      },
    });

    const workload = calculateRecordWorkload(record.clockIn, clockOut, totalMinutes, schedule);

    const updatedNotes = notes
      ? record.notes
        ? `${record.notes} | Saída: ${notes}`
        : notes
      : record.notes;

    return prisma.$transaction(async (tx) => {
      const updatedRecord = await tx.clockRecord.update({
        where: { id },
        data: {
          clockOut,
          totalMinutes,
          expectedMinutes: workload.expectedMinutes,
          normalMinutes: workload.normalMinutes,
          extraMinutes: workload.extraMinutes,
          bankMinutes: workload.bankMinutes,
          deficitMinutes: workload.deficitMinutes,
          plannedIn: workload.plannedIn,
          plannedOut: workload.plannedOut,
          plannedBreakMinutes: workload.plannedBreakMinutes,
          actualBreakMinutes: workload.actualBreakMinutes,
          delayInMinutes: workload.delayInMinutes,
          earlyOutMinutes: workload.earlyOutMinutes,
          extraOutMinutes: workload.extraOutMinutes,
          notes: updatedNotes,
        },
      });

      if (workload.bankMinutes > 0) {
        await tx.bankHoursBalance.upsert({
          where: { userId: record.userId },
          update: { currentBalanceMinutes: { increment: workload.bankMinutes } },
          create: { userId: record.userId, currentBalanceMinutes: workload.bankMinutes },
        });

        await tx.bankHoursTransaction.create({
          data: {
            userId: record.userId,
            type: 'WORKED_EXTRA',
            minutes: workload.bankMinutes,
            reason: 'Horas excedentes acumuladas na jornada',
            referenceId: id,
          },
        });
      }

      return updatedRecord;
    });
  }

  static async findMany(filters: {
    userId?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    const whereClause: any = {};

    if (filters.userId) {
      whereClause.userId = filters.userId;
    }

    if (filters.startDate || filters.endDate) {
      whereClause.clockIn = {};
      if (filters.startDate) {
        whereClause.clockIn.gte = filters.startDate;
      }
      if (filters.endDate) {
        whereClause.clockIn.lte = filters.endDate;
      }
    }

    return prisma.clockRecord.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        clockIn: 'desc',
      },
    });
  }

  static async countTodayRecords() {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    return prisma.clockRecord.count({
      where: {
        clockIn: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
    });
  }

  static async sumTodayMinutes() {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const records = await prisma.clockRecord.findMany({
      where: {
        clockIn: {
          gte: todayStart,
          lte: todayEnd,
        },
        totalMinutes: {
          not: null,
        },
      },
      select: {
        totalMinutes: true,
      },
    });

    return records.reduce((sum, record) => sum + (record.totalMinutes || 0), 0);
  }

  static async findById(id: string) {
    return prisma.clockRecord.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });
  }

  static async update(
    id: string,
    data: {
      clockIn: Date;
      clockOut: Date | null;
      totalMinutes: number | null;
      notes?: string | null;
    }
  ) {
    return prisma.clockRecord.update({
      where: { id },
      data,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });
  }
}
