import { prisma } from '@/lib/prisma';

export class PermissionRepository {
  static async findMany() {
    return prisma.permission.findMany({
      orderBy: {
        key: 'asc',
      },
    });
  }
}
