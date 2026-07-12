import { NextRequest } from 'next/server';
import { apiResponse, apiError, checkAuthAndPermission } from '@/lib/api-helper';
import { prisma } from '@/lib/prisma';
import { AuditLogRepository } from '@/repositories/AuditLogRepository';

export async function POST(request: NextRequest) {
  try {
    const actor = await checkAuthAndPermission('bank_hours.manage');
    
    const body = await request.json();
    const { userId, targetMinutes, reason } = body;

    if (!userId || targetMinutes === undefined || !reason) {
      return Response.json({ error: 'Os campos userId, targetMinutes e reason são obrigatórios.' }, { status: 400 });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true },
    });

    if (!targetUser) {
      return Response.json({ error: 'Colaborador não encontrado.' }, { status: 404 });
    }

    const targetMinNum = parseInt(targetMinutes, 10);

    const result = await prisma.$transaction(async (tx) => {
      const balanceRecord = await tx.bankHoursBalance.findUnique({
        where: { userId },
      });

      const current = balanceRecord?.currentBalanceMinutes || 0;
      const diff = targetMinNum - current;

      const updatedBalance = await tx.bankHoursBalance.upsert({
        where: { userId },
        update: { currentBalanceMinutes: targetMinNum },
        create: { userId, currentBalanceMinutes: targetMinNum },
      });

      const transaction = await tx.bankHoursTransaction.create({
        data: {
          userId,
          type: 'ADJUSTMENT',
          minutes: diff,
          reason,
          createdBy: actor.id,
        },
      });

      return { balance: updatedBalance, transaction, previousBalance: current };
    });

    await AuditLogRepository.create({
      userId: actor.id,
      action: 'bank_hours.adjusted',
      entity: 'BankHoursBalance',
      entityId: result.balance.id,
      details: JSON.stringify({
        targetUser: { id: userId, ...targetUser },
        previousBalance: result.previousBalance,
        newBalance: targetMinNum,
        difference: targetMinNum - result.previousBalance,
      }),
      reason,
    });

    return apiResponse(result);
  } catch (error) {
    return apiError(error);
  }
}
