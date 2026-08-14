import { z } from 'zod'

export const commanderSeasonStatusSchema = z.enum(['active', 'archived'])
export type CommanderSeasonStatus = z.infer<typeof commanderSeasonStatusSchema>

export const commanderSeasonSummarySchema = z.object({
  id: z.uuid(),
  name: z.string(),
  status: commanderSeasonStatusSchema,
  startedAt: z.coerce.date(),
  endedAt: z.coerce.date().optional(),
  gamesCount: z.number(),
})
export type CommanderSeasonSummary = z.infer<typeof commanderSeasonSummarySchema>

export const commanderLeaderboardEntrySchema = z.object({
  rank: z.number(),
  playerId: z.uuid(),
  name: z.string(),
  colorHex: z.string().optional(),
  avatarUrl: z.string().optional(),
  points: z.number(),
  wins: z.number(),
  podiums: z.number(),
  games: z.number(),
})
export type CommanderLeaderboardEntry = z.infer<typeof commanderLeaderboardEntrySchema>

export const commanderLeaderboardSchema = z.object({
  season: commanderSeasonSummarySchema,
  standings: z.array(commanderLeaderboardEntrySchema),
})
export type CommanderLeaderboard = z.infer<typeof commanderLeaderboardSchema>
