export interface WorkScheduleDayData {
  dayOfWeek: number;
  enabled: boolean;
  startTime: string | null;
  endTime: string | null;
  expectedDailyMinutes: number;
}

export interface WorkScheduleBreakData {
  dayOfWeek: number;
  name: string;
  startTime: string;
  endTime: string;
  paid: boolean;
}

export interface AdvancedSchedule {
  weeklyHours: number;
  expectedDailyHours: number;
  extraHoursMode: 'BANK_HOURS' | 'OVERTIME';
  startTime?: string | null;
  endTime?: string | null;
  expectedDailyMinutes?: number;
  weeklyMinutes?: number;
  timezone?: string;
  flexibleSchedule?: boolean;
  days?: WorkScheduleDayData[];
  breaks?: WorkScheduleBreakData[];
}

export interface WorkloadResult {
  expectedMinutes: number;
  normalMinutes: number;
  extraMinutes: number;
  bankMinutes: number;
  deficitMinutes: number;
  plannedIn: Date | null;
  plannedOut: Date | null;
  plannedBreakMinutes: number;
  actualBreakMinutes: number;
  delayInMinutes: number;
  earlyOutMinutes: number;
  extraOutMinutes: number;
}

function getPlannedDate(baseDate: Date, timeStr: string | null): Date | null {
  if (!timeStr) return null;
  const [hrs, mins] = timeStr.split(':').map(Number);
  const d = new Date(baseDate);
  d.setHours(hrs, mins, 0, 0);
  return d;
}

export function calculateRecordWorkload(
  clockIn: Date,
  clockOut: Date,
  totalMinutes: number,
  schedule: AdvancedSchedule | null
): WorkloadResult {
  const dayOfWeek = clockIn.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat

  let dayConfig = schedule?.days?.find((d) => d.dayOfWeek === dayOfWeek);
  
  if (!dayConfig && schedule) {
    const isWorking = dayOfWeek >= 1 && dayOfWeek <= 5;
    dayConfig = {
      dayOfWeek,
      enabled: isWorking,
      startTime: isWorking ? (schedule.startTime || '08:00') : null,
      endTime: isWorking ? (schedule.endTime || '17:00') : null,
      expectedDailyMinutes: isWorking ? (schedule.expectedDailyMinutes || 480) : 0,
    };
  }

  if (!dayConfig) {
    const isWorking = dayOfWeek >= 1 && dayOfWeek <= 5;
    dayConfig = {
      dayOfWeek,
      enabled: isWorking,
      startTime: isWorking ? '08:00' : null,
      endTime: isWorking ? '17:00' : null,
      expectedDailyMinutes: isWorking ? 480 : 0,
    };
  }

  const isWorkingDay = dayConfig.enabled;
  const expectedMinutes = isWorkingDay ? dayConfig.expectedDailyMinutes : 0;
  const isFlexible = schedule?.flexibleSchedule || false;

  const plannedIn = isWorkingDay ? getPlannedDate(clockIn, dayConfig.startTime) : null;
  let plannedOut = isWorkingDay ? getPlannedDate(clockIn, dayConfig.endTime) : null;

  if (plannedIn && plannedOut && plannedOut < plannedIn) {
    plannedOut.setDate(plannedOut.getDate() + 1);
  }

  let delayInMinutes = 0;
  let earlyOutMinutes = 0;
  let extraOutMinutes = 0;

  if (isWorkingDay && !isFlexible && plannedIn && plannedOut) {
    const clockInTime = clockIn.getTime();
    const plannedInTime = plannedIn.getTime();
    const clockOutTime = clockOut.getTime();
    const plannedOutTime = plannedOut.getTime();

    if (clockInTime > plannedInTime) {
      delayInMinutes = Math.round((clockInTime - plannedInTime) / 60000);
    }
    if (clockOutTime < plannedOutTime) {
      earlyOutMinutes = Math.round((plannedOutTime - clockOutTime) / 60000);
    } else if (clockOutTime > plannedOutTime) {
      extraOutMinutes = Math.round((clockOutTime - plannedOutTime) / 60000);
    }
  }

  const dayBreaks = schedule?.breaks?.filter((b) => b.dayOfWeek === dayOfWeek) || [];
  
  let resolvedBreaks = dayBreaks;
  if (resolvedBreaks.length === 0 && isWorkingDay && !schedule?.breaks) {
    resolvedBreaks = [
      {
        dayOfWeek,
        name: 'Almoço',
        startTime: '12:00',
        endTime: '13:00',
        paid: false,
      },
    ];
  }

  let plannedBreakMinutes = 0;
  let actualBreakMinutes = 0;
  let unpaidIntersectionMinutes = 0;

  for (const brk of resolvedBreaks) {
    const breakStart = getPlannedDate(clockIn, brk.startTime);
    let breakEnd = getPlannedDate(clockIn, brk.endTime);

    if (breakStart && breakEnd) {
      if (breakEnd < breakStart) {
        breakEnd.setDate(breakEnd.getDate() + 1);
      }

      const breakDuration = Math.round((breakEnd.getTime() - breakStart.getTime()) / 60000);
      if (!brk.paid) {
        plannedBreakMinutes += breakDuration;
      }

      const startIntersect = Math.max(clockIn.getTime(), breakStart.getTime());
      const endIntersect = Math.min(clockOut.getTime(), breakEnd.getTime());
      const intersectMins = Math.max(0, Math.round((endIntersect - startIntersect) / 60000));

      actualBreakMinutes += intersectMins;
      if (!brk.paid) {
        unpaidIntersectionMinutes += intersectMins;
      }
    }
  }

  const totalElapsedMinutes = Math.max(0, Math.round((clockOut.getTime() - clockIn.getTime()) / 60000));
  const effectiveWorkedMinutes = Math.max(0, totalElapsedMinutes - unpaidIntersectionMinutes);

  const normalMinutes = Math.min(effectiveWorkedMinutes, expectedMinutes);
  const diff = effectiveWorkedMinutes - expectedMinutes;

  let extraMinutes = 0;
  let bankMinutes = 0;
  let deficitMinutes = 0;

  if (diff > 0) {
    if ((schedule?.extraHoursMode || 'BANK_HOURS') === 'BANK_HOURS') {
      bankMinutes = diff;
    } else {
      extraMinutes = diff;
    }
  } else if (diff < 0) {
    deficitMinutes = Math.abs(diff);
  }

  return {
    expectedMinutes,
    normalMinutes,
    extraMinutes,
    bankMinutes,
    deficitMinutes,
    plannedIn,
    plannedOut,
    plannedBreakMinutes,
    actualBreakMinutes,
    delayInMinutes,
    earlyOutMinutes,
    extraOutMinutes,
  };
}
