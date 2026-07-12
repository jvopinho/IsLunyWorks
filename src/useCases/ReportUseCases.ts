import { ClockRecordRepository } from '@/repositories/ClockRecordRepository';

export interface ReportStats {
  totalRecords: number;
  totalMinutes: number;
  totalHours: string;
  dailyAverageMinutes: number;
  dailyAverageHours: string;
  daysCount: number;
}

export class ReportUseCases {
  static async generateReport(filters: {
    userId?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const start = filters.startDate ? new Date(filters.startDate) : undefined;
    if (start) start.setHours(0, 0, 0, 0);

    const end = filters.endDate ? new Date(filters.endDate) : undefined;
    if (end) end.setHours(23, 59, 59, 999);

    const records = await ClockRecordRepository.findMany({
      userId: filters.userId,
      startDate: start,
      endDate: end,
    });

    let totalMinutes = 0;
    const daysMap = new Map<string, { minutes: number; count: number }>();

    for (const record of records) {
      if (record.totalMinutes) {
        totalMinutes += record.totalMinutes;
      }

      const dateKey = record.clockIn.toISOString().split('T')[0];
      const current = daysMap.get(dateKey) || { minutes: 0, count: 0 };
      daysMap.set(dateKey, {
        minutes: current.minutes + (record.totalMinutes || 0),
        count: current.count + 1,
      });
    }

    const daysCount = daysMap.size;
    const totalHours = (totalMinutes / 60).toFixed(2);
    const dailyAverageMinutes = daysCount > 0 ? Math.round(totalMinutes / daysCount) : 0;
    const dailyAverageHours = (dailyAverageMinutes / 60).toFixed(2);

    const stats: ReportStats = {
      totalRecords: records.length,
      totalMinutes,
      totalHours,
      dailyAverageHours,
      dailyAverageMinutes,
      daysCount,
    };

    const days = Array.from(daysMap.entries()).map(([date, data]) => ({
      date,
      minutes: data.minutes,
      hours: (data.minutes / 60).toFixed(2),
      recordsCount: data.count,
    })).sort((a, b) => b.date.localeCompare(a.date));

    return {
      stats,
      days,
      records,
    };
  }
}
