import { prisma } from '@/lib/prisma';

import { AUDIT_MAPPINGS } from '@/utils/auditMapper';

import { headers } from 'next/headers';

export class AuditLogRepository {
  static async create(data: {
    userId: string | null;
    action: string;
    entity: string;
    entityId?: string | null;
    details?: string | null;
    reason?: string | null;
    ipAddress?: string | null;
    userAgent?: string | null;
  }) {
    let ipAddress = data.ipAddress || null;
    let userAgent = data.userAgent || null;

    try {
      const reqHeaders = await headers();
      if (!ipAddress) {
        ipAddress = reqHeaders.get('x-forwarded-for') || reqHeaders.get('x-real-ip') || null;
        if (ipAddress && ipAddress.includes(',')) {
          ipAddress = ipAddress.split(',')[0].trim();
        }
      }
      if (!userAgent) {
        userAgent = reqHeaders.get('user-agent') || null;
      }
    } catch {
      // Silent catch if called outside request context (like seeding)
    }

    return prisma.auditLog.create({
      data: {
        userId: data.userId,
        action: data.action,
        entity: data.entity,
        entityId: data.entityId,
        details: data.details,
        reason: data.reason,
        ipAddress,
        userAgent,
      },
    });
  }

  static async findManyFilterable(filters: {
    userId?: string;
    targetUserId?: string;
    action?: string;
    module?: string;
    category?: string;
    startDate?: Date;
    endDate?: Date;
    searchText?: string;
    adminOnly?: boolean;
    limit?: number;
    offset?: number;
  }) {
    const whereClause: any = {};

    if (filters.userId) {
      whereClause.userId = filters.userId;
    }

    if (filters.targetUserId) {
      const userRecords = await prisma.clockRecord.findMany({
        where: { userId: filters.targetUserId },
        select: { id: true }
      });
      const recordIds = userRecords.map(r => r.id);
      
      whereClause.OR = [
        { entity: 'ClockRecord', entityId: { in: recordIds } },
        { entity: 'User', entityId: filters.targetUserId }
      ];
    }

    if (filters.action) {
      whereClause.action = filters.action;
    } else if (filters.module) {
      const actions = Object.keys(AUDIT_MAPPINGS).filter(k => AUDIT_MAPPINGS[k].module === filters.module);
      whereClause.action = { in: actions };
    } else if (filters.category) {
      const actions = Object.keys(AUDIT_MAPPINGS).filter(k => AUDIT_MAPPINGS[k].category === filters.category);
      whereClause.action = { in: actions };
    }

    if (filters.adminOnly) {
      const adminActions = [
        'CREATE_USER', 'UPDATE_USER', 'CREATE_ROLE', 'UPDATE_ROLE', 'DELETE_ROLE',
        'clock.record.updated', 'EXPORT_AUDIT_LOGS', 'EXPORT_USERS', 'EXPORT_REPORTS'
      ];
      whereClause.action = whereClause.action
        ? { AND: [whereClause.action, { in: adminActions }] }
        : { in: adminActions };
    }

    if (filters.startDate || filters.endDate) {
      whereClause.createdAt = {};
      if (filters.startDate) {
        whereClause.createdAt.gte = filters.startDate;
      }
      if (filters.endDate) {
        whereClause.createdAt.lte = filters.endDate;
      }
    }

    if (filters.searchText) {
      whereClause.OR = [
        ...(whereClause.OR || []),
        { action: { contains: filters.searchText, mode: 'insensitive' } },
        { entity: { contains: filters.searchText, mode: 'insensitive' } },
        { reason: { contains: filters.searchText, mode: 'insensitive' } },
        { ipAddress: { contains: filters.searchText, mode: 'insensitive' } },
        { userAgent: { contains: filters.searchText, mode: 'insensitive' } },
      ];
    }

    return prisma.auditLog.findMany({
      where: whereClause,
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
      take: filters.limit ?? 20,
      skip: filters.offset ?? 0,
    });
  }

  static async countFilterable(filters: {
    userId?: string;
    targetUserId?: string;
    action?: string;
    module?: string;
    category?: string;
    startDate?: Date;
    endDate?: Date;
    searchText?: string;
    adminOnly?: boolean;
  }) {
    const whereClause: any = {};

    if (filters.userId) {
      whereClause.userId = filters.userId;
    }

    if (filters.targetUserId) {
      const userRecords = await prisma.clockRecord.findMany({
        where: { userId: filters.targetUserId },
        select: { id: true }
      });
      const recordIds = userRecords.map(r => r.id);
      
      whereClause.OR = [
        { entity: 'ClockRecord', entityId: { in: recordIds } },
        { entity: 'User', entityId: filters.targetUserId }
      ];
    }

    if (filters.action) {
      whereClause.action = filters.action;
    } else if (filters.module) {
      const actions = Object.keys(AUDIT_MAPPINGS).filter(k => AUDIT_MAPPINGS[k].module === filters.module);
      whereClause.action = { in: actions };
    } else if (filters.category) {
      const actions = Object.keys(AUDIT_MAPPINGS).filter(k => AUDIT_MAPPINGS[k].category === filters.category);
      whereClause.action = { in: actions };
    }

    if (filters.adminOnly) {
      const adminActions = [
        'CREATE_USER', 'UPDATE_USER', 'CREATE_ROLE', 'UPDATE_ROLE', 'DELETE_ROLE',
        'clock.record.updated', 'EXPORT_AUDIT_LOGS', 'EXPORT_USERS', 'EXPORT_REPORTS'
      ];
      whereClause.action = whereClause.action
        ? { AND: [whereClause.action, { in: adminActions }] }
        : { in: adminActions };
    }

    if (filters.startDate || filters.endDate) {
      whereClause.createdAt = {};
      if (filters.startDate) {
        whereClause.createdAt.gte = filters.startDate;
      }
      if (filters.endDate) {
        whereClause.createdAt.lte = filters.endDate;
      }
    }

    if (filters.searchText) {
      whereClause.OR = [
        ...(whereClause.OR || []),
        { action: { contains: filters.searchText, mode: 'insensitive' } },
        { entity: { contains: filters.searchText, mode: 'insensitive' } },
        { reason: { contains: filters.searchText, mode: 'insensitive' } },
        { ipAddress: { contains: filters.searchText, mode: 'insensitive' } },
        { userAgent: { contains: filters.searchText, mode: 'insensitive' } },
      ];
    }

    return prisma.auditLog.count({
      where: whereClause,
    });
  }
}
