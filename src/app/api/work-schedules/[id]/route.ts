import { NextRequest } from 'next/server';
import { apiResponse, apiError, checkAuthAndPermission } from '@/lib/api-helper';
import { prisma } from '@/lib/prisma';
import { AuditLogRepository } from '@/repositories/AuditLogRepository';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const actor = await checkAuthAndPermission('workload.manage');
    const { id } = await params;

    const body = await request.json();
    const {
      weeklyHours,
      expectedDailyHours,
      mondayEnabled,
      tuesdayEnabled,
      wednesdayEnabled,
      thursdayEnabled,
      fridayEnabled,
      saturdayEnabled,
      sundayEnabled,
      extraHoursMode,
      startTime,
      endTime,
      expectedDailyMinutes,
      weeklyMinutes,
      timezone,
      flexibleSchedule,
      days,
      reason,
    } = body;

    const existing = await prisma.workSchedule.findUnique({
      where: { id },
      include: {
        user: { select: { name: true, email: true } },
        days: true,
      },
    });

    if (!existing) {
      return Response.json({ error: 'Jornada de trabalho não encontrada.' }, { status: 404 });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const parent = await tx.workSchedule.update({
        where: { id },
        data: {
          weeklyHours: weeklyHours !== undefined ? parseFloat(weeklyHours) : undefined,
          expectedDailyHours: expectedDailyHours !== undefined ? parseFloat(expectedDailyHours) : undefined,
          mondayEnabled: mondayEnabled !== undefined ? Boolean(mondayEnabled) : undefined,
          tuesdayEnabled: tuesdayEnabled !== undefined ? Boolean(tuesdayEnabled) : undefined,
          wednesdayEnabled: wednesdayEnabled !== undefined ? Boolean(wednesdayEnabled) : undefined,
          thursdayEnabled: thursdayEnabled !== undefined ? Boolean(thursdayEnabled) : undefined,
          fridayEnabled: fridayEnabled !== undefined ? Boolean(fridayEnabled) : undefined,
          saturdayEnabled: saturdayEnabled !== undefined ? Boolean(saturdayEnabled) : undefined,
          sundayEnabled: sundayEnabled !== undefined ? Boolean(sundayEnabled) : undefined,
          extraHoursMode: extraHoursMode !== undefined ? extraHoursMode : undefined,
          startTime: startTime !== undefined ? startTime : undefined,
          endTime: endTime !== undefined ? endTime : undefined,
          expectedDailyMinutes: expectedDailyMinutes !== undefined ? parseInt(expectedDailyMinutes, 10) : undefined,
          weeklyMinutes: weeklyMinutes !== undefined ? parseInt(weeklyMinutes, 10) : undefined,
          timezone: timezone !== undefined ? timezone : undefined,
          flexibleSchedule: flexibleSchedule !== undefined ? Boolean(flexibleSchedule) : undefined,
        },
      });

      if (days && Array.isArray(days)) {
        for (const d of days) {
          await tx.workScheduleDay.upsert({
            where: {
              workScheduleId_dayOfWeek: {
                workScheduleId: id,
                dayOfWeek: d.dayOfWeek,
              },
            },
            update: {
              enabled: d.enabled,
              startTime: d.startTime,
              endTime: d.endTime,
              expectedDailyMinutes: d.expectedDailyMinutes,
            },
            create: {
              workScheduleId: id,
              dayOfWeek: d.dayOfWeek,
              enabled: d.enabled,
              startTime: d.startTime,
              endTime: d.endTime,
              expectedDailyMinutes: d.expectedDailyMinutes,
            },
          });
        }
      }

      return parent;
    });

    const diff = {
      previous: {
        weeklyHours: existing.weeklyHours,
        expectedDailyHours: existing.expectedDailyHours,
        mondayEnabled: existing.mondayEnabled,
        tuesdayEnabled: existing.tuesdayEnabled,
        wednesdayEnabled: existing.wednesdayEnabled,
        thursdayEnabled: existing.thursdayEnabled,
        fridayEnabled: existing.fridayEnabled,
        saturdayEnabled: existing.saturdayEnabled,
        sundayEnabled: existing.sundayEnabled,
        extraHoursMode: existing.extraHoursMode,
        startTime: existing.startTime,
        endTime: existing.endTime,
        expectedDailyMinutes: existing.expectedDailyMinutes,
        weeklyMinutes: existing.weeklyMinutes,
        timezone: existing.timezone,
        flexibleSchedule: existing.flexibleSchedule,
        days: existing.days,
      },
      current: {
        ...updated,
        days,
      },
      owner: {
        name: existing.user.name,
        email: existing.user.email,
      },
    };

    await AuditLogRepository.create({
      userId: actor.id,
      action: 'workload.schedule.updated',
      entity: 'WorkSchedule',
      entityId: id,
      details: JSON.stringify(diff),
      reason: reason || 'Atualização de jornada de trabalho pelo gestor',
    });

    return apiResponse(updated);
  } catch (error) {
    return apiError(error);
  }
}
