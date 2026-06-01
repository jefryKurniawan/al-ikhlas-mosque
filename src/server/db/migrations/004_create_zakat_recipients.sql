CREATE TABLE IF NOT EXISTS zakat_recipients (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  address TEXT,
  category VARCHAR(50) NOT NULL,
  amount INT NOT NULL,
  date DATE NOT NULL,
  description TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_zakat_recipients_date ON zakat_recipients(date);
CREATE INDEX idx_zakat_recipients_category ON zakat_recipients(category);
