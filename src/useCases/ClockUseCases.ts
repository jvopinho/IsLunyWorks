import { ClockRecordRepository } from '@/repositories/ClockRecordRepository';
import { UserRepository } from '@/repositories/UserRepository';
import { AuditLogRepository } from '@/repositories/AuditLogRepository';
import { RegisterClockInput } from '@/validations/clock';

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

    const updated = await ClockRecordRepository.update(recordId, {
      clockIn: inDate,
      clockOut: outDate,
      totalMinutes,
      notes: input.notes,
    });

    const diff = {
      previous: {
        clockIn: existing.clockIn.toISOString(),
        clockOut: existing.clockOut ? existing.clockOut.toISOString() : null,
        totalMinutes: existing.totalMinutes,
        notes: existing.notes,
      },
      current: {
        clockIn: inDate.toISOString(),
        clockOut: outDate ? outDate.toISOString() : null,
        totalMinutes,
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
