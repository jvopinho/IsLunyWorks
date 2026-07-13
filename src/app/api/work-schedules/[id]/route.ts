import { NextRequest } from 'next/server';
import { apiResponse, apiError, checkAuthAndPermission } from '@/lib/api-helper';
import { prisma } from '@/lib/prisma';
import { AuditLogRepository } from '@/repositories/AuditLogRepository';

function isValidTimeStr(timeStr: string | null | undefined): boolean {
  if (!timeStr) return false;
  const match = timeStr.match(/^(\d{2}):(\d{2})$/);
  if (!match) return false;
  const hrs = parseInt(match[1], 10);
  const mins = parseInt(match[2], 10);
  return hrs >= 0 && hrs < 24 && mins >= 0 && mins < 60;
}

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

    // Load current breaks from db to compute correct expected daily minutes
    const currentBreaks = await prisma.workScheduleBreak.findMany({
      where: { workScheduleId: id },
    });

    // Merge days from request with existing day records
    const mergedDays = [0, 1, 2, 3, 4, 5, 6].map((dayNum) => {
      const incoming = Array.isArray(days) ? days.find((d: any) => d.dayOfWeek === dayNum) : null;
      const exist = existing.days.find((d: any) => d.dayOfWeek === dayNum);

      let enabled = exist ? exist.enabled : false;
      let dStart = exist ? exist.startTime : null;
      let dEnd = exist ? exist.endTime : null;

      if (incoming) {
        enabled = Boolean(incoming.enabled);
        dStart = incoming.startTime;
        dEnd = incoming.endTime;
      } else {
        // Fallback to checking individual boolean fields in request body
        const boolMap: Record<number, boolean | undefined> = {
          1: mondayEnabled,
          2: tuesdayEnabled,
          3: wednesdayEnabled,
          4: thursdayEnabled,
          5: fridayEnabled,
          6: saturdayEnabled,
          0: sundayEnabled,
        };
        const requestBool = boolMap[dayNum];
        if (requestBool !== undefined) {
          enabled = Boolean(requestBool);
          if (enabled && !dStart) {
            dStart = startTime || '08:00';
            dEnd = endTime || '17:00';
          }
        }
      }

      return {
        dayOfWeek: dayNum,
        enabled,
        startTime: dStart,
        endTime: dEnd,
      };
    });

    // Validations:
    // 1. At least one working day must be enabled
    const hasActiveDay = mergedDays.some((d) => d.enabled === true);
    if (!hasActiveDay) {
      return Response.json({ error: 'Pelo menos um dia de expediente deve estar ativo.' }, { status: 400 });
    }

    // 2. Active days must have valid start/end times
    for (const d of mergedDays) {
      if (d.enabled) {
        if (!isValidTimeStr(d.startTime) || !isValidTimeStr(d.endTime)) {
          return Response.json({
            error: `O dia de expediente ativo (${d.dayOfWeek}) deve possuir uma configuração válida de horário de entrada e saída.`
          }, { status: 400 });
        }
      }
    }

    const dayMinutesMap = new Map<number, number>();
    const dayEnabledMap = new Map<number, boolean>();

    const updated = await prisma.$transaction(async (tx) => {
      // Upsert WorkScheduleDays and compute daily expected minutes
      for (const d of mergedDays) {
        let expectedMins = 0;
        let finalStartTime = d.startTime;
        let finalEndTime = d.endTime;

        if (d.enabled && finalStartTime && finalEndTime) {
          const [sh, sm] = finalStartTime.split(':').map(Number);
          const [eh, em] = finalEndTime.split(':').map(Number);
          let diff = (eh * 60 + em) - (sh * 60 + sm);
          if (diff < 0) diff += 24 * 60; // Overnight shift

          // Subtract unpaid breaks for this day
          const unpaidBreaks = currentBreaks.filter((b) => b.dayOfWeek === d.dayOfWeek && !b.paid);
          let breakMins = 0;
          for (const b of unpaidBreaks) {
            const [bsh, bsm] = b.startTime.split(':').map(Number);
            const [beh, bem] = b.endTime.split(':').map(Number);
            let bdiff = (beh * 60 + bem) - (bsh * 60 + bsm);
            if (bdiff < 0) bdiff += 24 * 60;
            breakMins += bdiff;
          }
          expectedMins = Math.max(0, diff - breakMins);
        } else {
          // Disabled day: reset start/end times and expected minutes to 0
          expectedMins = 0;
          finalStartTime = null;
          finalEndTime = null;
        }

        dayMinutesMap.set(d.dayOfWeek, expectedMins);
        dayEnabledMap.set(d.dayOfWeek, d.enabled);

        await tx.workScheduleDay.upsert({
          where: {
            workScheduleId_dayOfWeek: {
              workScheduleId: id,
              dayOfWeek: d.dayOfWeek,
            },
          },
          update: {
            enabled: d.enabled,
            startTime: finalStartTime,
            endTime: finalEndTime,
            expectedDailyMinutes: expectedMins,
          },
          create: {
            workScheduleId: id,
            dayOfWeek: d.dayOfWeek,
            enabled: d.enabled,
            startTime: finalStartTime,
            endTime: finalEndTime,
            expectedDailyMinutes: expectedMins,
          },
        });
      }

      // Calculate aggregates
      const computedWeeklyMinutes = Array.from(dayMinutesMap.values()).reduce((sum, m) => sum + m, 0);
      const computedWeeklyHours = computedWeeklyMinutes / 60.0;
      const activeDaysCount = Array.from(dayEnabledMap.values()).filter(Boolean).length;
      const computedExpectedDailyMinutes = activeDaysCount > 0 ? Math.round(computedWeeklyMinutes / activeDaysCount) : 480;
      const computedExpectedDailyHours = computedExpectedDailyMinutes / 60.0;

      // Update parent WorkSchedule record
      const parent = await tx.workSchedule.update({
        where: { id },
        data: {
          weeklyHours: computedWeeklyHours,
          expectedDailyHours: computedExpectedDailyHours,
          expectedDailyMinutes: computedExpectedDailyMinutes,
          weeklyMinutes: computedWeeklyMinutes,
          mondayEnabled: dayEnabledMap.get(1) ?? false,
          tuesdayEnabled: dayEnabledMap.get(2) ?? false,
          wednesdayEnabled: dayEnabledMap.get(3) ?? false,
          thursdayEnabled: dayEnabledMap.get(4) ?? false,
          fridayEnabled: dayEnabledMap.get(5) ?? false,
          saturdayEnabled: dayEnabledMap.get(6) ?? false,
          sundayEnabled: dayEnabledMap.get(0) ?? false,
          extraHoursMode: extraHoursMode !== undefined ? extraHoursMode : undefined,
          startTime: startTime !== undefined ? startTime : undefined,
          endTime: endTime !== undefined ? endTime : undefined,
          timezone: timezone !== undefined ? timezone : undefined,
          flexibleSchedule: flexibleSchedule !== undefined ? Boolean(flexibleSchedule) : undefined,
        },
      });

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
        days: mergedDays,
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
