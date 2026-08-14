import { createReadStream } from 'node:fs'
import type { FastifyInstance } from 'fastify'
import { commanderPlayerService } from '../services/commanderPlayer.service.js'
import { createCommanderPlayerInputSchema, updateCommanderPlayerInputSchema } from '../schemas.js'
import { parseBody } from '../lib/validate.js'
import { badRequest } from '../lib/errors.js'

export async function commanderPlayerRoutes(app: FastifyInstance) {
  app.get('/commander-players', async () => commanderPlayerService.list())

  app.post('/commander-players', async (request, reply) => {
    const input = parseBody(createCommanderPlayerInputSchema, request.body)
    const player = await commanderPlayerService.create(input)
    reply.code(201)
    return player
  })

  app.patch('/commander-players/:id', async (request) => {
    const { id } = request.params as { id: string }
    const patch = parseBody(updateCommanderPlayerInputSchema, request.body)
    return commanderPlayerService.update(id, patch)
  })

  app.delete('/commander-players/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    await commanderPlayerService.remove(id)
    reply.code(204)
    return null
  })

  app.post('/commander-players/:id/avatar', async (request, reply) => {
    const { id } = request.params as { id: string }
    const data = await request.file()
    if (!data) throw badRequest('Nenhum arquivo enviado')
    const buffer = await data.toBuffer()
    const player = await commanderPlayerService.setAvatar(id, {
      fileName: data.filename,
      mimeType: data.mimetype,
      buffer,
    })
    reply.code(201)
    return player
  })

  app.get('/commander-players/:id/avatar', async (request, reply) => {
    const { id } = request.params as { id: string }
    const { filePath, mimeType } = await commanderPlayerService.getAvatarFile(id)
    reply.header('Content-Type', mimeType)
    return reply.send(createReadStream(filePath))
  })
}
