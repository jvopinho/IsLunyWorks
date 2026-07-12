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
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            workSchedule: true,
            bankHoursBalance: true,
          },
        },
      },
      orderBy: { clockIn: 'desc' },
    });

    const recordIds = records.map(r => r.id);
    const usedTransactions = await prisma.bankHoursTransaction.findMany({
      where: {
        referenceId: { in: recordIds },
        type: 'USED_IN_WORKDAY',
      },
      select: {
        referenceId: true,
        minutes: true,
      },
    });

    const usedMap = new Map<string, number>();
    for (const tx of usedTransactions) {
      if (tx.referenceId) {
        usedMap.set(tx.referenceId, (usedMap.get(tx.referenceId) || 0) + tx.minutes);
      }
    }

    let totalExpected = 0;
    let totalWorked = 0;
    let totalNormal = 0;
    let totalExtra = 0;
    let totalBank = 0;
    let totalUsed = 0;
    let totalDeficit = 0;

    let totalDelayMinutes = 0;
    let totalEarlyOutMinutes = 0;
    let totalExtraOutMinutes = 0;
    let totalBreakMinutes = 0;

    let delayCount = 0;
    let earlyOutCount = 0;
    let extraOutCount = 0;
    let completedCount = 0;

    const formattedRecords = records.map((r) => {
      const expected = r.expectedMinutes;
      const worked = r.totalMinutes || 0;
      const normal = r.normalMinutes;
      const extra = r.extraMinutes;
      const bank = r.bankMinutes;
      const deficit = r.deficitMinutes;
      const used = usedMap.get(r.id) || 0;

      totalExpected += expected;
      totalWorked += worked;
      totalNormal += normal;
      totalExtra += extra;
      totalBank += bank;
      totalUsed += used;
      totalDeficit += deficit;

      totalBreakMinutes += r.actualBreakMinutes;
      if (r.delayInMinutes > 0) {
        totalDelayMinutes += r.delayInMinutes;
        delayCount++;
      }
      if (r.earlyOutMinutes > 0) {
        totalEarlyOutMinutes += r.earlyOutMinutes;
        earlyOutCount++;
      }
      if (r.extraOutMinutes > 0) {
        totalExtraOutMinutes += r.extraOutMinutes;
        extraOutCount++;
      }
      if (expected > 0 && deficit === 0) {
        completedCount++;
      }

      let status = 'Jornada não cumprida';
      if (expected > 0) {
        if (deficit === 0) {
          status = 'Jornada cumprida';
        } else if (worked > 0) {
          status = 'Jornada parcialmente cumprida';
        }
      } else {
        status = worked > 0 ? 'Jornada cumprida (Extra)' : 'Sem expediente';
      }

      return {
        id: r.id,
        userId: r.userId,
        userName: r.user.name,
        userEmail: r.user.email,
        date: r.clockIn,
        clockIn: r.clockIn,
        clockOut: r.clockOut,
        expected,
        worked,
        normal,
        extra,
        bank,
        used,
        deficit,
        status,
        notes: r.notes,
        plannedIn: r.plannedIn,
        plannedOut: r.plannedOut,
        plannedBreakMinutes: r.plannedBreakMinutes,
        actualBreakMinutes: r.actualBreakMinutes,
        delayInMinutes: r.delayInMinutes,
        earlyOutMinutes: r.earlyOutMinutes,
        extraOutMinutes: r.extraOutMinutes,
      };
    });

    const diff = totalWorked - totalExpected;
    const balanceQuery = await prisma.bankHoursBalance.findMany({
      include: { user: { select: { name: true } } },
    });

    balanceQuery.sort((a, b) => b.currentBalanceMinutes - a.currentBalanceMinutes);
    const topBalanceUser = balanceQuery[0]
      ? { name: balanceQuery[0].user.name, hours: parseFloat((balanceQuery[0].currentBalanceMinutes / 60).toFixed(1)) }
      : { name: '-', hours: 0 };

    const extraUserMap = new Map<string, { name: string; minutes: number }>();
    for (const r of records) {
      const current = extraUserMap.get(r.userId) || { name: r.user.name, minutes: 0 };
      extraUserMap.set(r.userId, { name: current.name, minutes: current.minutes + r.extraMinutes });
    }
    const extraUserList = Array.from(extraUserMap.values()).sort((a, b) => b.minutes - a.minutes);
    const topExtraUser = extraUserList[0]
      ? { name: extraUserList[0].name, hours: parseFloat((extraUserList[0].minutes / 60).toFixed(1)) }
      : { name: '-', hours: 0 };

    const avgDelayMinutes = delayCount > 0 ? Math.round(totalDelayMinutes / delayCount) : 0;
    const avgExtraOutMinutes = extraOutCount > 0 ? Math.round(totalExtraOutMinutes / extraOutCount) : 0;
    const avgBreakMinutes = records.length > 0 ? Math.round(totalBreakMinutes / records.length) : 0;

    const fulfillmentPercentage = totalExpected > 0
      ? Math.round(((totalNormal + totalExtra) / totalExpected) * 100)
      : 100;

    return apiResponse({
      records: formattedRecords,
      kpis: {
        totalExpected: parseFloat((totalExpected / 60).toFixed(1)),
        totalWorked: parseFloat((totalWorked / 60).toFixed(1)),
        diff: parseFloat((diff / 60).toFixed(1)),
        totalBank: parseFloat((totalBank / 60).toFixed(1)),
        totalUsed: parseFloat((totalUsed / 60).toFixed(1)),
        totalExtra: parseFloat((totalExtra / 60).toFixed(1)),
        topBalanceUser,
        topExtraUser,
        delayCount,
        earlyOutCount,
        completedCount,
        avgDelayMinutes,
        avgExtraOutMinutes,
        avgBreakMinutes,
        fulfillmentPercentage,
      },
    });
  } catch (error) {
    return apiError(error);
  }
}
