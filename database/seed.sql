-- =============================================
-- KOSORA APP - Seed Data
-- Creates default super admin account
-- =============================================

USE kosora_db;

-- Insert super admin
-- Email: admin@kosora.com
-- Password: admin123
INSERT INTO users (school_id, role, name, email, password_hash, phone, is_active)
VALUES (
  NULL,
  'super_admin',
  'Super Admin',
  'admin@kosora.com',
  '$2a$10$rH8f5qVJZqJqJqJqJqJqJuZqJqJqJqJqJqJqJqJqJqJqJqJqJqJqJ',
  '+250788888888',
  TRUE
) ON DUPLICATE KEY UPDATE name = VALUES(name);

-- Since we can't pre-hash in SQL, let's use a known bcrypt hash for 'admin123'
-- Hash: $2a$10$YourHashHere - we'll create it via script instead
