import { z } from 'zod'

export const commanderDamageTypeSchema = z.enum(['combat', 'commander', 'life_adjust', 'other'])
export type CommanderDamageType = z.infer<typeof commanderDamageTypeSchema>

export const commanderGameStatusSchema = z.enum(['active', 'ended'])
export type CommanderGameStatus = z.infer<typeof commanderGameStatusSchema>

export const commanderGameSummarySchema = z.object({
  id: z.uuid(),
  status: commanderGameStatusSchema,
  startingLife: z.number(),
  startedAt: z.coerce.date(),
  endedAt: z.coerce.date().optional(),
})
export type CommanderGameSummary = z.infer<typeof commanderGameSummarySchema>

export const commanderGamePlayerSchema = z.object({
  playerId: z.uuid(),
  name: z.string(),
  colorHex: z.string().optional(),
  avatarUrl: z.string().optional(),
  life: z.number(),
  placement: z.number().optional(),
})
export type CommanderGamePlayer = z.infer<typeof commanderGamePlayerSchema>

export const commanderDamageRequestStatusSchema = z.enum(['pending', 'applied', 'dismissed'])

export const commanderDamageRequestSchema = z.object({
  id: z.uuid(),
  gameId: z.uuid(),
  fromPlayerId: z.uuid(),
  fromPlayerName: z.string(),
  toPlayerId: z.uuid(),
  toPlayerName: z.string(),
  amount: z.number(),
  type: commanderDamageTypeSchema,
  commanderName: z.string().optional(),
  status: commanderDamageRequestStatusSchema,
  createdAt: z.coerce.date(),
  resolvedAt: z.coerce.date().optional(),
})
export type CommanderDamageRequest = z.infer<typeof commanderDamageRequestSchema>

export const commanderDamageHistoryEntrySchema = z.object({
  id: z.uuid(),
  fromPlayerId: z.uuid(),
  fromPlayerName: z.string(),
  toPlayerId: z.uuid(),
  toPlayerName: z.string(),
  amount: z.number(),
  type: commanderDamageTypeSchema,
  commanderName: z.string().optional(),
  resolvedAt: z.coerce.date().optional(),
})
export type CommanderDamageHistoryEntry = z.infer<typeof commanderDamageHistoryEntrySchema>

export const commanderDamageMatrixEntrySchema = z.object({
  fromPlayerId: z.uuid(),
  toPlayerId: z.uuid(),
  total: z.number(),
})
export type CommanderDamageMatrixEntry = z.infer<typeof commanderDamageMatrixEntrySchema>

export const commanderGameDetailSchema = commanderGameSummarySchema.extend({
  seasonId: z.uuid().optional(),
  players: z.array(commanderGamePlayerSchema),
  pendingRequests: z.array(commanderDamageRequestSchema),
  history: z.array(commanderDamageHistoryEntrySchema),
  commanderDamage: z.array(commanderDamageMatrixEntrySchema),
})
export type CommanderGameDetail = z.infer<typeof commanderGameDetailSchema>

export const endCommanderGameInputSchema = z.object({
  standings: z.array(z.string()).optional(),
})
export type EndCommanderGameInput = z.infer<typeof endCommanderGameInputSchema>

export const createCommanderGameInputSchema = z.object({
  playerIds: z.array(z.string()).min(2, 'Selecione pelo menos 2 jogadores').max(6),
  startingLife: z.number().int().positive().default(40),
})
export type CreateCommanderGameInput = z.infer<typeof createCommanderGameInputSchema>

export const createCommanderDamageRequestInputSchema = z.object({
  fromPlayerId: z.string().min(1),
  toPlayerId: z.string().min(1),
  amount: z.number().int().refine((v) => v !== 0, 'Valor não pode ser zero'),
  type: commanderDamageTypeSchema,
  commanderName: z.string().min(1).optional(),
})
export type CreateCommanderDamageRequestInput = z.infer<typeof createCommanderDamageRequestInputSchema>

export const createCommanderGlobalDamageRequestInputSchema = z.object({
  fromPlayerId: z.string().min(1),
  amount: z.number().int().refine((v) => v !== 0, 'Valor não pode ser zero'),
  type: commanderDamageTypeSchema,
  commanderName: z.string().min(1).optional(),
})
export type CreateCommanderGlobalDamageRequestInput = z.infer<typeof createCommanderGlobalDamageRequestInputSchema>

export const resolveCommanderDamageRequestInputSchema = z.object({
  action: z.enum(['apply', 'dismiss']),
  amount: z.number().int().refine((v) => v !== 0).optional(),
})
export type ResolveCommanderDamageRequestInput = z.infer<typeof resolveCommanderDamageRequestInputSchema>
