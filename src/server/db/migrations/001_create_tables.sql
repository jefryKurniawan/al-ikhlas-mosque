-- ============================================================
-- Al Ikhlas Mosque — Database Schema
-- ============================================================

CREATE TABLE IF NOT EXISTS `users` (
  `id` VARCHAR(36) PRIMARY KEY,
  `username` VARCHAR(255) UNIQUE,
  `email` VARCHAR(255) UNIQUE,
  `password_hash` VARCHAR(255),
  `provider` VARCHAR(20) NOT NULL DEFAULT 'credentials',
  `provider_id` VARCHAR(255),
  `role` VARCHAR(20) NOT NULL DEFAULT 'admin',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_users_email` (`email`),
  INDEX `idx_users_provider` (`provider`, `provider_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `sessions` (
  `id` VARCHAR(64) PRIMARY KEY,
  `user_id` VARCHAR(36) NOT NULL,
  `expires_at` DATETIME NOT NULL,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `idx_sessions_user` (`user_id`),
  INDEX `idx_sessions_expires` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `transactions` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `type` VARCHAR(20) NOT NULL,
  `amount` INT NOT NULL,
  `date` DATE NOT NULL,
  `donor_name` VARCHAR(255),
  `description` TEXT,
  `category` VARCHAR(50),
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_transactions_type` (`type`),
  INDEX `idx_transactions_date` (`date`),
  INDEX `idx_transactions_type_date` (`type`, `date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `qurban_tiers` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `amount` INT NOT NULL,
  `description` TEXT,
  `image_url` VARCHAR(500),
  `sort_order` INT NOT NULL DEFAULT 0,
  `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
  INDEX `idx_qurban_active` (`is_active`, `sort_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `activities` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `event_date` DATE NOT NULL,
  `description` TEXT,
  `image_url` VARCHAR(500),
  `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
  INDEX `idx_activities_active` (`is_active`, `event_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
