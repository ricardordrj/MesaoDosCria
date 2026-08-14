import { randomUUID } from 'node:crypto'
import path from 'node:path'
import fs from 'node:fs/promises'
import { eq, or } from 'drizzle-orm'
import { db } from '../db/client.js'
import { commanderPlayers, commanderGamePlayers, commanderDamageRequests } from '../db/schema.js'
import { env } from '../env.js'
import { notFound, badRequest, conflict } from '../lib/errors.js'
import { resolveAttachmentKind, MAX_FILE_SIZE_BYTES } from '../lib/uploadValidation.js'
import type { CreateCommanderPlayerInput, UpdateCommanderPlayerInput } from '../schemas.js'

const uploadsDir = path.resolve(env.UPLOADS_DIR)

async function ensureUploadsDir() {
  await fs.mkdir(uploadsDir, { recursive: true })
}

function safePathFor(storedName: string): string {
  const resolved = path.resolve(uploadsDir, storedName)
  if (resolved !== uploadsDir && !resolved.startsWith(uploadsDir + path.sep)) {
    throw badRequest('Nome de arquivo inválido')
  }
  return resolved
}

type CommanderPlayerRow = typeof commanderPlayers.$inferSelect

function rowToPlayer(row: CommanderPlayerRow) {
  return {
    id: row.id,
    name: row.name,
    colorHex: row.colorHex ?? undefined,
    avatarUrl: row.avatarStoredName ? `/api/commander-players/${row.id}/avatar` : undefined,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

async function loadOne(id: string) {
  const [row] = await db.select().from(commanderPlayers).where(eq(commanderPlayers.id, id))
  return row
}

export const commanderPlayerService = {
  async list() {
    const rows = await db.select().from(commanderPlayers)
    return rows.map(rowToPlayer)
  },

  async create(input: CreateCommanderPlayerInput) {
    const now = new Date()
    const id = randomUUID()
    await db.insert(commanderPlayers).values({
      id,
      name: input.name,
      colorHex: input.colorHex,
      createdAt: now,
      updatedAt: now,
    })
    const row = await loadOne(id)
    return rowToPlayer(row!)
  },

  async update(id: string, patch: UpdateCommanderPlayerInput) {
    const existing = await loadOne(id)
    if (!existing) throw notFound('Jogador não encontrado')

    await db
      .update(commanderPlayers)
      .set({
        name: patch.name ?? existing.name,
        colorHex: patch.colorHex === undefined ? existing.colorHex : patch.colorHex,
        updatedAt: new Date(),
      })
      .where(eq(commanderPlayers.id, id))
    const row = await loadOne(id)
    return rowToPlayer(row!)
  },

  async remove(id: string) {
    const existing = await loadOne(id)
    if (!existing) throw notFound('Jogador não encontrado')

    const [[gamePlayerRow], [damageRow]] = await Promise.all([
      db.select({ id: commanderGamePlayers.id }).from(commanderGamePlayers).where(eq(commanderGamePlayers.playerId, id)).limit(1),
      db
        .select({ id: commanderDamageRequests.id })
        .from(commanderDamageRequests)
        .where(or(eq(commanderDamageRequests.fromPlayerId, id), eq(commanderDamageRequests.toPlayerId, id)))
        .limit(1),
    ])
    if (gamePlayerRow || damageRow) {
      throw conflict('Não é possível excluir: esse jogador já participou de algum mesão')
    }

    if (existing.avatarStoredName) {
      await fs.rm(safePathFor(existing.avatarStoredName), { force: true })
    }
    await db.delete(commanderPlayers).where(eq(commanderPlayers.id, id))
  },

  async setAvatar(id: string, params: { fileName: string; mimeType: string; buffer: Buffer }) {
    const existing = await loadOne(id)
    if (!existing) throw notFound('Jogador não encontrado')

    const kind = resolveAttachmentKind(params.fileName)
    if (kind !== 'image') {
      throw badRequest('Envie uma imagem (png, jpg, gif, webp ou svg)')
    }
    if (params.buffer.byteLength > MAX_FILE_SIZE_BYTES) {
      throw badRequest('Imagem maior que o limite de 25MB')
    }

    await ensureUploadsDir()
    const ext = path.extname(params.fileName).toLowerCase()
    const storedName = `${randomUUID()}${ext}`
    await fs.writeFile(safePathFor(storedName), params.buffer)

    if (existing.avatarStoredName) {
      await fs.rm(safePathFor(existing.avatarStoredName), { force: true })
    }

    await db
      .update(commanderPlayers)
      .set({ avatarStoredName: storedName, avatarMimeType: params.mimeType, updatedAt: new Date() })
      .where(eq(commanderPlayers.id, id))
    const row = await loadOne(id)
    return rowToPlayer(row!)
  },

  async getAvatarFile(id: string) {
    const existing = await loadOne(id)
    if (!existing?.avatarStoredName || !existing.avatarMimeType) throw notFound('Avatar não encontrado')
    return {
      filePath: safePathFor(existing.avatarStoredName),
      mimeType: existing.avatarMimeType,
    }
  },
}
