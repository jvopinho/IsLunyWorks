import { NextRequest } from 'next/server';
import { apiResponse, apiError, checkAuthAndPermission } from '@/lib/api-helper';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    await checkAuthAndPermission('workload.manage');
    
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || undefined;

    const whereClause: any = {};
    if (userId) {
      whereClause.userId = userId;
    }

    const schedules = await prisma.workSchedule.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        days: true,
        breaks: true,
      },
      orderBy: {
        user: { name: 'asc' },
      },
    });

    return apiResponse(schedules);
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const actor = await checkAuthAndPermission('workload.manage');
    const body = await request.json();
    const {
      userId,
      weeklyHours = 40,
      expectedDailyHours = 8,
      extraHoursMode = 'BANK_HOURS',
      startTime = '08:00',
      endTime = '17:00',
      expectedDailyMinutes = 480,
      weeklyMinutes = 2400,
      timezone = 'America/Sao_Paulo',
      flexibleSchedule = false,
    } = body;

    if (!userId) {
      return Response.json({ error: 'O campo userId é obrigatório.' }, { status: 400 });
    }

    const existing = await prisma.workSchedule.findUnique({
      where: { userId },
    });

    if (existing) {
      return Response.json({ error: 'Este colaborador já possui uma jornada configurada.' }, { status: 400 });
    }

    const schedule = await prisma.workSchedule.create({
      data: {
        userId,
        weeklyHours: parseFloat(weeklyHours),
        expectedDailyHours: parseFloat(expectedDailyHours),
        extraHoursMode,
        startTime,
        endTime,
        expectedDailyMinutes: parseInt(expectedDailyMinutes, 10),
        weeklyMinutes: parseInt(weeklyMinutes, 10),
        timezone,
        flexibleSchedule: Boolean(flexibleSchedule),
        mondayEnabled: true,
        tuesdayEnabled: true,
        wednesdayEnabled: true,
        thursdayEnabled: true,
        fridayEnabled: true,
        saturdayEnabled: false,
        sundayEnabled: false,
      },
    });

    const daysData = [];
    for (let day = 0; day < 7; day++) {
      const isWorking = day >= 1 && day <= 5;
      daysData.push({
        workScheduleId: schedule.id,
        dayOfWeek: day,
        enabled: isWorking,
        startTime: isWorking ? startTime : null,
        endTime: isWorking ? endTime : null,
        expectedDailyMinutes: isWorking ? expectedDailyMinutes : 0,
      });
    }
    await prisma.workScheduleDay.createMany({
      data: daysData,
    });

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

    await prisma.auditLog.create({
      data: {
        userId: actor.id,
        action: 'workload.schedule.created',
        entity: 'WorkSchedule',
        entityId: schedule.id,
        details: JSON.stringify({ userId, weeklyHours, expectedDailyHours, extraHoursMode }),
      },
    });

    return apiResponse(schedule, 201);
  } catch (error) {
    return apiError(error);
  }
}
