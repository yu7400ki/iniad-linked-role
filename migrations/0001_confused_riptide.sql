CREATE TABLE `discord_account` (
	`id` text PRIMARY KEY NOT NULL,
	`username` text NOT NULL,
	`discriminator` text NOT NULL,
	`avatar` text,
	`access_token` text NOT NULL,
	`refresh_token` text NOT NULL,
	`expires_at` integer NOT NULL,
	`user_id` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
