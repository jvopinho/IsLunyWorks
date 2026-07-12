import { z } from 'zod';

export const registerClockSchema = z.object({
  notes: z.string().max(500, { message: 'Observações não podem exceder 500 caracteres.' }).nullable().optional(),
});

export type RegisterClockInput = z.infer<typeof registerClockSchema>;

export const updateClockRecordSchema = z.object({
  clockIn: z.string().datetime({ message: 'Horário de entrada inválido.' }),
  clockOut: z.string().datetime({ message: 'Horário de saída inválido.' }).nullable().optional(),
  notes: z.string().max(500, { message: 'Observações não podem exceder 500 caracteres.' }).nullable().optional(),
  reason: z.string().min(5, { message: 'O motivo deve conter no mínimo 5 caracteres.' }).max(200, { message: 'O motivo não pode exceder 200 caracteres.' }),
});

export type UpdateClockRecordInput = z.infer<typeof updateClockRecordSchema>;
