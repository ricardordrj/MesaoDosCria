import { z } from 'zod'

export const baseEntitySchema = z.object({
  id: z.uuid(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type BaseEntity = z.infer<typeof baseEntitySchema>
