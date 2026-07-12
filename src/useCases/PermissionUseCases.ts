import { PermissionRepository } from '@/repositories/PermissionRepository';

export class PermissionUseCases {
  static async listPermissions() {
    return PermissionRepository.findMany();
  }
}
