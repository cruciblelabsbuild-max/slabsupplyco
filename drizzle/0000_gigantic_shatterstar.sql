CREATE TABLE `analytics_events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`event_name` text NOT NULL,
	`session_id` text NOT NULL,
	`path` text NOT NULL,
	`metadata` text DEFAULT '{}' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `trade_in_interests` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`first_name` text NOT NULL,
	`email` text NOT NULL,
	`grader` text NOT NULL,
	`estimated_value` text NOT NULL,
	`timeframe` text NOT NULL,
	`card_details` text NOT NULL,
	`ip_hash` text NOT NULL,
	`consent` integer DEFAULT false NOT NULL,
	`status` text DEFAULT 'new' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `waitlist_entries` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`first_name` text NOT NULL,
	`email` text NOT NULL,
	`interest` text NOT NULL,
	`collecting_focus` text DEFAULT '' NOT NULL,
	`referral_code` text NOT NULL,
	`referred_by` text DEFAULT '' NOT NULL,
	`utm_source` text DEFAULT '' NOT NULL,
	`utm_medium` text DEFAULT '' NOT NULL,
	`utm_campaign` text DEFAULT '' NOT NULL,
	`ip_hash` text NOT NULL,
	`consent` integer DEFAULT false NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `waitlist_entries_email_unique` ON `waitlist_entries` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `waitlist_entries_referral_code_unique` ON `waitlist_entries` (`referral_code`);