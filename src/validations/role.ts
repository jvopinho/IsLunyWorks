import { z } from 'zod';

export const createRoleSchema = z.object({
  name: z.string().min(3, 'O nome do cargo deve ter no mínimo 3 caracteres'),
  description: z.string().optional().nullable(),
  permissionIds: z.array(z.string().uuid('ID de permissão inválido')).min(1, 'Selecione pelo menos uma permissão'),
});

export const updateRoleSchema = z.object({
  name: z.string().min(3, 'O nome do cargo deve ter no mínimo 3 caracteres').optional(),
  description: z.string().optional().nullable(),
  permissionIds: z.array(z.string().uuid('ID de permissão inválido')).optional(),
});

export type CreateRoleInput = z.infer<typeof createRoleSchema>;
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
