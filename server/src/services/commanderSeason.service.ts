import { randomUUID } from 'node:crypto'
import { and, desc, eq, isNotNull } from 'drizzle-orm'
import { db } from '../db/client.js'
import { commanderSeasons, commanderGames, commanderGamePlayers, commanderPlayers } from '../db/schema.js'
import { notFound } from '../lib/errors.js'

/**
 * Pontos por colocação final no mesão. Centralizado aqui pra ficar fácil de ajustar
 * a regra do board sem mexer em migration nem em agregação.
 * 1º = 3, 2º = 2, 3º = 1, demais = 0.
 */
export function pointsForPlacement(placement: number): number {
  switch (placement) {
    case 1:
      return 3
    case 2:
      return 2
    case 3:
      return 1
    default:
      return 0
  }
}

type SeasonRow = typeof commanderSeasons.$inferSelect

function playerAvatarUrl(row: typeof commanderPlayers.$inferSelect) {
  return row.avatarStoredName ? `/api/commander-players/${row.id}/avatar` : undefined
}

async function countGames(seasonId: string) {
  const rows = await db
    .select({ id: commanderGames.id })
    .from(commanderGames)
    .where(and(eq(commanderGames.seasonId, seasonId), eq(commanderGames.status, 'ended')))
  return rows.length
}

async function rowToSummary(row: SeasonRow) {
  return {
    id: row.id,
    name: row.name,
    status: row.status,
    startedAt: row.startedAt,
    endedAt: row.endedAt ?? undefined,
    gamesCount: await countGames(row.id),
  }
}

async function findActive() {
  const [row] = await db
    .select()
    .from(commanderSeasons)
    .where(eq(commanderSeasons.status, 'active'))
    .orderBy(desc(commanderSeasons.startedAt))
    .limit(1)
  return row
}

async function createSeason(name: string) {
  const now = new Date()
  const id = randomUUID()
  await db.insert(commanderSeasons).values({
    id,
    name,
    status: 'active',
    startedAt: now,
    createdAt: now,
  })
  const [row] = await db.select().from(commanderSeasons).where(eq(commanderSeasons.id, id))
  return row!
}

export const commanderSeasonService = {
  /** Temporada ativa (o "board" atual). Cria uma com o ano corrente se ainda não existir. */
  async ensureActive() {
    const existing = await findActive()
    if (existing) return existing
    return createSeason(String(new Date().getFullYear()))
  },

  async list() {
    const rows = await db.select().from(commanderSeasons).orderBy(desc(commanderSeasons.startedAt))
    return Promise.all(rows.map(rowToSummary))
  },

  /** Arquiva a temporada atual e abre uma nova (nome padrão = ano corrente). */
  async reset(name?: string) {
    const now = new Date()
    const active = await findActive()
    if (active) {
      await db
        .update(commanderSeasons)
        .set({ status: 'archived', endedAt: now })
        .where(eq(commanderSeasons.id, active.id))
    }
    const fresh = await createSeason(name?.trim() || String(now.getFullYear()))
    return rowToSummary(fresh)
  },

  /**
   * Ranking de uma temporada: soma os pontos por colocação de todas as partidas
   * encerradas com posições registradas. Sem seasonId, usa a temporada ativa.
   */
  async leaderboard(seasonId?: string) {
    const season = seasonId
      ? (await db.select().from(commanderSeasons).where(eq(commanderSeasons.id, seasonId)))[0]
      : await this.ensureActive()
    if (!season) throw notFound('Temporada não encontrada')

    const rows = await db
      .select({ gamePlayer: commanderGamePlayers, player: commanderPlayers })
      .from(commanderGamePlayers)
      .innerJoin(commanderGames, eq(commanderGamePlayers.gameId, commanderGames.id))
      .innerJoin(commanderPlayers, eq(commanderGamePlayers.playerId, commanderPlayers.id))
      .where(
        and(
          eq(commanderGames.seasonId, season.id),
          eq(commanderGames.status, 'ended'),
          isNotNull(commanderGamePlayers.placement),
        ),
      )

    const byPlayer = new Map<
      string,
      {
        playerId: string
        name: string
        colorHex?: string
        avatarUrl?: string
        points: number
        wins: number
        podiums: number
        games: number
      }
    >()

    for (const { gamePlayer, player } of rows) {
      const placement = gamePlayer.placement!
      const entry =
        byPlayer.get(player.id) ??
        {
          playerId: player.id,
          name: player.name,
          colorHex: player.colorHex ?? undefined,
          avatarUrl: playerAvatarUrl(player),
          points: 0,
          wins: 0,
          podiums: 0,
          games: 0,
        }
      entry.points += pointsForPlacement(placement)
      if (placement === 1) entry.wins += 1
      if (placement <= 3) entry.podiums += 1
      entry.games += 1
      byPlayer.set(player.id, entry)
    }

    const standings = [...byPlayer.values()].sort(
      (a, b) => b.points - a.points || b.wins - a.wins || b.games - a.games || a.name.localeCompare(b.name),
    )

    return {
      season: await rowToSummary(season),
      standings: standings.map((s, i) => ({ ...s, rank: i + 1 })),
    }
  },
}
