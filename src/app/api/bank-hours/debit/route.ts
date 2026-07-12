import { NextRequest } from 'next/server';
import { apiResponse, apiError, checkAuthAndPermission } from '@/lib/api-helper';
import { prisma } from '@/lib/prisma';
import { AuditLogRepository } from '@/repositories/AuditLogRepository';

export async function POST(request: NextRequest) {
  try {
    const actor = await checkAuthAndPermission('bank_hours.manage');
    
    const body = await request.json();
    const { userId, minutes, reason } = body;

    if (!userId || !minutes || minutes <= 0 || !reason) {
      return Response.json({ error: 'Os campos userId, minutes (positivo) e reason são obrigatórios.' }, { status: 400 });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true },
    });

    if (!targetUser) {
      return Response.json({ error: 'Colaborador não encontrado.' }, { status: 404 });
    }

    const minutesNum = parseInt(minutes, 10);

    const result = await prisma.$transaction(async (tx) => {
      const balance = await tx.bankHoursBalance.upsert({
        where: { userId },
        update: { currentBalanceMinutes: { decrement: minutesNum } },
        create: { userId, currentBalanceMinutes: -minutesNum },
      });

      const transaction = await tx.bankHoursTransaction.create({
        data: {
          userId,
          type: 'MANUAL_DEBIT',
          minutes: minutesNum,
          reason,
          createdBy: actor.id,
        },
      });

      return { balance, transaction };
    });

    await AuditLogRepository.create({
      userId: actor.id,
      action: 'bank_hours.debited',
      entity: 'BankHoursBalance',
      entityId: result.balance.id,
      details: JSON.stringify({
        targetUser: { id: userId, ...targetUser },
        amount: -minutesNum,
        newBalance: result.balance.currentBalanceMinutes,
      }),
      reason,
    });

    return apiResponse(result);
  } catch (error) {
    return apiError(error);
  }
}
