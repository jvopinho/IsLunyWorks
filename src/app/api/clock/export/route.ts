import { NextRequest } from 'next/server';
import { getAuthenticatedSession, apiError } from '@/lib/api-helper';
import { ClockRecordRepository } from '@/repositories/ClockRecordRepository';
import { ExcelExportService } from '@/services/excel/ExcelExportService';
import { formatDate, formatDateTime, formatMinutes } from '@/utils/date';
import { AuditLogRepository } from '@/repositories/AuditLogRepository';
import { hasPermission } from '@/utils/rbac';

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthenticatedSession();
    if (!session || !session.user) {
      throw new Error('Não autenticado. Por favor, faça login.');
    }

    const { searchParams } = new URL(request.url);
    let targetUserId = searchParams.get('userId') || undefined;

    const canExportOthers = hasPermission(session.user, 'clock.export');
    
    if (!canExportOthers) {
      targetUserId = session.user.id;
    }

    const records = await ClockRecordRepository.findMany({
      userId: targetUserId,
    });

    const columns = [
      { header: 'Data', key: 'date' },
      { header: 'Entrada', key: 'clockIn' },
      { header: 'Saída', key: 'clockOut' },
      { header: 'Total Trabalhado', key: 'hours' },
      { header: 'Minutos Acumulados', key: 'minutes', numFmt: '#,##0' },
      { header: 'Observações', key: 'notes' },
    ];

    const data = records.map((rec: any) => ({
      date: formatDate(rec.clockIn),
      clockIn: formatDateTime(rec.clockIn),
      clockOut: rec.clockOut ? formatDateTime(rec.clockOut) : 'Em aberto',
      hours: formatMinutes(rec.totalMinutes),
      minutes: rec.totalMinutes || 0,
      notes: rec.notes || '',
    }));

    const xlsxBuffer = await ExcelExportService.exportToExcel({
      title: `Espelho de Ponto Individual - ${session.user.name}`,
      responsibleName: session.user.name || 'Colaborador',
      sheets: [
        {
          name: 'Meus Pontos',
          columns,
          data,
        },
      ],
    });

    await AuditLogRepository.create({
      userId: session.user.id,
      action: 'EXPORT_CLOCK',
      entity: 'ClockRecord',
    });

    return new Response(new Uint8Array(xlsxBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="isluny-works-meu-ponto.xlsx"',
      },
    });
  } catch (error) {
    return apiError(error);
  }
}
