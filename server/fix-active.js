const mysql = require('mysql2/promise');
require('dotenv').config();

async function fixIsActive() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'kosora_db',
    port: process.env.DB_PORT || 3306,
  });

  try {
    const [result] = await pool.query(
      'UPDATE users SET is_active = TRUE WHERE is_active IS NULL OR is_active = 0'
    );
    console.log(`Fixed is_active for ${result.affectedRows} users`);

    const [users] = await pool.query('SELECT id, email, role, is_active FROM users');
    console.log('\nCurrent users:');
    users.forEach(u => {
      console.log(`  ID: ${u.id}, Email: ${u.email}, Role: ${u.role}, Active: ${u.is_active}`);
    });
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await pool.end();
  }
}

fixIsActive();
