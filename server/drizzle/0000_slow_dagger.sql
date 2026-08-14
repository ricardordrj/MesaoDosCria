CREATE TABLE `commander_damage_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`game_id` text NOT NULL,
	`from_player_id` text NOT NULL,
	`to_player_id` text NOT NULL,
	`amount` integer NOT NULL,
	`type` text NOT NULL,
	`commander_name` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`created_at` integer NOT NULL,
	`resolved_at` integer,
	FOREIGN KEY (`game_id`) REFERENCES `commander_games`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`from_player_id`) REFERENCES `commander_players`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`to_player_id`) REFERENCES `commander_players`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE INDEX `commander_damage_requests_game_idx` ON `commander_damage_requests` (`game_id`);--> statement-breakpoint
CREATE INDEX `commander_damage_requests_game_status_idx` ON `commander_damage_requests` (`game_id`,`status`);--> statement-breakpoint
CREATE INDEX `commander_damage_requests_to_player_idx` ON `commander_damage_requests` (`to_player_id`);--> statement-breakpoint
CREATE TABLE `commander_game_players` (
	`id` text PRIMARY KEY NOT NULL,
	`game_id` text NOT NULL,
	`player_id` text NOT NULL,
	`life` integer NOT NULL,
	`placement` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`game_id`) REFERENCES `commander_games`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`player_id`) REFERENCES `commander_players`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE UNIQUE INDEX `commander_game_players_game_player_unique` ON `commander_game_players` (`game_id`,`player_id`);--> statement-breakpoint
CREATE INDEX `commander_game_players_game_idx` ON `commander_game_players` (`game_id`);--> statement-breakpoint
CREATE TABLE `commander_games` (
	`id` text PRIMARY KEY NOT NULL,
	`season_id` text,
	`status` text DEFAULT 'active' NOT NULL,
	`starting_life` integer DEFAULT 40 NOT NULL,
	`started_at` integer NOT NULL,
	`ended_at` integer,
	FOREIGN KEY (`season_id`) REFERENCES `commander_seasons`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `commander_games_status_idx` ON `commander_games` (`status`);--> statement-breakpoint
CREATE INDEX `commander_games_season_idx` ON `commander_games` (`season_id`);--> statement-breakpoint
CREATE TABLE `commander_players` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`color_hex` text,
	`avatar_stored_name` text,
	`avatar_mime_type` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `commander_players_name_unique` ON `commander_players` (`name`);--> statement-breakpoint
CREATE TABLE `commander_seasons` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`started_at` integer NOT NULL,
	`ended_at` integer,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `commander_seasons_status_idx` ON `commander_seasons` (`status`);