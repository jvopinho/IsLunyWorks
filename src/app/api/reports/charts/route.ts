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

    const records = await prisma.clockRecord.findMany({
      where: whereClause,
      include: {
        user: { select: { name: true } },
      },
      orderBy: {
        clockIn: 'asc',
      },
    });

    // 1. Worked Hours per collaborator
    const collaboratorMap = new Map<string, number>();
    for (const r of records) {
      collaboratorMap.set(r.user.name, (collaboratorMap.get(r.user.name) || 0) + (r.totalMinutes || 0));
    }
    const workedHoursPerCollaborator = Array.from(collaboratorMap.entries()).map(([name, mins]) => ({
      name,
      hours: parseFloat((mins / 60).toFixed(1)),
    }));

    // 2. Worked Hours per week
    const getWeekNumber = (date: Date) => {
      const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
      const dayNum = d.getUTCDay() || 7;
      d.setUTCDate(d.getUTCDate() + 4 - dayNum);
      const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
      return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    };
    const weekMap = new Map<string, number>();
    for (const r of records) {
      const weekStr = `Semana ${getWeekNumber(r.clockIn)}`;
      weekMap.set(weekStr, (weekMap.get(weekStr) || 0) + (r.totalMinutes || 0));
    }
    const workedHoursPerWeek = Array.from(weekMap.entries()).map(([week, mins]) => ({
      week,
      hours: parseFloat((mins / 60).toFixed(1)),
    }));

    // 3. Worked Hours per month
    const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const monthMap = new Map<string, number>();
    for (const r of records) {
      const monthStr = `${monthNames[r.clockIn.getMonth()]}/${r.clockIn.getFullYear()}`;
      monthMap.set(monthStr, (monthMap.get(monthStr) || 0) + (r.totalMinutes || 0));
    }
    const workedHoursPerMonth = Array.from(monthMap.entries()).map(([month, mins]) => ({
      month,
      hours: parseFloat((mins / 60).toFixed(1)),
    }));

    // 4. Hours Distribution (Regular vs Overtime)
    let regularMinutes = 0;
    let overtimeMinutes = 0;
    const userDateMap = new Map<string, number>();
    for (const r of records) {
      const dateStr = r.clockIn.toISOString().split('T')[0];
      const key = `${r.userId}_${dateStr}`;
      userDateMap.set(key, (userDateMap.get(key) || 0) + (r.totalMinutes || 0));
    }
    for (const mins of userDateMap.values()) {
      if (mins > 480) {
        regularMinutes += 480;
        overtimeMinutes += (mins - 480);
      } else {
        regularMinutes += mins;
      }
    }
    const hoursDistribution = [
      { name: 'Horas Normais', value: parseFloat((regularMinutes / 60).toFixed(1)) },
      { name: 'Horas Extras', value: parseFloat((overtimeMinutes / 60).toFixed(1)) },
      { name: 'Banco de Horas', value: 0.0 },
    ];

    // 5. Worked hours growth/evolution
    const dayMap = new Map<string, number>();
    for (const r of records) {
      const dateStr = r.clockIn.toISOString().split('T')[0];
      dayMap.set(dateStr, (dayMap.get(dateStr) || 0) + (r.totalMinutes || 0));
    }
    const hoursEvolution = Array.from(dayMap.entries()).map(([date, mins]) => ({
      date: date.split('-').reverse().slice(0, 2).reverse().join('/'),
      hours: parseFloat((mins / 60).toFixed(1)),
    }));

    // 6. Entry/Exit Times Histograms
    const entryHistogram = new Map<number, number>();
    const exitHistogram = new Map<number, number>();
    for (let h = 0; h < 24; h++) {
      entryHistogram.set(h, 0);
      exitHistogram.set(h, 0);
    }
    for (const r of records) {
      const inHour = r.clockIn.getHours();
      entryHistogram.set(inHour, (entryHistogram.get(inHour) || 0) + 1);
      if (r.clockOut) {
        const outHour = r.clockOut.getHours();
        exitHistogram.set(outHour, (exitHistogram.get(outHour) || 0) + 1);
      }
    }
    const entryTimesHistogram = Array.from(entryHistogram.entries())
      .map(([hour, count]) => ({ hour: `${String(hour).padStart(2, '0')}h`, count }))
      .filter(h => h.count > 0 || (parseInt(h.hour) >= 6 && parseInt(h.hour) <= 21));

    const exitTimesHistogram = Array.from(exitHistogram.entries())
      .map(([hour, count]) => ({ hour: `${String(hour).padStart(2, '0')}h`, count }))
      .filter(h => h.count > 0 || (parseInt(h.hour) >= 12 && parseInt(h.hour) <= 22));

    return apiResponse({
      workedHoursPerCollaborator,
      workedHoursPerWeek,
      workedHoursPerMonth,
      hoursDistribution,
      hoursEvolution,
      entryTimesHistogram,
      exitTimesHistogram,
    });
  } catch (error) {
    return apiError(error);
  }
}
