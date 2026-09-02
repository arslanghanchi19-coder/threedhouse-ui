CREATE TABLE `orders` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text NOT NULL,
	`customer_name` text NOT NULL,
	`phone` text NOT NULL,
	`email` text DEFAULT '' NOT NULL,
	`address` text NOT NULL,
	`city` text NOT NULL,
	`state` text NOT NULL,
	`pincode` text NOT NULL,
	`payment_method` text NOT NULL,
	`payment_status` text DEFAULT 'pending' NOT NULL,
	`order_status` text DEFAULT 'new' NOT NULL,
	`subtotal` integer NOT NULL,
	`shipping` integer DEFAULT 0 NOT NULL,
	`total` integer NOT NULL,
	`items` text NOT NULL
);
