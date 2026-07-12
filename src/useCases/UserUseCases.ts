import bcrypt from 'bcrypt';
import { UserRepository } from '@/repositories/UserRepository';
import { AuditLogRepository } from '@/repositories/AuditLogRepository';
import { CreateUserInput, UpdateUserInput } from '@/validations/user';

export class UserUseCases {
  static async createUser(actorId: string, input: CreateUserInput) {
    const existing = await UserRepository.findByEmail(input.email);
    if (existing) {
      throw new Error('E-mail já cadastrado.');
    }

    const passwordHash = await bcrypt.hash(input.password, 10);
    const user = await UserRepository.create({
      ...input,
      passwordHash,
    });

    await AuditLogRepository.create({
      userId: actorId,
      action: 'CREATE_USER',
      entity: 'User',
      entityId: user.id,
    });

    return user;
  }

  static async updateUser(actorId: string, targetUserId: string, input: Partial<UpdateUserInput>) {
    const user = await UserRepository.findById(targetUserId);
    if (!user) {
      throw new Error('Usuário não encontrado.');
    }

    if (input.email) {
      const existing = await UserRepository.findByEmail(input.email);
      if (existing && existing.id !== targetUserId) {
        throw new Error('E-mail já está sendo utilizado por outro usuário.');
      }
    }

    let passwordHash: string | undefined;
    if (input.password && input.password.trim() !== '') {
      passwordHash = await bcrypt.hash(input.password, 10);
    }

    const updatedUser = await UserRepository.update(targetUserId, {
      ...input,
      passwordHash,
    });

    await AuditLogRepository.create({
      userId: actorId,
      action: 'UPDATE_USER',
      entity: 'User',
      entityId: targetUserId,
    });

    return updatedUser;
  }

  static async listUsers(filters: { search?: string; active?: boolean }) {
    return UserRepository.findMany(filters);
  }

  static async getUser(id: string) {
    const user = await UserRepository.findById(id);
    if (!user) {
      throw new Error('Usuário não encontrado.');
    }
    return user;
  }
}
