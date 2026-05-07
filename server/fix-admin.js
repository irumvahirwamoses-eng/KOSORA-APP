const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function fixSuperAdmin() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'kosora_db',
    port: process.env.DB_PORT || 3306,
  });

  try {
    const password = 'admin123';
    const email = 'admin@kosora.com';

    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);

    if (existing.length === 0) {
      console.log('Super admin not found. Creating...');
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);
      await pool.query(
        'INSERT INTO users (school_id, role, name, email, password_hash, phone, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [null, 'super_admin', 'Super Admin', email, passwordHash, '+250788888888', true]
      );
      console.log('Super admin created!');
    } else {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);
      await pool.query(
        'UPDATE users SET password_hash = ?, is_active = TRUE WHERE email = ?',
        [passwordHash, email]
      );
      console.log('Super admin password reset!');
    }

    const [users] = await pool.query('SELECT id, email, role, is_active FROM users');
    console.log('\nAll users:');
    users.forEach(u => console.log(`  ${u.id}: ${u.email} (${u.role}) - Active: ${u.is_active}`));

  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await pool.end();
  }
}

fixSuperAdmin();
