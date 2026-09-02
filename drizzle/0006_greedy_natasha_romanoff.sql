CREATE TABLE `making_videos` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text NOT NULL,
	`title` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`video_key` text NOT NULL
);
