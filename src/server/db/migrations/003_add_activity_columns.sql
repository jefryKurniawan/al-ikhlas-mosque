-- Add event_time and category columns to activities table
-- These were added to the Drizzle schema but missing from migrations

ALTER TABLE `activities` ADD COLUMN `event_time` VARCHAR(10) DEFAULT NULL AFTER `event_date`;
ALTER TABLE `activities` ADD COLUMN `category` VARCHAR(20) NOT NULL DEFAULT 'besar' AFTER `event_time`;
