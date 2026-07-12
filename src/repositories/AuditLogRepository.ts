import { prisma } from '@/lib/prisma';

export class AuditLogRepository {
  static async create(data: {
    userId: string | null;
    action: string;
    entity: string;
    entityId?: string | null;
    details?: string | null;
    reason?: string | null;
  }) {
    return prisma.auditLog.create({
      data: {
        userId: data.userId,
        action: data.action,
        entity: data.entity,
        entityId: data.entityId,
        details: data.details,
        reason: data.reason,
      },
    });
  }

  static async findMany(filters: {
    userId?: string;
    entity?: string;
    limit?: number;
    offset?: number;
  }) {
    return prisma.auditLog.findMany({
      where: {
        userId: filters.userId,
        entity: filters.entity,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: filters.limit ?? 50,
      skip: filters.offset ?? 0,
    });
  }
}
