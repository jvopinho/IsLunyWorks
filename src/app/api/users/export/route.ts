import { NextRequest } from 'next/server';
import { checkAuthAndPermission, apiError } from '@/lib/api-helper';
import { UserRepository } from '@/repositories/UserRepository';
import { ExcelExportService } from '@/services/excel/ExcelExportService';
import { formatDate } from '@/utils/date';
import { AuditLogRepository } from '@/repositories/AuditLogRepository';

export async function GET(request: NextRequest) {
  try {
    const actor = await checkAuthAndPermission('users.export');

    const users = await UserRepository.findMany({});

    const columns = [
      { header: 'Nome Completo', key: 'name' },
      { header: 'Endereço de E-mail', key: 'email' },
      { header: 'Cargo / Função', key: 'role' },
      { header: 'Status da Conta', key: 'status' },
      { header: 'Data de Cadastro', key: 'createdAt' },
    ];

    const data = users.map((u: any) => ({
      name: u.name,
      email: u.email,
      role: u.role?.name || '-',
      status: u.active ? 'Ativo' : 'Inativo',
      createdAt: formatDate(u.createdAt),
    }));

    const xlsxBuffer = await ExcelExportService.exportToExcel({
      title: 'Listagem Geral de Colaboradores',
      responsibleName: actor.name || 'Administrador',
      sheets: [
        {
          name: 'Colaboradores',
          columns,
          data,
        },
      ],
    });

    await AuditLogRepository.create({
      userId: actor.id,
      action: 'EXPORT_USERS',
      entity: 'User',
    });

    return new Response(new Uint8Array(xlsxBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="isluny-works-usuarios.xlsx"',
      },
    });
  } catch (error) {
    return apiError(error);
  }
}
