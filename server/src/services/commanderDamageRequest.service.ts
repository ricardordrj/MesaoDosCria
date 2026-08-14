import { randomUUID } from 'node:crypto'
import { and, eq } from 'drizzle-orm'
import { db } from '../db/client.js'
import { commanderGames, commanderGamePlayers, commanderDamageRequests, commanderPlayers } from '../db/schema.js'
import { notFound, badRequest, conflict } from '../lib/errors.js'
import type {
  CreateCommanderDamageRequestInput,
  CreateCommanderGlobalDamageRequestInput,
  ResolveCommanderDamageRequestInput,
} from '../schemas.js'

async function loadGamePlayer(gameId: string, playerId: string) {
  const [row] = await db
    .select()
    .from(commanderGamePlayers)
    .where(and(eq(commanderGamePlayers.gameId, gameId), eq(commanderGamePlayers.playerId, playerId)))
  return row
}

async function applyLifeDelta(gameId: string, playerId: string, amount: number) {
  const gamePlayer = await loadGamePlayer(gameId, playerId)
  if (!gamePlayer) throw badRequest('Jogador não está nesse mesão')
  await db
    .update(commanderGamePlayers)
    .set({ life: gamePlayer.life + amount, updatedAt: new Date() })
    .where(eq(commanderGamePlayers.id, gamePlayer.id))
}

async function toPublic(id: string) {
  const [row] = await db.select().from(commanderDamageRequests).where(eq(commanderDamageRequests.id, id))
  if (!row) throw notFound('Solicitação não encontrada')
  const [fromRow] = await db.select().from(commanderPlayers).where(eq(commanderPlayers.id, row.fromPlayerId))
  const [toRow] = await db.select().from(commanderPlayers).where(eq(commanderPlayers.id, row.toPlayerId))
  return {
    id: row.id,
    gameId: row.gameId,
    fromPlayerId: row.fromPlayerId,
    fromPlayerName: fromRow?.name ?? '?',
    toPlayerId: row.toPlayerId,
    toPlayerName: toRow?.name ?? '?',
    amount: row.amount,
    type: row.type,
    commanderName: row.commanderName ?? undefined,
    status: row.status,
    createdAt: row.createdAt,
    resolvedAt: row.resolvedAt ?? undefined,
  }
}

export const commanderDamageRequestService = {
  async create(gameId: string, input: CreateCommanderDamageRequestInput) {
    const [game] = await db.select().from(commanderGames).where(eq(commanderGames.id, gameId))
    if (!game) throw notFound('Mesão não encontrado')
    if (game.status !== 'active') throw conflict('Esse mesão já foi encerrado')

    const [fromSeated, toSeated] = await Promise.all([
      loadGamePlayer(gameId, input.fromPlayerId),
      loadGamePlayer(gameId, input.toPlayerId),
    ])
    if (!fromSeated || !toSeated) throw badRequest('Jogador não está sentado nesse mesão')

    const id = randomUUID()
    const now = new Date()
    const isSelf = input.fromPlayerId === input.toPlayerId

    await db.insert(commanderDamageRequests).values({
      id,
      gameId,
      fromPlayerId: input.fromPlayerId,
      toPlayerId: input.toPlayerId,
      amount: input.amount,
      type: input.type,
      commanderName: input.commanderName,
      status: isSelf ? 'applied' : 'pending',
      createdAt: now,
      resolvedAt: isSelf ? now : undefined,
    })

    if (isSelf) {
      await applyLifeDelta(gameId, input.toPlayerId, input.amount)
    }

    return toPublic(id)
  },

  /** Um jogador causa o mesmo dano a todos os outros sentados na mesa de uma vez (efeito de carta tipo "X a todos"). */
  async createGlobal(gameId: string, input: CreateCommanderGlobalDamageRequestInput) {
    const [game] = await db.select().from(commanderGames).where(eq(commanderGames.id, gameId))
    if (!game) throw notFound('Mesão não encontrado')
    if (game.status !== 'active') throw conflict('Esse mesão já foi encerrado')

    const fromSeated = await loadGamePlayer(gameId, input.fromPlayerId)
    if (!fromSeated) throw badRequest('Jogador não está sentado nesse mesão')

    const seated = await db.select().from(commanderGamePlayers).where(eq(commanderGamePlayers.gameId, gameId))
    const targets = seated.filter((p) => p.playerId !== input.fromPlayerId)
    if (targets.length === 0) throw badRequest('Não há outros jogadores nessa mesa')

    const now = new Date()
    const rows = targets.map((target) => ({
      id: randomUUID(),
      gameId,
      fromPlayerId: input.fromPlayerId,
      toPlayerId: target.playerId,
      amount: input.amount,
      type: input.type,
      commanderName: input.commanderName,
      status: 'pending' as const,
      createdAt: now,
    }))
    await db.insert(commanderDamageRequests).values(rows)

    return Promise.all(rows.map((row) => toPublic(row.id)))
  },

  async resolve(gameId: string, requestId: string, input: ResolveCommanderDamageRequestInput) {
    const [row] = await db.select().from(commanderDamageRequests).where(eq(commanderDamageRequests.id, requestId))
    if (!row || row.gameId !== gameId) throw notFound('Solicitação não encontrada')
    if (row.status !== 'pending') throw conflict('Essa solicitação já foi resolvida')

    if (input.action === 'dismiss') {
      await db
        .update(commanderDamageRequests)
        .set({ status: 'dismissed', resolvedAt: new Date() })
        .where(eq(commanderDamageRequests.id, requestId))
      return toPublic(requestId)
    }

    const finalAmount = input.amount ?? row.amount
    await applyLifeDelta(gameId, row.toPlayerId, finalAmount)
    await db
      .update(commanderDamageRequests)
      .set({ status: 'applied', amount: finalAmount, resolvedAt: new Date() })
      .where(eq(commanderDamageRequests.id, requestId))

    return toPublic(requestId)
  },
}
