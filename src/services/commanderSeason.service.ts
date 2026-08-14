import { commanderSeasonSummarySchema, commanderLeaderboardSchema } from '@/models'
import type { CommanderSeasonSummary, CommanderLeaderboard } from '@/models'
import { apiClient } from './apiClient'

export const commanderSeasonService = {
  async list(): Promise<CommanderSeasonSummary[]> {
    const raw = await apiClient.get<unknown[]>('/commander-seasons')
    return raw.map((s) => commanderSeasonSummarySchema.parse(s))
  },

  async leaderboard(seasonId?: string): Promise<CommanderLeaderboard> {
    const query = seasonId ? `?seasonId=${seasonId}` : ''
    const raw = await apiClient.get<unknown>(`/commander-seasons/leaderboard${query}`)
    return commanderLeaderboardSchema.parse(raw)
  },

  async reset(name?: string): Promise<CommanderSeasonSummary> {
    const raw = await apiClient.post<unknown>('/commander-seasons/reset', name ? { name } : {})
    return commanderSeasonSummarySchema.parse(raw)
  },
}
