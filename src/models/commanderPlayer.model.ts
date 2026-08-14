import { z } from 'zod'
import { baseEntitySchema } from './common.model'

export const commanderPlayerSchema = baseEntitySchema.extend({
  name: z.string().min(1),
  colorHex: z.string().optional(),
  avatarUrl: z.string().optional(),
})
export type CommanderPlayer = z.infer<typeof commanderPlayerSchema>

export const createCommanderPlayerInputSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  colorHex: z.string().optional(),
})
export type CreateCommanderPlayerInput = z.infer<typeof createCommanderPlayerInputSchema>

export const updateCommanderPlayerInputSchema = z.object({
  name: z.string().min(1).optional(),
  colorHex: z.string().nullable().optional(),
})
export type UpdateCommanderPlayerInput = z.infer<typeof updateCommanderPlayerInputSchema>
