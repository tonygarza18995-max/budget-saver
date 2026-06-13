CREATE TABLE `bug_reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`description` text NOT NULL,
	`screen` varchar(255),
	`platform` varchar(50),
	`email` varchar(320),
	`status` enum('new','in_progress','resolved','closed') NOT NULL DEFAULT 'new',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `bug_reports_id` PRIMARY KEY(`id`)
);
