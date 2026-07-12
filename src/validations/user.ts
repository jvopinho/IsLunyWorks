import { z } from 'zod';

export const createUserSchema = z.object({
  name: z.string().min(3, 'O nome deve ter no mínimo 3 caracteres'),
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'A senha deve ter no mínimo 6 caracteres'),
  roleId: z.string().uuid('Selecione um cargo válido'),
  active: z.boolean().default(true),
});

export const updateUserSchema = z.object({
  name: z.string().min(3, 'O nome deve ter no mínimo 3 caracteres').optional(),
  email: z.string().email('E-mail inválido').optional(),
  password: z.string().min(6, 'A senha deve ter no mínimo 6 caracteres').optional().or(z.literal('')),
  roleId: z.string().uuid('Selecione um cargo válido').optional(),
  active: z.boolean().optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
