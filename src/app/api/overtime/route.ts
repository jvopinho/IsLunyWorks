import { NextRequest } from 'next/server';
import { apiResponse, apiError, checkAuthAndPermission } from '@/lib/api-helper';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    await checkAuthAndPermission('overtime.view');

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined;
    const endDate = searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined;

    const whereClause: any = {
      extraMinutes: { gt: 0 }
    };

    if (startDate || endDate) {
      whereClause.clockIn = {};
      if (startDate) whereClause.clockIn.gte = startDate;
      if (endDate) whereClause.clockIn.lte = endDate;
    }

    const records = await prisma.clockRecord.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: { clockIn: 'asc' },
    });

    const totalOvertimeMinutes = records.reduce((sum, r) => sum + r.extraMinutes, 0);
    const totalOvertimeHours = parseFloat((totalOvertimeMinutes / 60).toFixed(1));

    const userOvertimeMap = new Map<string, { name: string; minutes: number }>();
    for (const r of records) {
      const current = userOvertimeMap.get(r.userId) || { name: r.user.name, minutes: 0 };
      userOvertimeMap.set(r.userId, { name: current.name, minutes: current.minutes + r.extraMinutes });
    }
    const userOvertimeList = Array.from(userOvertimeMap.values()).map(u => ({
      name: u.name,
      hours: parseFloat((u.minutes / 60).toFixed(1)),
    })).sort((a, b) => b.hours - a.hours);

    const dateOvertimeMap = new Map<string, number>();
    for (const r of records) {
      const dateStr = r.clockIn.toISOString().split('T')[0];
      dateOvertimeMap.set(dateStr, (dateOvertimeMap.get(dateStr) || 0) + r.extraMinutes);
    }
    const dailyOvertimeList = Array.from(dateOvertimeMap.entries()).map(([date, mins]) => ({
      date: date.split('-').reverse().slice(0, 2).reverse().join('/'),
      hours: parseFloat((mins / 60).toFixed(1)),
    }));

    return apiResponse({
      totalOvertimeHours,
      userOvertimeList,
      dailyOvertimeList,
    });
  } catch (error) {
    return apiError(error);
  }
}
