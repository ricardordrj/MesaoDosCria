import { randomUUID } from 'node:crypto'
import { and, desc, eq, inArray } from 'drizzle-orm'
import { db } from '../db/client.js'
import { commanderGames, commanderGamePlayers, commanderPlayers, commanderDamageRequests } from '../db/schema.js'
import { notFound, badRequest } from '../lib/errors.js'
import { commanderSeasonService } from './commanderSeason.service.js'
import type { CreateCommanderGameInput, EndCommanderGameInput } from '../schemas.js'

type PlayerRow = typeof commanderPlayers.$inferSelect

function playerAvatarUrl(row: PlayerRow) {
  return row.avatarStoredName ? `/api/commander-players/${row.id}/avatar` : undefined
}

async function loadGamePlayers(gameId: string) {
  const rows = await db
    .select({ gamePlayer: commanderGamePlayers, player: commanderPlayers })
    .from(commanderGamePlayers)
    .innerJoin(commanderPlayers, eq(commanderGamePlayers.playerId, commanderPlayers.id))
    .where(eq(commanderGamePlayers.gameId, gameId))

  return rows.map(({ gamePlayer, player }) => ({
    playerId: player.id,
    name: player.name,
    colorHex: player.colorHex ?? undefined,
    avatarUrl: playerAvatarUrl(player),
    life: gamePlayer.life,
    placement: gamePlayer.placement ?? undefined,
  }))
}

async function loadPlayerNames(playerIds: string[]) {
  if (playerIds.length === 0) return new Map<string, string>()
  const rows = await db.select().from(commanderPlayers).where(inArray(commanderPlayers.id, playerIds))
  return new Map(rows.map((row) => [row.id, row.name]))
}

async function loadPendingRequests(gameId: string) {
  const rows = await db
    .select()
    .from(commanderDamageRequests)
    .where(and(eq(commanderDamageRequests.gameId, gameId), eq(commanderDamageRequests.status, 'pending')))
    .orderBy(commanderDamageRequests.createdAt)

  const names = await loadPlayerNames([...new Set(rows.flatMap((r) => [r.fromPlayerId, r.toPlayerId]))])
  return rows.map((row) => ({
    id: row.id,
    gameId: row.gameId,
    fromPlayerId: row.fromPlayerId,
    fromPlayerName: names.get(row.fromPlayerId) ?? '?',
    toPlayerId: row.toPlayerId,
    toPlayerName: names.get(row.toPlayerId) ?? '?',
    amount: row.amount,
    type: row.type,
    commanderName: row.commanderName ?? undefined,
    status: row.status,
    createdAt: row.createdAt,
    resolvedAt: row.resolvedAt ?? undefined,
  }))
}

async function loadHistory(gameId: string, limit: number) {
  const rows = await db
    .select()
    .from(commanderDamageRequests)
    .where(and(eq(commanderDamageRequests.gameId, gameId), eq(commanderDamageRequests.status, 'applied')))
    .orderBy(desc(commanderDamageRequests.resolvedAt))
    .limit(limit)

  const names = await loadPlayerNames([...new Set(rows.flatMap((r) => [r.fromPlayerId, r.toPlayerId]))])
  return rows.map((row) => ({
    id: row.id,
    fromPlayerId: row.fromPlayerId,
    fromPlayerName: names.get(row.fromPlayerId) ?? '?',
    toPlayerId: row.toPlayerId,
    toPlayerName: names.get(row.toPlayerId) ?? '?',
    amount: row.amount,
    type: row.type,
    commanderName: row.commanderName ?? undefined,
    resolvedAt: row.resolvedAt ?? undefined,
  }))
}

/** Soma o dano de comandante recebido por par (from -> to), pra régua dos 21. */
async function loadCommanderDamageMatrix(gameId: string) {
  const rows = await db
    .select()
    .from(commanderDamageRequests)
    .where(
      and(
        eq(commanderDamageRequests.gameId, gameId),
        eq(commanderDamageRequests.status, 'applied'),
        eq(commanderDamageRequests.type, 'commander'),
      ),
    )

  const totals = new Map<string, number>()
  for (const row of rows) {
    const key = `${row.fromPlayerId}:${row.toPlayerId}`
    totals.set(key, (totals.get(key) ?? 0) + Math.abs(row.amount))
  }
  return [...totals.entries()].map(([key, total]) => {
    const [fromPlayerId, toPlayerId] = key.split(':')
    return { fromPlayerId, toPlayerId, total }
  })
}

