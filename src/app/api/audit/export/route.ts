import { NextRequest } from 'next/server';
import { checkAuthAndPermission, apiError } from '@/lib/api-helper';
import { prisma } from '@/lib/prisma';
import { ExcelExportService } from '@/services/excel/ExcelExportService';
import { formatDateTime, formatMinutes } from '@/utils/date';
import { AuditLogRepository } from '@/repositories/AuditLogRepository';

export async function GET(request: NextRequest) {
  try {
    const actor = await checkAuthAndPermission('admin');

    const logs = await prisma.auditLog.findMany({
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const columns = [
      { header: 'Data da Ação', key: 'createdAt' },
      { header: 'Autor', key: 'actor' },
      { header: 'Ação', key: 'action' },
      { header: 'Entidade Afetada', key: 'entity' },
      { header: 'ID da Entidade', key: 'entityId' },
      { header: 'Colaborador Afetado', key: 'owner' },
      { header: 'Horário Anterior', key: 'prevTime' },
      { header: 'Horário Novo', key: 'newTime' },
      { header: 'Total Anterior', key: 'prevTotal' },
      { header: 'Total Novo', key: 'newTotal' },
      { header: 'Motivo da Alteração', key: 'reason' },
    ];

    const data = logs.map((log: any) => {
      let owner = '-';
      let prevTime = '-';
      let newTime = '-';
      let prevTotal = '-';
      let newTotal = '-';
      let reason = log.reason || '-';

      if (log.action === 'clock.record.updated' && log.details) {
        try {
          const parsed = JSON.parse(log.details);
          owner = parsed.owner ? `${parsed.owner.name} (${parsed.owner.email})` : '-';
          
          const prevIn = parsed.previous.clockIn ? formatDateTime(parsed.previous.clockIn) : '-';
          const prevOut = parsed.previous.clockOut ? formatDateTime(parsed.previous.clockOut) : 'Em aberto';
          prevTime = `Entrada: ${prevIn} | Saída: ${prevOut}`;

          const newIn = parsed.current.clockIn ? formatDateTime(parsed.current.clockIn) : '-';
          const newOut = parsed.current.clockOut ? formatDateTime(parsed.current.clockOut) : 'Em aberto';
          newTime = `Entrada: ${newIn} | Saída: ${newOut}`;

          prevTotal = formatMinutes(parsed.previous.totalMinutes);
          newTotal = formatMinutes(parsed.current.totalMinutes);
        } catch (e) {
          // Ignore json parse error
        }
      }

      return {
        createdAt: formatDateTime(log.createdAt),
        actor: log.user ? `${log.user.name} (${log.user.email})` : 'Sistema',
        action: log.action,
        entity: log.entity,
        entityId: log.entityId || '-',
        owner,
        prevTime,
        newTime,
        prevTotal,
        newTotal,
        reason,
      };
    });

    const xlsxBuffer = await ExcelExportService.exportToExcel({
      title: 'Logs de Auditoria do Sistema - IsLuny Works',
      responsibleName: actor.name || 'Administrador',
      sheets: [
        {
          name: 'Logs de Auditoria',
          columns,
          data,
        },
      ],
    });

    await AuditLogRepository.create({
      userId: actor.id,
      action: 'EXPORT_AUDIT_LOGS',
      entity: 'AuditLog',
    });

    return new Response(new Uint8Array(xlsxBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="isluny-works-auditoria.xlsx"',
      },
    });
  } catch (error) {
    return apiError(error);
  }
}
