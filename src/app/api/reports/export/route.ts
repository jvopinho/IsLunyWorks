import { NextRequest } from 'next/server';
import { checkAuthAndPermission, apiError } from '@/lib/api-helper';
import { ReportUseCases } from '@/useCases/ReportUseCases';
import { ExcelExportService } from '@/services/excel/ExcelExportService';
import { formatDate, formatDateTime } from '@/utils/date';
import { AuditLogRepository } from '@/repositories/AuditLogRepository';

export async function GET(request: NextRequest) {
  try {
    const actor = await checkAuthAndPermission('reports.export');
    
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || undefined;
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;

    const report = await ReportUseCases.generateReport({
      userId,
      startDate,
      endDate,
    });

    const periodStr = startDate && endDate
      ? `${formatDate(startDate)} a ${formatDate(endDate)}`
      : startDate
        ? `A partir de ${formatDate(startDate)}`
        : endDate
          ? `Até ${formatDate(endDate)}`
          : 'Geral (Todo o histórico)';

    // Sheet 1: Summary
    const summaryItems = [
      { label: 'Total de Registros', value: report.stats.totalRecords },
      { label: 'Total de Horas Trabalhadas', value: `${parseFloat(report.stats.totalHours).toFixed(1)}h` },
      { label: 'Média Diária', value: `${parseFloat(report.stats.dailyAverageHours).toFixed(1)}h` },
      { label: 'Total de Dias com Expediente', value: report.stats.daysCount },
    ];

    // Sheet 2: Detailed Table
    const columns = [
      { header: 'Colaborador', key: 'user' },
      { header: 'E-mail', key: 'email' },
      { header: 'Cargo', key: 'role' },
      { header: 'Data', key: 'date' },
      { header: 'Entrada', key: 'clockIn' },
      { header: 'Saída', key: 'clockOut' },
      { header: 'Total de Horas', key: 'hours' },
      { header: 'Total em Minutos', key: 'minutes', numFmt: '#,##0' },
      { header: 'Observações', key: 'notes' },
    ];

    const data = report.records.map((rec: any) => ({
      user: rec.user.name,
      email: rec.user.email,
      role: rec.user.role?.name || '-',
      date: formatDate(rec.clockIn),
      clockIn: formatDateTime(rec.clockIn),
      clockOut: rec.clockOut ? formatDateTime(rec.clockOut) : 'Em aberto',
      hours: rec.totalMinutes ? (rec.totalMinutes / 60).toFixed(2) : '-',
      minutes: rec.totalMinutes || 0,
      notes: rec.notes || '',
    }));

    const xlsxBuffer = await ExcelExportService.exportToExcel({
      title: 'Relatório Consolidado de Ponto Eletrônico',
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
          columns,
          data,
        },
      ],
    });

    await AuditLogRepository.create({
      userId: actor.id,
      action: 'EXPORT_REPORTS',
      entity: 'ClockRecord',
    });

    const fileDate = new Date().toISOString().split('T')[0];
    const fileName = `isluny-works-ponto-${fileDate}.xlsx`;

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
