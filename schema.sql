-- PulseChat MySQL Database Schema
-- Run this in your Cloud MySQL database (e.g., TiDB Cloud, Aiven, Railway)

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  profile_image LONGTEXT DEFAULT NULL,
  status ENUM('online','offline') DEFAULT 'offline',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  bio VARCHAR(255) DEFAULT 'Available'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS conversations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_one_id INT DEFAULT NULL,
  user_two_id INT DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  is_group TINYINT(1) DEFAULT 0,
  name VARCHAR(150) DEFAULT NULL,
  group_image LONGTEXT DEFAULT NULL,
  created_by INT DEFAULT NULL,
  FOREIGN KEY (user_one_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (user_two_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS conversation_members (
  id INT AUTO_INCREMENT PRIMARY KEY,
  conversation_id INT NOT NULL,
  user_id INT NOT NULL,
  role ENUM('admin','member') DEFAULT 'member',
  joined_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_member (conversation_id, user_id),
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS messages (
  id INT AUTO_INCREMENT PRIMARY KEY,
  conversation_id INT NOT NULL,
  sender_id INT NOT NULL,
  message TEXT NOT NULL,
  is_read TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  message_type VARCHAR(20) DEFAULT 'text',
  file_url LONGTEXT DEFAULT NULL,
  reactions TEXT DEFAULT NULL,
  is_edited TINYINT(1) DEFAULT 0,
  is_deleted TINYINT(1) DEFAULT 0,
  reply_to_id INT DEFAULT NULL,
  reply_to_text TEXT DEFAULT NULL,
  reply_to_sender VARCHAR(100) DEFAULT NULL,
  is_pinned TINYINT(1) DEFAULT 0,
  starred_by TEXT DEFAULT NULL,
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
