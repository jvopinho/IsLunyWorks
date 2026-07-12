import { NextRequest } from 'next/server';
import { apiResponse, apiError, checkAuthAndPermission } from '@/lib/api-helper';
import { prisma } from '@/lib/prisma';
import { AuditLogRepository } from '@/repositories/AuditLogRepository';

export async function POST(request: NextRequest) {
  try {
    const actor = await checkAuthAndPermission('bank_hours.manage');
    
    const body = await request.json();
    const { clockRecordId, minutes, reason } = body;

    if (!clockRecordId || !minutes || minutes <= 0 || !reason) {
      return Response.json({ error: 'Os campos clockRecordId, minutes (positivo) e reason são obrigatórios.' }, { status: 400 });
    }

    const minutesNum = parseInt(minutes, 10);

    const record = await prisma.clockRecord.findUnique({
      where: { id: clockRecordId },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!record || !record.clockOut) {
      return Response.json({ error: 'Registro de ponto não encontrado ou expediente ainda em aberto.' }, { status: 404 });
    }

    if (record.deficitMinutes < minutesNum) {
      return Response.json({ error: `O déficit atual do registro (${record.deficitMinutes} min) é menor que os minutos solicitados.` }, { status: 400 });
    }

    const balance = await prisma.bankHoursBalance.findUnique({
      where: { userId: record.userId },
    });

    const currentBalance = balance?.currentBalanceMinutes || 0;
    if (currentBalance < minutesNum) {
      return Response.json({ error: `Saldo de banco de horas insuficiente. Saldo atual: ${currentBalance} min.` }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const updatedBalance = await tx.bankHoursBalance.update({
        where: { userId: record.userId },
        data: { currentBalanceMinutes: { decrement: minutesNum } },
      });

      const transaction = await tx.bankHoursTransaction.create({
        data: {
          userId: record.userId,
          type: 'USED_IN_WORKDAY',
          minutes: minutesNum,
          reason,
          referenceId: clockRecordId,
          createdBy: actor.id,
        },
      });

      const updatedRecord = await tx.clockRecord.update({
        where: { id: clockRecordId },
        data: {
          normalMinutes: { increment: minutesNum },
          deficitMinutes: { decrement: minutesNum },
          notes: record.notes
            ? `${record.notes} | Compensado banco: ${minutesNum} min`
            : `Compensado banco: ${minutesNum} min`,
        },
      });

      return { balance: updatedBalance, transaction, record: updatedRecord };
    });

    await AuditLogRepository.create({
      userId: actor.id,
      action: 'bank_hours.used',
      entity: 'ClockRecord',
      entityId: clockRecordId,
      details: JSON.stringify({
        targetUser: { id: record.userId, name: record.user.name, email: record.user.email },
        amount: minutesNum,
        newBalance: result.balance.currentBalanceMinutes,
      }),
      reason,
    });

    return apiResponse(result);
  } catch (error) {
    return apiError(error);
  }
}
