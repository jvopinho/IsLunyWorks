import { prisma } from '@/lib/prisma';
import { CreateRoleInput, UpdateRoleInput } from '@/validations/role';

export class RoleRepository {
  static async findById(id: string) {
    return prisma.role.findUnique({
      where: { id },
      include: {
        permissions: true,
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            active: true,
          },
        },
      },
    });
  }

  static async findByName(name: string) {
    return prisma.role.findUnique({
      where: { name },
    });
  }

  static async findMany() {
    return prisma.role.findMany({
      include: {
        permissions: {
          select: {
            id: true,
            key: true,
            description: true,
          },
        },
        _count: {
          select: {
            users: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  static async create(data: CreateRoleInput) {
    return prisma.role.create({
      data: {
        name: data.name,
        description: data.description,
        permissions: {
          connect: data.permissionIds.map((id) => ({ id })),
        },
      },
      include: {
        permissions: true,
      },
    });
  }

  static async update(id: string, data: UpdateRoleInput) {
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    
    if (data.permissionIds !== undefined) {
      updateData.permissions = {
        set: data.permissionIds.map((pid) => ({ id: pid })),
      };
    }

    return prisma.role.update({
      where: { id },
      data: updateData,
      include: {
        permissions: true,
      },
    });
  }

  static async delete(id: string) {
    return prisma.role.delete({
      where: { id },
    });
  }

  static async count(where?: any) {
    return prisma.role.count({ where });
  }
}
