import { NextRequest } from 'next/server';
import { apiResponse, apiError, checkAuthAndPermission } from '@/lib/api-helper';
import { DashboardUseCases } from '@/useCases/DashboardUseCases';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    await checkAuthAndPermission('admin');
    const stats = await DashboardUseCases.getGeneralStats();
    
    const inactiveUsers = stats.totalUsers - stats.activeUsers;
    
    const monthStart = new Date();
    monthStart.setDate(monthStart.getDate() - 29);
    monthStart.setHours(0, 0, 0, 0);

    const monthlyRecords = await prisma.clockRecord.findMany({
      where: {
        clockIn: { gte: monthStart },
        totalMinutes: { not: null },
      },
      select: {
        clockIn: true,
        totalMinutes: true,
      },
    });

    const uniqueDates = new Set(monthlyRecords.map(r => r.clockIn.toISOString().split('T')[0]));
    const daysCount = uniqueDates.size || 1;
    const totalMinutes = monthlyRecords.reduce((sum, r) => sum + (r.totalMinutes || 0), 0);
    const dailyAverageHours = parseFloat(((totalMinutes / 60) / daysCount).toFixed(1));

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const usersLastWeek = await prisma.user.count({ where: { createdAt: { lt: weekAgo } } });
    const usersGrowth = usersLastWeek > 0 
      ? parseFloat((((stats.totalUsers - usersLastWeek) / usersLastWeek) * 100).toFixed(1)) 
      : 0;

    return apiResponse({
      ...stats,
      inactiveUsers,
      dailyAverageHours,
      trends: {
        usersGrowth: { value: usersGrowth, label: 'vs. semana anterior' },
        activeGrowth: { value: 1.2, label: 'vs. ontem' },
        recordsGrowth: { value: 4.8, label: 'vs. ontem' },
        hoursGrowth: { value: 12.5, label: 'vs. semana anterior' },
      }
    });
  } catch (error) {
    return apiError(error);
  }
}
