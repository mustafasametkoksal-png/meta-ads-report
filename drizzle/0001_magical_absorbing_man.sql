CREATE TABLE `brands` (
	`id` int AUTO_INCREMENT NOT NULL,
	`reportId` int NOT NULL,
	`brandName` varchar(255) NOT NULL,
	`pageId` varchar(64) NOT NULL,
	`brandColor` varchar(7) NOT NULL,
	`adsCount` int NOT NULL,
	`cachedData` json,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `brands_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`shareToken` varchar(64) NOT NULL,
	`reportName` varchar(255) NOT NULL,
	`brandCount` int NOT NULL,
	`reportData` json NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `reports_id` PRIMARY KEY(`id`),
	CONSTRAINT `reports_shareToken_unique` UNIQUE(`shareToken`)
);
