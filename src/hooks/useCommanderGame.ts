import { useCallback, useEffect, useState } from 'react'
import { commanderGameService } from '@/services'
import type {
  CommanderGameDetail,
  CreateCommanderDamageRequestInput,
  CreateCommanderGlobalDamageRequestInput,
  ResolveCommanderDamageRequestInput,
} from '@/models'

const POLL_INTERVAL_MS = 1500

/**
 * A mesa em andamento muda a cada toque de qualquer jogador na sala, então
 * usa polling curto em vez do hydrate único do resto do app (ver useAppStore).
 */
export function useCommanderGame(gameId: string | null) {
  const [game, setGame] = useState<CommanderGameDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!gameId) return
    try {
      const detail = await commanderGameService.getDetail(gameId)
      setGame(detail)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar o mesão')
    }
  }, [gameId])

  useEffect(() => {
    if (!gameId) {
      setGame(null)
      return
    }
    setLoading(true)
    refresh().finally(() => setLoading(false))
    const interval = setInterval(refresh, POLL_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [gameId, refresh])

  const sendDamageRequest = useCallback(
    async (input: CreateCommanderDamageRequestInput) => {
      if (!gameId) return
      await commanderGameService.createDamageRequest(gameId, input)
      await refresh()
    },
    [gameId, refresh],
  )

  const sendGlobalDamageRequest = useCallback(
    async (input: CreateCommanderGlobalDamageRequestInput) => {
      if (!gameId) return
      await commanderGameService.createGlobalDamageRequest(gameId, input)
      await refresh()
    },
    [gameId, refresh],
  )

  const resolveDamageRequest = useCallback(
    async (requestId: string, input: ResolveCommanderDamageRequestInput) => {
      if (!gameId) return
      await commanderGameService.resolveDamageRequest(gameId, requestId, input)
      await refresh()
    },
    [gameId, refresh],
  )

  const endGame = useCallback(
    async (standings?: string[]) => {
      if (!gameId) return
      await commanderGameService.end(gameId, { standings })
      await refresh()
    },
    [gameId, refresh],
  )

  return { game, loading, error, refresh, sendDamageRequest, sendGlobalDamageRequest, resolveDamageRequest, endGame }
}
