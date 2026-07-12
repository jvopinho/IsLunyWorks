import { NextRequest } from 'next/server';
import { apiResponse, apiError, checkAuthAndPermission } from '@/lib/api-helper';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/utils/rbac';

export async function GET(request: NextRequest) {
  try {
    const actor = await checkAuthAndPermission('bank_hours.view');
    
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || actor.id;
    const startDate = searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined;
    const endDate = searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined;

    if (userId !== actor.id) {
      const isAuthorized = hasPermission(actor, 'bank_hours.manage') || actor.role?.name === 'Administrador';
      if (!isAuthorized) {
        return Response.json({ error: 'Acesso negado. Permissão insuficiente.' }, { status: 403 });
      }
    }

    const whereClause: any = { userId };
    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) whereClause.createdAt.gte = startDate;
      if (endDate) whereClause.createdAt.lte = endDate;
    }

    const transactions = await prisma.bankHoursTransaction.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return apiResponse(transactions);
  } catch (error) {
    return apiError(error);
  }
}
