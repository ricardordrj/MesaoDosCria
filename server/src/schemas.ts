import { z } from 'zod'

// ---------- sessão (login simples por senha compartilhada) ----------
export const createSessionInputSchema = z.object({
  password: z.string().min(1, 'Senha é obrigatória'),
})
export type CreateSessionInput = z.infer<typeof createSessionInputSchema>

// ---------- commander (mesão) ----------
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

export const createCommanderGameInputSchema = z.object({
  playerIds: z.array(z.string().min(1)).min(2, 'Selecione pelo menos 2 jogadores').max(6),
  startingLife: z.coerce.number().int().positive().default(40),
})
export type CreateCommanderGameInput = z.infer<typeof createCommanderGameInputSchema>

export const endCommanderGameInputSchema = z.object({
  // ordem de colocação: primeiro id = 1º lugar. Opcional (dá pra encerrar sem ranquear).
  standings: z.array(z.string().min(1)).optional(),
})
export type EndCommanderGameInput = z.infer<typeof endCommanderGameInputSchema>

export const resetCommanderSeasonInputSchema = z.object({
  name: z.string().min(1).optional(),
})
export type ResetCommanderSeasonInput = z.infer<typeof resetCommanderSeasonInputSchema>

export const commanderDamageTypeSchema = z.enum(['combat', 'commander', 'life_adjust', 'other'])

export const createCommanderDamageRequestInputSchema = z.object({
  fromPlayerId: z.string().min(1, 'Jogador de origem é obrigatório'),
  toPlayerId: z.string().min(1, 'Jogador de destino é obrigatório'),
  amount: z.coerce.number().int().refine((v) => v !== 0, 'Valor não pode ser zero'),
  type: commanderDamageTypeSchema,
  commanderName: z.string().min(1).optional(),
})
export type CreateCommanderDamageRequestInput = z.infer<typeof createCommanderDamageRequestInputSchema>

export const resolveCommanderDamageRequestInputSchema = z.object({
  action: z.enum(['apply', 'dismiss']),
  amount: z.coerce.number().int().refine((v) => v !== 0, 'Valor não pode ser zero').optional(),
})
export type ResolveCommanderDamageRequestInput = z.infer<typeof resolveCommanderDamageRequestInputSchema>

export const createCommanderGlobalDamageRequestInputSchema = z.object({
  fromPlayerId: z.string().min(1, 'Jogador de origem é obrigatório'),
  amount: z.coerce.number().int().refine((v) => v !== 0, 'Valor não pode ser zero'),
  type: commanderDamageTypeSchema,
  commanderName: z.string().min(1).optional(),
})
export type CreateCommanderGlobalDamageRequestInput = z.infer<typeof createCommanderGlobalDamageRequestInputSchema>
