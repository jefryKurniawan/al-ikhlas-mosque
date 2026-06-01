-- Add image_url column to qurban_tiers and activities tables
ALTER TABLE `qurban_tiers` ADD COLUMN `image_url` VARCHAR(500) AFTER `description`;
ALTER TABLE `activities` ADD COLUMN `image_url` VARCHAR(500) AFTER `description`;
