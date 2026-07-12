import { RoleRepository } from '@/repositories/RoleRepository';
import { AuditLogRepository } from '@/repositories/AuditLogRepository';
import { CreateRoleInput, UpdateRoleInput } from '@/validations/role';

export class RoleUseCases {
  static async createRole(actorId: string, input: CreateRoleInput) {
    const existing = await RoleRepository.findByName(input.name);
    if (existing) {
      throw new Error('Cargo com este nome já existe.');
    }

    const role = await RoleRepository.create(input);

    await AuditLogRepository.create({
      userId: actorId,
      action: 'CREATE_ROLE',
      entity: 'Role',
      entityId: role.id,
    });

    return role;
  }

  static async updateRole(actorId: string, roleId: string, input: UpdateRoleInput) {
    const role = await RoleRepository.findById(roleId);
    if (!role) {
      throw new Error('Cargo não encontrado.');
    }

    if (input.name) {
      const existing = await RoleRepository.findByName(input.name);
      if (existing && existing.id !== roleId) {
        throw new Error('Cargo com este nome já existe.');
      }
      if (role.name === 'Administrador' && input.name !== 'Administrador') {
        throw new Error('O nome do cargo Administrador não pode ser alterado.');
      }
    }

    const updatedRole = await RoleRepository.update(roleId, input);

    await AuditLogRepository.create({
      userId: actorId,
      action: 'UPDATE_ROLE',
      entity: 'Role',
      entityId: roleId,
    });

    return updatedRole;
  }

  static async deleteRole(actorId: string, roleId: string) {
    const role = await RoleRepository.findById(roleId);
    if (!role) {
      throw new Error('Cargo não encontrado.');
    }

    if (role.name === 'Administrador') {
      throw new Error('O cargo Administrador é vital para o sistema e não pode ser excluído.');
    }

    if (role.users && role.users.length > 0) {
      throw new Error('Não é possível excluir um cargo vinculado a usuários ativos ou inativos.');
    }

    await RoleRepository.delete(roleId);

    await AuditLogRepository.create({
      userId: actorId,
      action: 'DELETE_ROLE',
      entity: 'Role',
      entityId: roleId,
    });

    return { success: true };
  }

  static async listRoles() {
    return RoleRepository.findMany();
  }

  static async getRole(roleId: string) {
    const role = await RoleRepository.findById(roleId);
    if (!role) {
      throw new Error('Cargo não encontrado.');
    }
    return role;
  }
}
