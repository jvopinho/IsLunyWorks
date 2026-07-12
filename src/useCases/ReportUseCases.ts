import { ClockRecordRepository } from '@/repositories/ClockRecordRepository';

export interface ReportStats {
  totalRecords: number;
  totalMinutes: number;
  totalHours: string;
  dailyAverageMinutes: number;
  dailyAverageHours: string;
  daysCount: number;
  delayCount: number;
  earlyOutCount: number;
  extraOutCount: number;
  completedCount: number;
  avgDelayMinutes: number;
  avgExtraOutMinutes: number;
  avgBreakMinutes: number;
  totalExpectedHours: string;
  totalWorkedHours: string;
  fulfillmentPercentage: number;
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
    let totalExpectedMinutes = 0;
    let totalWorkedMinutes = 0;
    let totalDelayMinutes = 0;
    let totalEarlyOutMinutes = 0;
    let totalExtraOutMinutes = 0;
    let totalBreakMinutes = 0;

    let delayCount = 0;
    let earlyOutCount = 0;
    let extraOutCount = 0;
    let completedCount = 0;

    const daysMap = new Map<string, { minutes: number; count: number }>();

    for (const record of records) {
      if (record.totalMinutes) {
        totalMinutes += record.totalMinutes;
        totalWorkedMinutes += (record.normalMinutes + record.extraMinutes);
      }
      totalExpectedMinutes += record.expectedMinutes;
      totalBreakMinutes += record.actualBreakMinutes;

      if (record.delayInMinutes > 0) {
        totalDelayMinutes += record.delayInMinutes;
        delayCount++;
      }
      if (record.earlyOutMinutes > 0) {
        totalEarlyOutMinutes += record.earlyOutMinutes;
        earlyOutCount++;
      }
      if (record.extraOutMinutes > 0) {
        totalExtraOutMinutes += record.extraOutMinutes;
        extraOutCount++;
      }
      if (record.expectedMinutes > 0 && record.deficitMinutes === 0) {
        completedCount++;
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

    const avgDelayMinutes = delayCount > 0 ? Math.round(totalDelayMinutes / delayCount) : 0;
    const avgExtraOutMinutes = extraOutCount > 0 ? Math.round(totalExtraOutMinutes / extraOutCount) : 0;
    const avgBreakMinutes = records.length > 0 ? Math.round(totalBreakMinutes / records.length) : 0;

    const fulfillmentPercentage = totalExpectedMinutes > 0 
      ? Math.round((totalWorkedMinutes / totalExpectedMinutes) * 100)
      : 100;

    const stats: ReportStats = {
      totalRecords: records.length,
      totalMinutes,
      totalHours,
      dailyAverageHours,
      dailyAverageMinutes,
      daysCount,
      delayCount,
      earlyOutCount,
      extraOutCount,
      completedCount,
      avgDelayMinutes,
      avgExtraOutMinutes,
      avgBreakMinutes,
      totalExpectedHours: (totalExpectedMinutes / 60).toFixed(2),
      totalWorkedHours: (totalWorkedMinutes / 60).toFixed(2),
      fulfillmentPercentage,
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
