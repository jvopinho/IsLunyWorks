import { NextRequest } from 'next/server';
import { apiResponse, apiError, checkAuthAndPermission } from '@/lib/api-helper';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    await checkAuthAndPermission('reports.view');

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || undefined;
    const startDate = searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined;
    const endDate = searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined;

    const whereClause: any = {};
    if (userId) whereClause.userId = userId;
    if (startDate || endDate) {
      whereClause.clockIn = {};
      if (startDate) whereClause.clockIn.gte = startDate;
      if (endDate) whereClause.clockIn.lte = endDate;
    }
    whereClause.totalMinutes = { not: null };

    const records = await prisma.clockRecord.findMany({
      where: whereClause,
      include: {
        user: { select: { name: true } },
      },
    });

    if (records.length === 0) {
      return apiResponse({
        totalHours: 0,
        dailyAverage: 0,
        weeklyAverage: 0,
        monthlyAverage: 0,
        topCollaborator: { name: '-', hours: 0 },
        leastCollaborator: { name: '-', hours: 0 },
        topDay: { date: '-', hours: 0 },
      });
    }

    const totalMinutes = records.reduce((sum, r) => sum + (r.totalMinutes || 0), 0);
    const totalHours = parseFloat((totalMinutes / 60).toFixed(1));

    const uniqueDays = new Set(records.map(r => r.clockIn.toISOString().split('T')[0]));
    const daysCount = uniqueDays.size || 1;
    const dailyAverage = parseFloat((totalHours / daysCount).toFixed(1));

    const getWeekNumber = (date: Date) => {
      const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
      const dayNum = d.getUTCDay() || 7;
      d.setUTCDate(d.getUTCDate() + 4 - dayNum);
      const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
      return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    };

    const uniqueWeeks = new Set(records.map(r => `${r.clockIn.getFullYear()}-W${getWeekNumber(r.clockIn)}`));
    const weeksCount = uniqueWeeks.size || 1;
    const weeklyAverage = parseFloat((totalHours / weeksCount).toFixed(1));

    const uniqueMonths = new Set(records.map(r => `${r.clockIn.getFullYear()}-${r.clockIn.getMonth() + 1}`));
    const monthsCount = uniqueMonths.size || 1;
    const monthlyAverage = parseFloat((totalHours / monthsCount).toFixed(1));

    const userMap = new Map<string, { name: string; minutes: number }>();
    for (const r of records) {
      const current = userMap.get(r.userId) || { name: r.user.name, minutes: 0 };
      userMap.set(r.userId, { name: current.name, minutes: current.minutes + (r.totalMinutes || 0) });
    }

    const userHoursList = Array.from(userMap.values()).map(u => ({
      name: u.name,
      hours: parseFloat((u.minutes / 60).toFixed(1)),
    }));

    userHoursList.sort((a, b) => b.hours - a.hours);
    const topCollaborator = userHoursList[0] || { name: '-', hours: 0 };
    const leastCollaborator = userHoursList[userHoursList.length - 1] || { name: '-', hours: 0 };

    const dayMap = new Map<string, number>();
    for (const r of records) {
      const dateStr = r.clockIn.toISOString().split('T')[0];
      dayMap.set(dateStr, (dayMap.get(dateStr) || 0) + (r.totalMinutes || 0));
    }
    const dayHoursList = Array.from(dayMap.entries()).map(([date, mins]) => ({
      date: date.split('-').reverse().join('/'),
      hours: parseFloat((mins / 60).toFixed(1)),
    }));
    dayHoursList.sort((a, b) => b.hours - a.hours);
    const topDay = dayHoursList[0] || { date: '-', hours: 0 };

    return apiResponse({
      totalHours,
      dailyAverage,
      weeklyAverage,
      monthlyAverage,
      topCollaborator,
      leastCollaborator,
      topDay,
    });
  } catch (error) {
    return apiError(error);
  }
}
