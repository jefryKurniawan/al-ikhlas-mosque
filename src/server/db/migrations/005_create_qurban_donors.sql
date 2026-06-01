-- Migration 005: Create qurban_donors table
-- Stores individual donors who performed qurban through the masjid

CREATE TABLE IF NOT EXISTS qurban_donors (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  animal_type VARCHAR(50) NOT NULL COMMENT 'sapi, kambing, domba',
  `portion` VARCHAR(20) NOT NULL COMMENT '1/7, 1/1, 1',
  amount INT NOT NULL,
  year INT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
