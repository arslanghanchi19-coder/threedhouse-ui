CREATE TABLE `quotes` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text NOT NULL,
	`customer_name` text NOT NULL,
	`phone` text NOT NULL,
	`email` text DEFAULT '' NOT NULL,
	`project_type` text NOT NULL,
	`description` text NOT NULL,
	`quantity` integer DEFAULT 1 NOT NULL,
	`status` text DEFAULT 'new' NOT NULL,
	`owner_note` text DEFAULT '' NOT NULL
);
--> statement-breakpoint
ALTER TABLE `orders` ADD `courier` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `tracking_number` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `tracking_url` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `orders` ADD `owner_note` text DEFAULT '' NOT NULL;