import { NextRequest } from 'next/server';
import { apiResponse, apiError, checkAuthAndPermission } from '@/lib/api-helper';
import { prisma } from '@/lib/prisma';
import { AuditLogRepository } from '@/repositories/AuditLogRepository';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await checkAuthAndPermission('workload.manage');
    const { id } = await params;

    const breaks = await prisma.workScheduleBreak.findMany({
      where: { workScheduleId: id },
      orderBy: [
        { dayOfWeek: 'asc' },
        { startTime: 'asc' },
      ],
    });

    return apiResponse(breaks);
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const actor = await checkAuthAndPermission('workload.manage');
    const { id } = await params;
    const body = await request.json();
    const { dayOfWeek, name, startTime, endTime, paid = false, reason } = body;

    if (dayOfWeek === undefined || !name || !startTime || !endTime) {
      return Response.json({ error: 'Os campos dayOfWeek, name, startTime e endTime são obrigatórios.' }, { status: 400 });
    }

    const schedule = await prisma.workSchedule.findUnique({
      where: { id },
      include: { user: { select: { name: true, email: true } } },
    });

    if (!schedule) {
      return Response.json({ error: 'Jornada de trabalho não encontrada.' }, { status: 404 });
    }

    const newBreak = await prisma.workScheduleBreak.create({
      data: {
        workScheduleId: id,
        dayOfWeek: parseInt(dayOfWeek, 10),
        name,
        startTime,
        endTime,
        paid: Boolean(paid),
      },
    });

    await AuditLogRepository.create({
      userId: actor.id,
      action: 'workload.break.created',
      entity: 'WorkScheduleBreak',
      entityId: newBreak.id,
      details: JSON.stringify({
        break: newBreak,
        owner: {
          name: schedule.user.name,
          email: schedule.user.email,
        },
      }),
      reason: reason || 'Criação de intervalo na jornada de trabalho',
    });

    return apiResponse(newBreak, 201);
  } catch (error) {
    return apiError(error);
  }
}
