import { prisma } from '@/lib/prisma';

export class DashboardRepository {
  static async getGeneralStats() {
    const now = new Date();
    
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);

    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - 6);

    const monthStart = new Date(todayStart);
    monthStart.setDate(monthStart.getDate() - 29);

    const totalUsers = await prisma.user.count();
    const activeUsers = await prisma.user.count({ where: { active: true } });
    const adminCount = await prisma.user.count({ where: { role: { name: 'Administrador' } } });
    const totalRoles = await prisma.role.count();
    const totalPermissions = await prisma.permission.count();

    const todayRecords = await prisma.clockRecord.count({
      where: {
        clockIn: { gte: todayStart, lte: todayEnd },
      },
    });

    const todaySum = await prisma.clockRecord.aggregate({
      where: {
        clockIn: { gte: todayStart, lte: todayEnd },
        totalMinutes: { not: null },
      },
      _sum: {
        totalMinutes: true,
      },
    });

    const weeklySum = await prisma.clockRecord.aggregate({
      where: {
        clockIn: { gte: weekStart, lte: todayEnd },
        totalMinutes: { not: null },
      },
      _sum: {
        totalMinutes: true,
      },
    });

    const monthlySum = await prisma.clockRecord.aggregate({
      where: {
        clockIn: { gte: monthStart, lte: todayEnd },
        totalMinutes: { not: null },
      },
      _sum: {
        totalMinutes: true,
      },
    });

    return {
      totalUsers,
      activeUsers,
      adminCount,
      totalRoles,
      totalPermissions,
      todayRecords,
      todayHours: parseFloat(((todaySum._sum.totalMinutes || 0) / 60).toFixed(1)),
      weeklyHours: parseFloat(((weeklySum._sum.totalMinutes || 0) / 60).toFixed(1)),
      monthlyHours: parseFloat(((monthlySum._sum.totalMinutes || 0) / 60).toFixed(1)),
    };
  }

  static async getHoursAndRecordsChartData() {
    const now = new Date();
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - 29);
    startDate.setHours(0, 0, 0, 0);

    const records = await prisma.clockRecord.findMany({
      where: {
        clockIn: { gte: startDate },
      },
      select: {
        clockIn: true,
        totalMinutes: true,
      },
    });

    const chartMap = new Map<string, { hours: number; count: number }>();
    
    for (let i = 0; i < 30; i++) {
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

    return Array.from(chartMap.entries()).map(([date, val]) => ({
      date: date.split('-').reverse().slice(0, 2).reverse().join('/'), // DD/MM format
      fullDate: date,
      hours: parseFloat(val.hours.toFixed(1)),
      count: val.count,
    }));
  }

  static async getRolesChartData() {
    const roles = await prisma.role.findMany({
      select: {
        name: true,
        _count: {
          select: { users: true },
        },
      },
    });

    return roles.map((role) => ({
      name: role.name,
      value: role._count.users,
    })).filter((r) => r.value > 0);
  }

  static async getUsersGrowthData() {
    const users = await prisma.user.findMany({
      select: {
        createdAt: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    if (users.length === 0) return [];

    const start = new Date(users[0].createdAt);
    start.setHours(0, 0, 0, 0);

    const now = new Date();
    const daysDiff = Math.max(1, Math.round((now.getTime() - start.getTime()) / (24 * 3600 * 1000)));
    const limitDays = Math.min(daysDiff, 30); // Show last 30 days to match other charts

    const limitStart = new Date();
    limitStart.setDate(limitStart.getDate() - limitDays);
    limitStart.setHours(0, 0, 0, 0);

    let cumulativeCount = await prisma.user.count({
      where: {
        createdAt: { lt: limitStart },
      },
    });

    const records = await prisma.user.findMany({
      where: {
        createdAt: { gte: limitStart },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    const growthMap = new Map<string, number>();
    for (let i = 0; i <= limitDays; i++) {
      const date = new Date(limitStart);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      growthMap.set(dateStr, cumulativeCount);
    }

    for (const rec of records) {
      const dateStr = rec.createdAt.toISOString().split('T')[0];
      for (const [key, val] of growthMap.entries()) {
        if (key >= dateStr) {
          growthMap.set(key, val + 1);
        }
      }
    }

    return Array.from(growthMap.entries()).map(([date, count]) => ({
      date: date.split('-').reverse().slice(0, 2).reverse().join('/'),
      count,
    }));
  }

  static async getTopUsersHoursData(days: number) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const records = await prisma.clockRecord.findMany({
      where: {
        clockIn: { gte: startDate },
        totalMinutes: { not: null },
      },
      select: {
        userId: true,
        totalMinutes: true,
        user: {
          select: { name: true },
        },
      },
    });

    const userMinutesMap = new Map<string, { name: string; minutes: number }>();
    for (const rec of records) {
      const current = userMinutesMap.get(rec.userId) || { name: rec.user.name, minutes: 0 };
      userMinutesMap.set(rec.userId, {
        name: rec.user.name,
        minutes: current.minutes + (rec.totalMinutes || 0),
      });
    }

    const data = Array.from(userMinutesMap.values()).map((user) => ({
      name: user.name,
      hours: parseFloat((user.minutes / 60).toFixed(1)),
    }));

    return data.sort((a, b) => b.hours - a.hours).slice(0, 5);
  }

  static async getActivityTimeline() {
    return prisma.auditLog.findMany({
      take: 10,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });
  }
}
