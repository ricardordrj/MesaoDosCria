import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import { env } from '../env.js'
import * as schema from './schema.js'

const client = createClient({ url: env.DB_URL })
await client.execute('PRAGMA foreign_keys = ON')

export const db = drizzle(client, { schema })