async function loadDetail(gameId: string) {
  const [game] = await db.select().from(commanderGames).where(eq(commanderGames.id, gameId))
  if (!game) throw notFound('Mesão não encontrado')

  const [players, pendingRequests, history, commanderDamage] = await Promise.all([
    loadGamePlayers(gameId),
    loadPendingRequests(gameId),
    loadHistory(gameId, 30),
    loadCommanderDamageMatrix(gameId),
  ])

  return {
    id: game.id,
    seasonId: game.seasonId ?? undefined,
    status: game.status,
    startingLife: game.startingLife,
    startedAt: game.startedAt,
    endedAt: game.endedAt ?? undefined,
    players,
    pendingRequests,
    history,
    commanderDamage,
  }
}

export const commanderGameService = {
  async list(status?: 'active' | 'ended') {
    const rows = status
      ? await db.select().from(commanderGames).where(eq(commanderGames.status, status)).orderBy(desc(commanderGames.startedAt))
      : await db.select().from(commanderGames).orderBy(desc(commanderGames.startedAt))
    return rows.map((row) => ({
      id: row.id,
      status: row.status,
      startingLife: row.startingLife,
      startedAt: row.startedAt,
      endedAt: row.endedAt ?? undefined,
    }))
  },

  async create(input: CreateCommanderGameInput) {
    const uniqueIds = [...new Set(input.playerIds)]
    const players = await db.select().from(commanderPlayers).where(inArray(commanderPlayers.id, uniqueIds))
    if (players.length !== uniqueIds.length) {
      throw badRequest('Um ou mais jogadores selecionados não existem')
    }

    const season = await commanderSeasonService.ensureActive()
    const now = new Date()
    const gameId = randomUUID()
    await db.insert(commanderGames).values({
      id: gameId,
      seasonId: season.id,
      status: 'active',
      startingLife: input.startingLife,
      startedAt: now,
    })
    await db.insert(commanderGamePlayers).values(
      uniqueIds.map((playerId) => ({
        id: randomUUID(),
        gameId,
        playerId,
        life: input.startingLife,
        createdAt: now,
        updatedAt: now,
      })),
    )

    return loadDetail(gameId)
  },

  async getDetail(gameId: string) {
    return loadDetail(gameId)
  },

  async end(gameId: string, input?: EndCommanderGameInput) {
    const [game] = await db.select().from(commanderGames).where(eq(commanderGames.id, gameId))
    if (!game) throw notFound('Mesão não encontrado')

    const now = new Date()

    // Colocação final (1 = venceu), na ordem em que os jogadores foram enviados.
    // Valida que os ids batem exatamente com quem estava sentado na mesa.
    if (input?.standings && input.standings.length > 0) {
      const seated = await db
        .select({ playerId: commanderGamePlayers.playerId })
        .from(commanderGamePlayers)
        .where(eq(commanderGamePlayers.gameId, gameId))
      const seatedIds = new Set(seated.map((r) => r.playerId))
      const uniqueStandings = [...new Set(input.standings)]
      if (uniqueStandings.length !== seatedIds.size || uniqueStandings.some((id) => !seatedIds.has(id))) {
        throw badRequest('As posições precisam listar exatamente os jogadores da mesa')
      }
      for (let i = 0; i < uniqueStandings.length; i++) {
        await db
          .update(commanderGamePlayers)
          .set({ placement: i + 1, updatedAt: now })
          .where(and(eq(commanderGamePlayers.gameId, gameId), eq(commanderGamePlayers.playerId, uniqueStandings[i])))
      }
    }

    await db
      .update(commanderDamageRequests)
      .set({ status: 'dismissed', resolvedAt: now })
      .where(and(eq(commanderDamageRequests.gameId, gameId), eq(commanderDamageRequests.status, 'pending')))
    await db
      .update(commanderGames)
      .set({ status: 'ended', endedAt: now })
      .where(eq(commanderGames.id, gameId))

    return loadDetail(gameId)
  },
}
