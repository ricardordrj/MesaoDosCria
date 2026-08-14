import { z } from 'zod'

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(4000),
  DB_URL: z.string().default('file:./data/mesao.db'),
  UPLOADS_DIR: z.string().default('./uploads'),
  NODE_ENV: z.string().default('development'),

  // Login simples por senha compartilhada. Quem tem a senha entra no mesão.
  // Em produção é OBRIGATÓRIO definir uma senha forte; sem ela o app roda
  // aberto (útil só em desenvolvimento local).
  ACCESS_PASSWORD: z.string().default(''),
  // Segredo usado para assinar o token de sessão (JWT). Troque em produção.
  SESSION_SECRET: z.string().default('dev-mesao-secret-troque-em-producao'),
  // Validade do token de sessão.
  SESSION_TTL: z.string().default('30d'),
})

export const env = envSchema.parse(process.env)
