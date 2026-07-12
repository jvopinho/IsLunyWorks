import { NextRequest } from 'next/server';
import { apiResponse, apiError, checkAuthAndPermission } from '@/lib/api-helper';
import { AuditLogRepository } from '@/repositories/AuditLogRepository';
import { getAuditMapping } from '@/utils/auditMapper';

export async function GET(request: NextRequest) {
  try {
    await checkAuthAndPermission('audit.view');

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const userId = searchParams.get('userId') || undefined;
    const targetUserId = searchParams.get('targetUserId') || undefined;
    const action = searchParams.get('action') || undefined;
    const module = searchParams.get('module') || undefined;
    const category = searchParams.get('category') || undefined;
    const startDate = searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined;
    const endDate = searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined;
    const searchText = searchParams.get('searchText') || undefined;
    const adminOnly = searchParams.get('adminOnly') === 'true';

    const offset = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      AuditLogRepository.findManyFilterable({
        userId,
        targetUserId,
        action,
        module,
        category,
        startDate,
        endDate,
        searchText,
        adminOnly,
        limit,
        offset,
      }),
      AuditLogRepository.countFilterable({
        userId,
        targetUserId,
        action,
        module,
        category,
        startDate,
        endDate,
        searchText,
        adminOnly,
      }),
    ]);

    const mappedLogs = logs.map((log: any) => {
      const mapping = getAuditMapping(log.action);
      return {
        id: log.id,
        createdAt: log.createdAt,
        actor: log.user ? { name: log.user.name, email: log.user.email } : null,
        action: log.action,
        label: mapping.label,
        module: mapping.module,
        category: mapping.category,
        description: mapping.description,
        entity: log.entity,
        entityId: log.entityId,
        details: log.details,
        reason: log.reason,
        ipAddress: log.ipAddress,
        userAgent: log.userAgent,
      };
    });

    return apiResponse({
      logs: mappedLogs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return apiError(error);
  }
}
