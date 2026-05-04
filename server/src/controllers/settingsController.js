const { getDb } = require('../config/database');

exports.getSystemSettings = async (req, res) => {
  const db = getDb();
  try {
    const [settings] = await db.query(
      'SELECT setting_key, setting_value FROM system_settings WHERE school_id = 0'
    );

    const defaults = {
      ollama_url: process.env.OLLAMA_URL || 'http://localhost:11434',
      ollama_model: process.env.OLLAMA_MODEL || 'llama3',
      scanner_url: process.env.PYTHON_SCANNER_URL || 'http://localhost:5001',
      jwt_expire: process.env.JWT_EXPIRE || '7d',
      max_file_size: process.env.MAX_FILE_SIZE || '10485760',
    };

    const result = { ...defaults };
    settings.forEach(s => { result[s.setting_key] = s.setting_value; });

    res.json({ settings: result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch settings' });
  }
};

exports.updateSystemSetting = async (req, res) => {
  const db = getDb();
  try {
    const { key, value } = req.body;

    await db.query(
      'INSERT INTO system_settings (school_id, setting_key, setting_value) VALUES (0, ?, ?) ON DUPLICATE KEY UPDATE setting_value = ?',
      [key, value, value]
    );

    res.json({ message: 'Setting updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update setting' });
  }
};
