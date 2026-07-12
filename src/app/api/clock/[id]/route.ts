import { NextRequest } from 'next/server';
import { apiResponse, apiError, checkAuthAndPermission, getAuthenticatedSession } from '@/lib/api-helper';
import { ClockRecordRepository } from '@/repositories/ClockRecordRepository';
import { ClockUseCases } from '@/useCases/ClockUseCases';
import { updateClockRecordSchema } from '@/validations/clock';
import { prisma } from '@/lib/prisma';
import { hasPermission } from '@/utils/rbac';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getAuthenticatedSession();
    if (!session || !session.user) {
      throw new Error('Não autenticado. Por favor, faça login.');
    }

    const record = await ClockRecordRepository.findById(id);
    if (!record) {
      throw new Error('Registro de ponto não encontrado.');
    }

    const isOwner = record.userId === session.user.id;
    const isAuthorized = isOwner || hasPermission(session.user, 'clock.edit') || hasPermission(session.user, 'admin');

    if (!isAuthorized) {
      throw new Error('Você não tem permissão para visualizar o histórico deste registro.');
    }

    const history = await prisma.auditLog.findMany({
      where: {
        entity: 'ClockRecord',
        entityId: id,
        action: 'clock.record.updated',
      },
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

    return apiResponse({
      record,
      history: history.map((h) => ({
        id: h.id,
        createdAt: h.createdAt,
        actorName: h.user?.name || 'Sistema',
        actorEmail: h.user?.email || '',
        reason: h.reason,
        details: h.details ? JSON.parse(h.details) : null,
      })),
    });
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const actor = await checkAuthAndPermission('clock.edit');
    
    const body = await request.json();
    const parsed = updateClockRecordSchema.parse(body);

    const updated = await ClockUseCases.updateClockRecord(actor.id, id, parsed);
    return apiResponse(updated);
  } catch (error) {
    return apiError(error);
  }
}
