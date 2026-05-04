const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function seed() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'kosora_db',
    port: process.env.DB_PORT || 3306,
  });

  try {
    const email = 'admin@kosora.com';
    const password = 'admin123';
    const name = 'Super Admin';
    const phone = '+250788888888';

    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);

    if (existing.length > 0) {
      console.log('Super admin already exists. Skipping.');
    } else {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      await pool.query(
        'INSERT INTO users (school_id, role, name, email, password_hash, phone, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [null, 'super_admin', name, email, passwordHash, phone, true]
      );

      console.log('Super admin created successfully!');
    }

    console.log('\nLogin with:');
    console.log('  Email: admin@kosora.com');
    console.log('  Password: admin123');
  } catch (err) {
    console.error('Error:', err.message);
    if (err.code === 'ECONNREFUSED') {
      console.error('Cannot connect to MySQL. Make sure MySQL is running.');
    } else if (err.code === 'ER_NO_SUCH_TABLE') {
      console.error('Database tables not found. Run the schema.sql first.');
    }
  } finally {
    await pool.end();
  }
}

seed();
