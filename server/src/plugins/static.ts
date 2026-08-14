import path from 'node:path'
import fastifyStatic from '@fastify/static'
import type { FastifyInstance } from 'fastify'

export async function registerStatic(app: FastifyInstance) {
  const distPath = path.resolve(import.meta.dirname, '../../../dist')

  await app.register(fastifyStatic, {
    root: distPath,
    wildcard: false,
  })

  app.setNotFoundHandler((request, reply) => {
    if (request.raw.url?.startsWith('/api')) {
      reply.code(404).send({ error: 'Not found' })
      return
    }
    reply.sendFile('index.html', distPath)
  })
}
