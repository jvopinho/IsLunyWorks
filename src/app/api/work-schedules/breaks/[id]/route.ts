import { NextRequest } from 'next/server';
import { apiResponse, apiError, checkAuthAndPermission } from '@/lib/api-helper';
import { prisma } from '@/lib/prisma';
import { AuditLogRepository } from '@/repositories/AuditLogRepository';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const actor = await checkAuthAndPermission('workload.manage');
    const { id } = await params;
    const body = await request.json();
    const { name, startTime, endTime, paid, reason } = body;

    const existingBreak = await prisma.workScheduleBreak.findUnique({
      where: { id },
      include: {
        workSchedule: {
          include: {
            user: { select: { name: true, email: true } },
          },
        },
      },
    });

    if (!existingBreak) {
      return Response.json({ error: 'Intervalo não encontrado.' }, { status: 404 });
    }

    const updatedBreak = await prisma.workScheduleBreak.update({
      where: { id },
      data: {
        name: name !== undefined ? name : undefined,
        startTime: startTime !== undefined ? startTime : undefined,
        endTime: endTime !== undefined ? endTime : undefined,
        paid: paid !== undefined ? Boolean(paid) : undefined,
      },
    });

    await AuditLogRepository.create({
      userId: actor.id,
      action: 'workload.break.updated',
      entity: 'WorkScheduleBreak',
      entityId: id,
      details: JSON.stringify({
        previous: existingBreak,
        current: updatedBreak,
        owner: {
          name: existingBreak.workSchedule.user.name,
          email: existingBreak.workSchedule.user.email,
        },
      }),
      reason: reason || 'Edição de intervalo na jornada de trabalho',
    });

    return apiResponse(updatedBreak);
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const actor = await checkAuthAndPermission('workload.manage');
    const { id } = await params;

    const existingBreak = await prisma.workScheduleBreak.findUnique({
      where: { id },
      include: {
        workSchedule: {
          include: {
            user: { select: { name: true, email: true } },
          },
        },
      },
    });

    if (!existingBreak) {
      return Response.json({ error: 'Intervalo não encontrado.' }, { status: 404 });
    }

    await prisma.workScheduleBreak.delete({
      where: { id },
    });

    await AuditLogRepository.create({
      userId: actor.id,
      action: 'workload.break.deleted',
      entity: 'WorkScheduleBreak',
      entityId: id,
      details: JSON.stringify({
        break: existingBreak,
        owner: {
          name: existingBreak.workSchedule.user.name,
          email: existingBreak.workSchedule.user.email,
        },
      }),
      reason: 'Exclusão de intervalo na jornada de trabalho',
    });

    return apiResponse({ success: true });
  } catch (error) {
    return apiError(error);
  }
}
