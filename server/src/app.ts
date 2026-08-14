import Fastify from 'fastify'
import type { FastifyError } from 'fastify'
import cors from '@fastify/cors'
import multipart from '@fastify/multipart'
import { HttpError } from './lib/errors.js'
import { authDisabled, checkPassword, createSessionToken, isAuthenticated } from './lib/auth.js'
import { parseBody } from './lib/validate.js'
import { createSessionInputSchema } from './schemas.js'
import { env } from './env.js'
import { MAX_FILE_SIZE_BYTES } from './lib/uploadValidation.js'
import { commanderPlayerRoutes } from './routes/commanderPlayers.routes.js'
import { commanderGameRoutes } from './routes/commanderGames.routes.js'
import { commanderSeasonRoutes } from './routes/commanderSeasons.routes.js'
import { registerStatic } from './plugins/static.js'

export function buildApp() {
  const app = Fastify({ logger: true })

  app.register(cors, { origin: true })
  app.register(multipart, { limits: { fileSize: MAX_FILE_SIZE_BYTES } })

  app.setErrorHandler((error: FastifyError, _request, reply) => {
    if (error instanceof HttpError) {
      reply.code(error.statusCode).send({ error: error.message })
      return
    }
    if (error.statusCode && error.statusCode < 500) {
      reply.code(error.statusCode).send({ error: error.message })
      return
    }
    app.log.error(error)
    reply.code(500).send({ error: 'Erro interno do servidor' })
  })

  app.get('/api/health', async () => ({ status: 'ok' }))

  // Login por senha compartilhada: devolve um token de sessão que o app guarda.
  app.post('/api/session', async (request, reply) => {
    const { password } = parseBody(createSessionInputSchema, request.body)
    if (!checkPassword(password)) {
      reply.code(401).send({ error: 'Senha incorreta' })
      return
    }
    const token = await createSessionToken()
    return { token }
  })

  // Diz ao frontend se o servidor exige senha (pra mostrar ou pular o login).
  app.get('/api/auth-config', async () => ({ authRequired: !authDisabled() }))

  // Protege toda a API (menos health, login e a checagem de config de auth).
  app.addHook('onRequest', async (request, reply) => {
    const url = request.raw.url ?? ''
    if (!url.startsWith('/api')) return
    if (
      url === '/api/health' ||
      url.startsWith('/api/health?') ||
      url === '/api/session' ||
      url === '/api/auth-config' ||
      url.startsWith('/api/auth-config?')
    ) {
      return
    }

    const ok = await isAuthenticated(request.headers['authorization'])
    if (!ok) {
      reply.code(401).send({ error: 'Não autenticado' })
      return
    }
  })

  app.register(commanderPlayerRoutes, { prefix: '/api' })
  app.register(commanderGameRoutes, { prefix: '/api' })
  app.register(commanderSeasonRoutes, { prefix: '/api' })

  if (env.NODE_ENV === 'production') {
    app.register(registerStatic)
  }

  return app
}
