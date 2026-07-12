import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';
import { UserRepository } from '@/repositories/UserRepository';
import { AuditLogRepository } from '@/repositories/AuditLogRepository';
import { CreateUserInput, UpdateUserInput } from '@/validations/user';

export class UserUseCases {
  static async createUser(actorId: string, input: CreateUserInput) {
    const existing = await UserRepository.findByEmail(input.email);
    if (existing) {
      throw new Error('E-mail já cadastrado.');
    }

    const passwordHash = await bcrypt.hash(input.password, 10);
    const user = await UserRepository.create({
      ...input,
      passwordHash,
    });

    // Auto-create default workload schedule and bank hours balance
    const schedule = await prisma.workSchedule.create({
      data: {
        userId: user.id,
        weeklyHours: 40,
        expectedDailyHours: 8,
        mondayEnabled: true,
        tuesdayEnabled: true,
        wednesdayEnabled: true,
        thursdayEnabled: true,
        fridayEnabled: true,
        saturdayEnabled: false,
        sundayEnabled: false,
        extraHoursMode: 'BANK_HOURS',
        startTime: '08:00',
        endTime: '17:00',
        expectedDailyMinutes: 480,
        weeklyMinutes: 2400,
        flexibleSchedule: false,
      },
    });

    // Create 7 days of the week
    const daysData = [];
    for (let day = 0; day < 7; day++) {
      const isWorking = day >= 1 && day <= 5; // Mon-Fri
      daysData.push({
        workScheduleId: schedule.id,
        dayOfWeek: day,
        enabled: isWorking,
        startTime: isWorking ? '08:00' : null,
        endTime: isWorking ? '17:00' : null,
        expectedDailyMinutes: isWorking ? 480 : 0,
      });
    }
    await prisma.workScheduleDay.createMany({
      data: daysData,
    });

    // Create lunch break for Mon-Fri
    const breaksData = [];
    for (let day = 1; day <= 5; day++) {
      breaksData.push({
        workScheduleId: schedule.id,
        dayOfWeek: day,
        name: 'Almoço',
        startTime: '12:00',
        endTime: '13:00',
        paid: false,
      });
    }
    await prisma.workScheduleBreak.createMany({
      data: breaksData,
    });

    await prisma.bankHoursBalance.create({
      data: {
        userId: user.id,
        currentBalanceMinutes: 0,
      },
    });

    await AuditLogRepository.create({
      userId: actorId,
      action: 'CREATE_USER',
      entity: 'User',
      entityId: user.id,
    });

    return user;
  }

  static async updateUser(actorId: string, targetUserId: string, input: Partial<UpdateUserInput>) {
    const user = await UserRepository.findById(targetUserId);
    if (!user) {
      throw new Error('Usuário não encontrado.');
    }

    if (input.email) {
      const existing = await UserRepository.findByEmail(input.email);
      if (existing && existing.id !== targetUserId) {
        throw new Error('E-mail já está sendo utilizado por outro usuário.');
      }
    }

    let passwordHash: string | undefined;
    if (input.password && input.password.trim() !== '') {
      passwordHash = await bcrypt.hash(input.password, 10);
    }

    const updatedUser = await UserRepository.update(targetUserId, {
      ...input,
      passwordHash,
    });

    await AuditLogRepository.create({
      userId: actorId,
      action: 'UPDATE_USER',
      entity: 'User',
      entityId: targetUserId,
    });

    return updatedUser;
  }

  static async listUsers(filters: { search?: string; active?: boolean }) {
    return UserRepository.findMany(filters);
  }

  static async getUser(id: string) {
    const user = await UserRepository.findById(id);
    if (!user) {
      throw new Error('Usuário não encontrado.');
    }
    return user;
  }
}
