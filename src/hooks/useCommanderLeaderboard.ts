import { useCallback, useEffect, useState } from 'react'
import { commanderSeasonService } from '@/services'
import type { CommanderLeaderboard, CommanderSeasonSummary } from '@/models'

/**
 * Carrega o ranking do board. Sem seasonId escolhido, mostra a temporada ativa.
 * Também lista as temporadas (pra ver anos anteriores) e permite reiniciar o board.
 */
export function useCommanderLeaderboard(enabled: boolean) {
  const [seasons, setSeasons] = useState<CommanderSeasonSummary[]>([])
  const [selectedSeasonId, setSelectedSeasonId] = useState<string | null>(null)
  const [leaderboard, setLeaderboard] = useState<CommanderLeaderboard | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async (seasonId?: string) => {
    setLoading(true)
    setError(null)
    try {
      const [seasonList, board] = await Promise.all([
        commanderSeasonService.list(),
        commanderSeasonService.leaderboard(seasonId),
      ])
      setSeasons(seasonList)
      setLeaderboard(board)
      setSelectedSeasonId(board.season.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar o ranking')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (enabled) load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled])

  const selectSeason = useCallback((seasonId: string) => load(seasonId), [load])

  const reset = useCallback(
    async (name?: string) => {
      const fresh = await commanderSeasonService.reset(name)
      await load(fresh.id)
      return fresh
    },
    [load],
  )

  return { seasons, selectedSeasonId, leaderboard, loading, error, load, selectSeason, reset }
}
