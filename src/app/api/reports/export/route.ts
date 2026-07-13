import { NextRequest } from 'next/server';
import { checkAuthAndPermission, apiError } from '@/lib/api-helper';
import { prisma } from '@/lib/prisma';
import { ExcelExportService } from '@/services/excel/ExcelExportService';
import { formatDate, formatDateTime } from '@/utils/date';
import { AuditLogRepository } from '@/repositories/AuditLogRepository';

const WEEKDAYS = [
  'Domingo',
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado'
];

export async function GET(request: NextRequest) {
  try {
    const actor = await checkAuthAndPermission('reports.export');
    
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || undefined;
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;

    const whereClause: any = {};
    if (userId) whereClause.userId = userId;
    
    const dbStartDate = startDate ? new Date(startDate) : undefined;
    const dbEndDate = endDate ? new Date(endDate) : undefined;
    
    if (dbStartDate || dbEndDate) {
      whereClause.clockIn = {};
      if (dbStartDate) whereClause.clockIn.gte = dbStartDate;
      if (dbEndDate) whereClause.clockIn.lte = dbEndDate;
    }

    const records = await prisma.clockRecord.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: { select: { name: true } },
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

    const txWhereClause: any = {};
    if (userId) txWhereClause.userId = userId;
    if (dbStartDate || dbEndDate) {
      txWhereClause.createdAt = {};
      if (dbStartDate) txWhereClause.createdAt.gte = dbStartDate;
      if (dbEndDate) txWhereClause.createdAt.lte = dbEndDate;
    }

    const transactions = await prisma.bankHoursTransaction.findMany({
      where: txWhereClause,
      include: {
        user: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Query work schedules configuration for users
    const schedulesList = await prisma.workSchedule.findMany({
      where: userId ? { userId } : {},
      include: {
        user: { select: { name: true, email: true } },
        days: { orderBy: { dayOfWeek: 'asc' } },
        breaks: { orderBy: [ { dayOfWeek: 'asc' }, { startTime: 'asc' } ] },
      },
    });

    const periodStr = startDate && endDate
      ? `${formatDate(startDate)} a ${formatDate(endDate)}`
      : startDate
        ? `A partir de ${formatDate(startDate)}`
        : endDate
          ? `Até ${formatDate(endDate)}`
          : 'Geral (Todo o histórico)';

    let totalExpected = 0;
    let totalWorked = 0;
    let totalNormal = 0;
    let totalExtra = 0;
    let totalBank = 0;
    let totalUsed = 0;
    let totalDeficit = 0;

    const data = records.map((rec: any) => {
      const expected = rec.expectedMinutes;
      const worked = rec.totalMinutes || 0;
      const normal = rec.normalMinutes;
      const extra = rec.extraMinutes;
      const bank = rec.bankMinutes;
      const deficit = rec.deficitMinutes;
      const used = usedMap.get(rec.id) || 0;

      totalExpected += expected;
      totalWorked += worked;
      totalNormal += normal;
      totalExtra += extra;
      totalBank += bank;
      totalUsed += used;
      totalDeficit += deficit;

      let status = 'Jornada nao cumprida';
      if (expected > 0) {
        if (deficit === 0) {
          status = 'Jornada cumprida';
        } else if (worked > 0) {
          status = 'Jornada parcialmente cumprida';
        }
      } else {
        status = worked > 0 ? 'Jornada cumprida (Extra)' : 'Sem expediente';
      }

      const plannedInStr = rec.plannedIn ? new Date(rec.plannedIn).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '-';
      const plannedOutStr = rec.plannedOut ? new Date(rec.plannedOut).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '-';

      const delayStr = rec.delayInMinutes > 0 ? `+${rec.delayInMinutes} min` : 'No horário';
      
      let outDiffStr = 'No horário';
      if (rec.earlyOutMinutes > 0) {
        outDiffStr = `-${rec.earlyOutMinutes} min`;
      } else if (rec.extraOutMinutes > 0) {
        outDiffStr = `+${rec.extraOutMinutes} min`;
      }

      const balance = (worked - expected) / 60;

      return {
        user: rec.user.name,
        email: rec.user.email,
        role: rec.user.role?.name || '-',
        date: formatDate(rec.clockIn),
        plannedIn: plannedInStr,
        clockIn: formatDateTime(rec.clockIn),
        delay: delayStr,
        plannedOut: plannedOutStr,
        clockOut: rec.clockOut ? formatDateTime(rec.clockOut) : 'Em aberto',
        outDiff: outDiffStr,
        expected: (expected / 60).toFixed(2),
        worked: (worked / 60).toFixed(2),
        breaks: (rec.actualBreakMinutes / 60).toFixed(2),
        normal: (normal / 60).toFixed(2),
        extra: (extra / 60).toFixed(2),
        bank: (bank / 60).toFixed(2),
        used: (used / 60).toFixed(2),
        deficit: (deficit / 60).toFixed(2),
        balance: balance.toFixed(2),
        status,
        notes: rec.notes || '',
      };
    });

    const summaryItems = [
      { label: 'Total de Registros', value: records.length },
      { label: 'Carga Horária Prevista', value: `${(totalExpected / 60).toFixed(1)}h` },
      { label: 'Carga Horária Realizada', value: `${(totalWorked / 60).toFixed(1)}h` },
      { label: 'Diferença Líquida (Saldo)', value: `${((totalWorked - totalExpected) / 60).toFixed(1)}h` },
      { label: 'Total Horas Regulares', value: `${(totalNormal / 60).toFixed(1)}h` },
      { label: 'Total Horas Extras', value: `${(totalExtra / 60).toFixed(1)}h` },
      { label: 'Acumulado Banco (+)', value: `${(totalBank / 60).toFixed(1)}h` },
      { label: 'Compensado Banco (-)', value: `${(totalUsed / 60).toFixed(1)}h` },
    ];

    const recordColumns = [
      { header: 'Colaborador', key: 'user' },
      { header: 'E-mail', key: 'email' },
      { header: 'Cargo', key: 'role' },
      { header: 'Data', key: 'date' },
      { header: 'Entrada Prevista', key: 'plannedIn' },
      { header: 'Entrada Realizada', key: 'clockIn' },
      { header: 'Atraso Entrada', key: 'delay' },
      { header: 'Saída Prevista', key: 'plannedOut' },
      { header: 'Saída Realizada', key: 'clockOut' },
      { header: 'Desvio Saída', key: 'outDiff' },
      { header: 'Tempo Previsto (h)', key: 'expected' },
      { header: 'Tempo Trabalhado (h)', key: 'worked' },
      { header: 'Tempo em Pausas (h)', key: 'breaks' },
      { header: 'Horas Normais (h)', key: 'normal' },
      { header: 'Horas Extras (h)', key: 'extra' },
      { header: 'Banco Depositado (h)', key: 'bank' },
      { header: 'Banco Compensado (h)', key: 'used' },
      { header: 'Déficit (h)', key: 'deficit' },
      { header: 'Saldo (h)', key: 'balance' },
      { header: 'Status Jornada', key: 'status' },
      { header: 'Observações', key: 'notes' },
    ];

    const translateTxType = (type: string) => {
      switch (type) {
        case 'WORKED_EXTRA': return 'Hora Extra Batida';
        case 'MANUAL_CREDIT': return 'Crédito Manual';
        case 'MANUAL_DEBIT': return 'Débito Manual';
        case 'USED_IN_WORKDAY': return 'Compensação Dia';
        case 'ADJUSTMENT': return 'Ajuste Geral';
        default: return type;
      }
    };

    const transactionColumns = [
      { header: 'Colaborador', key: 'user' },
      { header: 'E-mail', key: 'email' },
      { header: 'Data e Hora', key: 'createdAt' },
      { header: 'Operação', key: 'type' },
      { header: 'Minutos', key: 'minutes', numFmt: '#,##0' },
      { header: 'Horas Equivalentes', key: 'hours' },
      { header: 'Justificativa / Motivo', key: 'reason' },
    ];

    const transactionData = transactions.map((t: any) => ({
      user: t.user.name,
      email: t.user.email,
      createdAt: formatDateTime(t.createdAt),
      type: translateTxType(t.type),
      minutes: t.minutes,
      hours: (t.minutes / 60).toFixed(2),
      reason: t.reason,
    }));

    const scheduleColumns = [
      { header: 'Colaborador', key: 'user' },
      { header: 'E-mail', key: 'email' },
      { header: 'Dia da Semana', key: 'dayName' },
      { header: 'Expediente Ativo', key: 'enabled' },
      { header: 'Entrada Prevista', key: 'startTime' },
      { header: 'Saída Prevista', key: 'endTime' },
      { header: 'Carga Prevista (h)', key: 'expectedHours' },
      { header: 'Horário Flexível', key: 'flexible' },
      { header: 'Intervalos Configurados', key: 'breaksList' },
    ];

    const scheduleData: any[] = [];
    for (const sched of schedulesList) {
      for (let day = 0; day < 7; day++) {
        const dayConfig = sched.days.find(d => d.dayOfWeek === day);
        const dayBreaks = sched.breaks.filter(b => b.dayOfWeek === day);

        const breaksStr = dayBreaks.map(b => `${b.name}: ${b.startTime} às ${b.endTime} (${b.paid ? 'Remunerado' : 'Não rem.'})`).join(' | ');

        scheduleData.push({
          user: sched.user.name,
          email: sched.user.email,
          dayName: WEEKDAYS[day],
          enabled: dayConfig?.enabled ? 'Sim' : 'Não (Folga)',
          startTime: dayConfig?.startTime || '-',
          endTime: dayConfig?.endTime || '-',
          expectedHours: dayConfig?.enabled ? (dayConfig.expectedDailyMinutes / 60).toFixed(2) : '0.00',
          flexible: sched.flexibleSchedule ? 'Sim' : 'Não',
          breaksList: breaksStr || 'Sem intervalos',
        });
      }
    }

    const xlsxBuffer = await ExcelExportService.exportToExcel({
      title: 'Relatório Consolidado de Jornada e Banco de Horas',
      responsibleName: actor.name || 'Administrador',
      period: periodStr,
      sheets: [
        {
          name: 'Resumo Indicadores',
          isSummary: true,
          summaryItems,
          data: [],
        },
        {
          name: 'Registros Detalhados',
          columns: recordColumns,
          data,
        },
        {
          name: 'Extrato Banco de Horas',
          columns: transactionColumns,
          data: transactionData,
        },
        {
          name: 'Configuracao de Jornadas',
          columns: scheduleColumns,
          data: scheduleData,
        },
      ],
    });

    await AuditLogRepository.create({
      userId: actor.id,
      action: 'EXPORT_REPORTS',
      entity: 'ClockRecord',
    });

    const fileDate = new Date().toISOString().split('T')[0];
    const fileName = `isluny-works-jornada-${fileDate}.xlsx`;

    return new Response(new Uint8Array(xlsxBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    return apiError(error);
  }
}
