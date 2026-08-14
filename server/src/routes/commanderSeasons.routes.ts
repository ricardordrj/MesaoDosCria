import type { FastifyInstance } from 'fastify'
import { commanderSeasonService } from '../services/commanderSeason.service.js'
import { resetCommanderSeasonInputSchema } from '../schemas.js'
import { parseBody } from '../lib/validate.js'

export async function commanderSeasonRoutes(app: FastifyInstance) {
  app.get('/commander-seasons', async () => {
    return commanderSeasonService.list()
  })

  app.get('/commander-seasons/leaderboard', async (request) => {
    const { seasonId } = request.query as { seasonId?: string }
    return commanderSeasonService.leaderboard(seasonId)
  })

  app.post('/commander-seasons/reset', async (request, reply) => {
    const input = parseBody(resetCommanderSeasonInputSchema, request.body ?? {})
    const season = await commanderSeasonService.reset(input.name)
    reply.code(201)
    return season
  })
}
