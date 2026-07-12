import { prisma } from '@/lib/prisma';
import { CreateUserInput, UpdateUserInput } from '@/validations/user';

export class UserRepository {
  static async findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      include: {
        role: {
          select: {
            id: true,
            name: true,
            permissions: {
              select: {
                key: true,
              },
            },
          },
        },
      },
    });
  }

  static async findByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
      include: {
        role: true,
      },
    });
  }

  static async findMany(filters: { search?: string; active?: boolean }) {
    const whereClause: any = {};

    if (filters.active !== undefined) {
      whereClause.active = filters.active;
    }

    if (filters.search) {
      whereClause.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return prisma.user.findMany({
      where: whereClause,
      include: {
        role: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  static async create(data: CreateUserInput & { passwordHash: string }) {
    return prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash: data.passwordHash,
        roleId: data.roleId,
        active: data.active,
      },
      include: {
        role: true,
      },
    });
  }

  static async update(id: string, data: Partial<UpdateUserInput> & { passwordHash?: string }) {
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.passwordHash !== undefined) updateData.passwordHash = data.passwordHash;
    if (data.roleId !== undefined) updateData.roleId = data.roleId;
    if (data.active !== undefined) updateData.active = data.active;

    return prisma.user.update({
      where: { id },
      data: updateData,
      include: {
        role: true,
      },
    });
  }

  static async count(where?: any) {
    return prisma.user.count({ where });
  }
}
