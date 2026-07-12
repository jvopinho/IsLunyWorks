import { ClockRecordRepository } from '@/repositories/ClockRecordRepository';
import { UserRepository } from '@/repositories/UserRepository';
import { AuditLogRepository } from '@/repositories/AuditLogRepository';
import { RegisterClockInput } from '@/validations/clock';
import { prisma } from '@/lib/prisma';
import { calculateRecordWorkload } from '@/utils/workload';

export class ClockUseCases {
  static async registerClock(userId: string, input: RegisterClockInput) {
    const user = await UserRepository.findById(userId);
    if (!user || !user.active) {
      throw new Error('Usuário desativado ou inválido.');
    }

    const activeRecord = await ClockRecordRepository.findLastActiveRecord(userId);

    let record;
    let action = '';

    if (activeRecord) {
      action = 'CLOCK_OUT';
      record = await ClockRecordRepository.updateClockOut(activeRecord.id, input.notes);
    } else {
      action = 'CLOCK_IN';
      record = await ClockRecordRepository.createClockIn(userId, input.notes);
    }

    await AuditLogRepository.create({
      userId,
      action,
      entity: 'ClockRecord',
      entityId: record.id,
    });

    return record;
  }

  static async getStatus(userId: string) {
    const activeRecord = await ClockRecordRepository.findLastActiveRecord(userId);
    return {
      isClockedIn: !!activeRecord,
      activeRecord,
    };
  }

  static async getDashboardStats(actorId: string) {
    const totalUsers = await UserRepository.count();
    const todayRecords = await ClockRecordRepository.countTodayRecords();
    const todayMinutes = await ClockRecordRepository.sumTodayMinutes();
    const adminCount = await UserRepository.count({
      role: {
        name: 'Administrador',
      },
    });

    const todayHours = (todayMinutes / 60).toFixed(1);

    return {
      totalUsers,
      todayRecords,
      todayHours: parseFloat(todayHours),
      adminCount,
    };
  }

  static async updateClockRecord(
    actorId: string,
    recordId: string,
    input: { clockIn: string; clockOut?: string | null; notes?: string | null; reason: string }
  ) {
    const existing = await ClockRecordRepository.findById(recordId);
    if (!existing) {
      throw new Error('Registro de ponto não encontrado.');
    }

    const inDate = new Date(input.clockIn);
    let outDate: Date | null = null;
    let totalMinutes: number | null = null;

    if (input.clockOut) {
      outDate = new Date(input.clockOut);
      if (outDate <= inDate) {
        throw new Error('O horário de saída deve ser posterior ao horário de entrada.');
      }
      totalMinutes = Math.round((outDate.getTime() - inDate.getTime()) / (1000 * 60));
    }

    const schedule = await prisma.workSchedule.findUnique({
      where: { userId: existing.userId },
      include: {
        days: true,
        breaks: true,
      },
    });

    const workload = outDate && totalMinutes !== null
      ? calculateRecordWorkload(inDate, outDate, totalMinutes, schedule)
      : {
          expectedMinutes: 0,
          normalMinutes: 0,
          extraMinutes: 0,
          bankMinutes: 0,
          deficitMinutes: 0,
          plannedIn: null,
          plannedOut: null,
          plannedBreakMinutes: 0,
          actualBreakMinutes: 0,
          delayInMinutes: 0,
          earlyOutMinutes: 0,
          extraOutMinutes: 0,
        };

    const updated = await prisma.$transaction(async (tx) => {
      const updatedRec = await tx.clockRecord.update({
        where: { id: recordId },
        data: {
          clockIn: inDate,
          clockOut: outDate,
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
          notes: input.notes,
        },
      });

      const existingTx = await tx.bankHoursTransaction.findFirst({
        where: { userId: existing.userId, referenceId: recordId, type: 'WORKED_EXTRA' },
      });

      let balanceAdjustment = 0;
      if (existingTx) {
        balanceAdjustment -= existingTx.minutes;
        await tx.bankHoursTransaction.delete({ where: { id: existingTx.id } });
      }

      if (workload.bankMinutes > 0) {
        balanceAdjustment += workload.bankMinutes;
        await tx.bankHoursTransaction.create({
          data: {
            userId: existing.userId,
            type: 'WORKED_EXTRA',
            minutes: workload.bankMinutes,
            reason: 'Ajuste automático por edição de ponto',
            referenceId: recordId,
            createdBy: actorId,
          },
        });
      }

      if (balanceAdjustment !== 0) {
        await tx.bankHoursBalance.upsert({
          where: { userId: existing.userId },
          update: { currentBalanceMinutes: { increment: balanceAdjustment } },
          create: { userId: existing.userId, currentBalanceMinutes: balanceAdjustment },
        });
      }

      return updatedRec;
    });

    const diff = {
      previous: {
        clockIn: existing.clockIn.toISOString(),
        clockOut: existing.clockOut ? existing.clockOut.toISOString() : null,
        totalMinutes: existing.totalMinutes,
        expectedMinutes: existing.expectedMinutes,
        normalMinutes: existing.normalMinutes,
        extraMinutes: existing.extraMinutes,
        bankMinutes: existing.bankMinutes,
        deficitMinutes: existing.deficitMinutes,
        notes: existing.notes,
      },
      current: {
        clockIn: inDate.toISOString(),
        clockOut: outDate ? outDate.toISOString() : null,
        totalMinutes,
        expectedMinutes: workload.expectedMinutes,
        normalMinutes: workload.normalMinutes,
        extraMinutes: workload.extraMinutes,
        bankMinutes: workload.bankMinutes,
        deficitMinutes: workload.deficitMinutes,
        notes: input.notes,
      },
      owner: {
        name: existing.user.name,
        email: existing.user.email,
        role: existing.user.role?.name || '-',
      }
    };

    await AuditLogRepository.create({
      userId: actorId,
      action: 'clock.record.updated',
      entity: 'ClockRecord',
      entityId: recordId,
      details: JSON.stringify(diff),
      reason: input.reason,
    });

    return updated;
  }
}
