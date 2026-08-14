import type { FastifyInstance } from 'fastify'
import { commanderGameService } from '../services/commanderGame.service.js'
import { commanderDamageRequestService } from '../services/commanderDamageRequest.service.js'
import {
  createCommanderGameInputSchema,
  endCommanderGameInputSchema,
  createCommanderDamageRequestInputSchema,
  createCommanderGlobalDamageRequestInputSchema,
  resolveCommanderDamageRequestInputSchema,
} from '../schemas.js'
import { parseBody } from '../lib/validate.js'

export async function commanderGameRoutes(app: FastifyInstance) {
  app.get('/commander-games', async (request) => {
    const { status } = request.query as { status?: 'active' | 'ended' }
    return commanderGameService.list(status)
  })

  app.post('/commander-games', async (request, reply) => {
    const input = parseBody(createCommanderGameInputSchema, request.body)
    const game = await commanderGameService.create(input)
    reply.code(201)
    return game
  })

  app.get('/commander-games/:id', async (request) => {
    const { id } = request.params as { id: string }
    return commanderGameService.getDetail(id)
  })

  app.post('/commander-games/:id/end', async (request) => {
    const { id } = request.params as { id: string }
    const input = parseBody(endCommanderGameInputSchema, request.body ?? {})
    return commanderGameService.end(id, input)
  })

  app.post('/commander-games/:id/damage-requests', async (request, reply) => {
    const { id: gameId } = request.params as { id: string }
    const input = parseBody(createCommanderDamageRequestInputSchema, request.body)
    const created = await commanderDamageRequestService.create(gameId, input)
    reply.code(201)
    return created
  })

  app.post('/commander-games/:id/damage-requests/broadcast', async (request, reply) => {
    const { id: gameId } = request.params as { id: string }
    const input = parseBody(createCommanderGlobalDamageRequestInputSchema, request.body)
    const created = await commanderDamageRequestService.createGlobal(gameId, input)
    reply.code(201)
    return created
  })

  app.patch('/commander-games/:id/damage-requests/:requestId', async (request) => {
    const { id: gameId, requestId } = request.params as { id: string; requestId: string }
    const input = parseBody(resolveCommanderDamageRequestInputSchema, request.body)
    return commanderDamageRequestService.resolve(gameId, requestId, input)
  })
}
