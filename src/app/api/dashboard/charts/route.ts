import { NextRequest } from 'next/server';
import { apiResponse, apiError, checkAuthAndPermission } from '@/lib/api-helper';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    await checkAuthAndPermission('admin');

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30', 10);
    const validDays = [7, 30, 90, 365].includes(days) ? days : 30;

    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - (validDays - 1));
    startDate.setHours(0, 0, 0, 0);

    // 1. Worked Hours & Records per day
    const records = await prisma.clockRecord.findMany({
      where: {
        clockIn: { gte: startDate },
      },
      select: {
        clockIn: true,
        clockOut: true,
        totalMinutes: true,
      },
    });

    const chartMap = new Map<string, { hours: number; count: number }>();
    for (let i = 0; i < validDays; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      chartMap.set(dateStr, { hours: 0, count: 0 });
    }

    for (const rec of records) {
      const dateStr = rec.clockIn.toISOString().split('T')[0];
      const current = chartMap.get(dateStr);
      if (current) {
        chartMap.set(dateStr, {
          hours: current.hours + ((rec.totalMinutes || 0) / 60),
          count: current.count + 1,
        });
      }
    }

    const hoursAndRecords = Array.from(chartMap.entries()).map(([date, val]) => ({
      date: date.split('-').reverse().slice(0, 2).reverse().join('/'),
      hours: parseFloat(val.hours.toFixed(1)),
      count: val.count,
    }));

    // 2. Average check-in/out times (last 30 days)
    const avgStart = new Date(now);
    avgStart.setDate(avgStart.getDate() - 29);
    avgStart.setHours(0, 0, 0, 0);

    const avgRecords = await prisma.clockRecord.findMany({
      where: { clockIn: { gte: avgStart } },
      select: { clockIn: true, clockOut: true },
    });

    const dayTimesMap = new Map<string, { inSum: number; inCount: number; outSum: number; outCount: number }>();
    for (let i = 0; i < 30; i++) {
      const dateObj = new Date(avgStart);
      dateObj.setDate(dateObj.getDate() + i);
      const dateStr = dateObj.toISOString().split('T')[0];
      dayTimesMap.set(dateStr, { inSum: 0, inCount: 0, outSum: 0, outCount: 0 });
    }

    for (const rec of avgRecords) {
      const dateStr = rec.clockIn.toISOString().split('T')[0];
      const current = dayTimesMap.get(dateStr);
      if (current) {
        const inMin = rec.clockIn.getHours() * 60 + rec.clockIn.getMinutes();
        let outMinSum = current.outSum;
        let outCount = current.outCount;
        
        if (rec.clockOut) {
          const outMin = rec.clockOut.getHours() * 60 + rec.clockOut.getMinutes();
          outMinSum += outMin;
          outCount += 1;
        }

        dayTimesMap.set(dateStr, {
          inSum: current.inSum + inMin,
          inCount: current.inCount + 1,
          outSum: outMinSum,
          outCount,
        });
      }
    }

    const avgTimesData = Array.from(dayTimesMap.entries()).map(([date, val]) => {
      const avgInMin = val.inCount > 0 ? val.inSum / val.inCount : 480; // default 08:00
      const avgOutMin = val.outCount > 0 ? val.outSum / val.outCount : 1020; // default 17:00
      return {
        date: date.split('-').reverse().slice(0, 2).reverse().join('/'),
        avgIn: parseFloat((avgInMin / 60).toFixed(2)),
        avgOut: parseFloat((avgOutMin / 60).toFixed(2)),
      };
    });

    // 3. Roles user count
    const roles = await prisma.role.findMany({
      select: {
        name: true,
        _count: { select: { users: true } },
      },
    });
    const rolesDistribution = roles
      .map((r) => ({ name: r.name, value: r._count.users }))
      .filter((r) => r.value > 0);

    // 4. Users growth (cumulative count in the last 30 days)
    const totalCountBefore = await prisma.user.count({
      where: { createdAt: { lt: avgStart } },
    });
    const usersCreated = await prisma.user.findMany({
      where: { createdAt: { gte: avgStart } },
      orderBy: { createdAt: 'asc' },
      select: { createdAt: true },
    });

    const growthMap = new Map<string, number>();
    for (let i = 0; i < 30; i++) {
      const date = new Date(avgStart);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      growthMap.set(dateStr, totalCountBefore);
    }

    for (const u of usersCreated) {
      const dateStr = u.createdAt.toISOString().split('T')[0];
      for (const [key, val] of growthMap.entries()) {
        if (key >= dateStr) {
          growthMap.set(key, val + 1);
        }
      }
    }
    const usersGrowth = Array.from(growthMap.entries()).map(([date, count]) => ({
      date: date.split('-').reverse().slice(0, 2).reverse().join('/'),
      count,
    }));

    // 5. Recent registered users
    const recentUsers = await prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        role: { select: { name: true } },
      },
    });

    return apiResponse({
      hoursAndRecords,
      avgTimesData,
      rolesDistribution,
      usersGrowth,
      recentUsers: recentUsers.map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        createdAt: u.createdAt,
        role: u.role?.name || 'Colaborador',
      })),
    });
  } catch (error) {
    return apiError(error);
  }
}
