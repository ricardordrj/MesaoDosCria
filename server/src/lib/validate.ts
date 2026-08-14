import type { ZodType } from 'zod'
import { badRequest } from './errors.js'

export function parseBody<T>(schema: ZodType<T>, body: unknown): T {
  const result = schema.safeParse(body)
  if (!result.success) {
    throw badRequest(result.error.issues.map((issue) => issue.message).join(', '))
  }
  return result.data
}
