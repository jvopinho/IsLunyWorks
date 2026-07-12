import { NextRequest } from 'next/server';
import { apiResponse, apiError, checkAuthAndPermission } from '@/lib/api-helper';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    await checkAuthAndPermission('audit.view');

    const [clockEdits, userChanges, roleChanges, authChanges] = await Promise.all([
      prisma.auditLog.count({ where: { action: 'clock.record.updated' } }),
      prisma.auditLog.count({ where: { entity: 'User', action: { in: ['CREATE_USER', 'UPDATE_USER'] } } }),
      prisma.auditLog.count({ where: { entity: 'Role', action: { in: ['CREATE_ROLE', 'UPDATE_ROLE', 'DELETE_ROLE'] } } }),
      prisma.auditLog.count({ where: { action: { in: ['LOGIN', 'LOGOUT'] } } }),
    ]);

    return apiResponse([
      { name: 'Edições de Ponto', count: clockEdits },
      { name: 'Colaboradores', count: userChanges },
      { name: 'Cargos', count: roleChanges },
      { name: 'Acessos', count: authChanges },
    ]);
  } catch (error) {
    return apiError(error);
  }
}
