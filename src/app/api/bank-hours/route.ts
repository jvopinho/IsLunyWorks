import { NextRequest } from 'next/server';
import { apiResponse, apiError, checkAuthAndPermission } from '@/lib/api-helper';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/utils/rbac';

export async function GET(request: NextRequest) {
  try {
    const actor = await checkAuthAndPermission('bank_hours.view');
    
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || actor.id;

    if (userId !== actor.id) {
      const isAuthorized = hasPermission(actor, 'bank_hours.manage') || actor.role?.name === 'Administrador';
      if (!isAuthorized) {
        return Response.json({ error: 'Acesso negado. Permissão insuficiente.' }, { status: 403 });
      }
    }

    const balance = await prisma.bankHoursBalance.findUnique({
      where: { userId },
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

    const defaultBalance = balance || {
      userId,
      currentBalanceMinutes: 0,
      user: await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, email: true },
      }),
    };

    return apiResponse(defaultBalance);
  } catch (error) {
    return apiError(error);
  }
}
