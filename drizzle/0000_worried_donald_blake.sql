CREATE TABLE `products` (
	`id` integer PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`category` text NOT NULL,
	`price` integer NOT NULL,
	`stock` integer DEFAULT 0 NOT NULL,
	`material` text DEFAULT 'PETG' NOT NULL,
	`color` text DEFAULT '' NOT NULL,
	`description` text DEFAULT '' NOT NULL
);
