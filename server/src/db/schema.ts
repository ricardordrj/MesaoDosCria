import { sqliteTable, text, integer, uniqueIndex, index } from 'drizzle-orm/sqlite-core'
import { relations } from 'drizzle-orm'

// ---------- commander_players (perfis fixos do mesão de Commander) ----------
export const commanderPlayers = sqliteTable(
  'commander_players',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    colorHex: text('color_hex'),
    avatarStoredName: text('avatar_stored_name'),
    avatarMimeType: text('avatar_mime_type'),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
  },
  (t) => ({
    nameUnique: uniqueIndex('commander_players_name_unique').on(t.name),
  }),
)

// ---------- commander_seasons (temporadas/"boards" do ranking; normalmente reiniciadas por ano) ----------
export const commanderSeasons = sqliteTable(
  'commander_seasons',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    status: text('status', { enum: ['active', 'archived'] }).notNull().default('active'),
    startedAt: integer('started_at', { mode: 'timestamp_ms' }).notNull(),
    endedAt: integer('ended_at', { mode: 'timestamp_ms' }),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
  },
  (t) => ({
    statusIdx: index('commander_seasons_status_idx').on(t.status),
  }),
)

// ---------- commander_games (um mesão/sessão de jogo) ----------
export const commanderGames = sqliteTable(
  'commander_games',
  {
    id: text('id').primaryKey(),
    // temporada em que a partida foi jogada; usado pra agregar o ranking do board
    seasonId: text('season_id').references(() => commanderSeasons.id, { onDelete: 'set null' }),
    status: text('status', { enum: ['active', 'ended'] }).notNull().default('active'),
    startingLife: integer('starting_life').notNull().default(40),
    startedAt: integer('started_at', { mode: 'timestamp_ms' }).notNull(),
    endedAt: integer('ended_at', { mode: 'timestamp_ms' }),
  },
  (t) => ({
    statusIdx: index('commander_games_status_idx').on(t.status),
    seasonIdx: index('commander_games_season_idx').on(t.seasonId),
  }),
)

// ---------- commander_game_players (jogadores sentados numa mesa + vida atual) ----------
export const commanderGamePlayers = sqliteTable(
  'commander_game_players',
  {
    id: text('id').primaryKey(),
    gameId: text('game_id')
      .notNull()
      .references(() => commanderGames.id, { onDelete: 'cascade' }),
    playerId: text('player_id')
      .notNull()
      .references(() => commanderPlayers.id, { onDelete: 'restrict' }),
    life: integer('life').notNull(),
    // posição final na partida (1 = venceu); preenchido ao encerrar o mesão
    placement: integer('placement'),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' }).notNull(),
  },
  (t) => ({
    gamePlayerUnique: uniqueIndex('commander_game_players_game_player_unique').on(t.gameId, t.playerId),
    gameIdx: index('commander_game_players_game_idx').on(t.gameId),
  }),
)

// ---------- commander_damage_requests (solicitação de dano/ajuste de vida; auto-aplicada quando from === to) ----------
export const commanderDamageRequests = sqliteTable(
  'commander_damage_requests',
  {
    id: text('id').primaryKey(),
    gameId: text('game_id')
      .notNull()
      .references(() => commanderGames.id, { onDelete: 'cascade' }),
    fromPlayerId: text('from_player_id')
      .notNull()
      .references(() => commanderPlayers.id, { onDelete: 'restrict' }),
    toPlayerId: text('to_player_id')
      .notNull()
      .references(() => commanderPlayers.id, { onDelete: 'restrict' }),
    // delta aplicado à vida (negativo = dano, positivo = ganho/cura)
    amount: integer('amount').notNull(),
    type: text('type', { enum: ['combat', 'commander', 'life_adjust', 'other'] }).notNull(),
    commanderName: text('commander_name'),
    status: text('status', { enum: ['pending', 'applied', 'dismissed'] }).notNull().default('pending'),
    createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
    resolvedAt: integer('resolved_at', { mode: 'timestamp_ms' }),
  },
  (t) => ({
    gameIdx: index('commander_damage_requests_game_idx').on(t.gameId),
    gameStatusIdx: index('commander_damage_requests_game_status_idx').on(t.gameId, t.status),
    toPlayerIdx: index('commander_damage_requests_to_player_idx').on(t.toPlayerId),
  }),
)

// ---------- relations ----------
export const commanderPlayersRelations = relations(commanderPlayers, ({ many }) => ({
  gamePlayers: many(commanderGamePlayers),
}))

export const commanderSeasonsRelations = relations(commanderSeasons, ({ many }) => ({
  games: many(commanderGames),
}))

export const commanderGamesRelations = relations(commanderGames, ({ many, one }) => ({
  gamePlayers: many(commanderGamePlayers),
  damageRequests: many(commanderDamageRequests),
  season: one(commanderSeasons, { fields: [commanderGames.seasonId], references: [commanderSeasons.id] }),
}))

export const commanderGamePlayersRelations = relations(commanderGamePlayers, ({ one }) => ({
  game: one(commanderGames, { fields: [commanderGamePlayers.gameId], references: [commanderGames.id] }),
  player: one(commanderPlayers, { fields: [commanderGamePlayers.playerId], references: [commanderPlayers.id] }),
}))

export const commanderDamageRequestsRelations = relations(commanderDamageRequests, ({ one }) => ({
  game: one(commanderGames, { fields: [commanderDamageRequests.gameId], references: [commanderGames.id] }),
  fromPlayer: one(commanderPlayers, {
    fields: [commanderDamageRequests.fromPlayerId],
    references: [commanderPlayers.id],
    relationName: 'damage_from_player',
  }),
  toPlayer: one(commanderPlayers, {
    fields: [commanderDamageRequests.toPlayerId],
    references: [commanderPlayers.id],
    relationName: 'damage_to_player',
  }),
}))
