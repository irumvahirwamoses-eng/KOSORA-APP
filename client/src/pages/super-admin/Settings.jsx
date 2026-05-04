import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';

const Settings = () => {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState(null);

  useEffect(() => { fetch(); }, []);

  const fetch = async () => {
    try {
      const res = await api.get('/api/settings');
      setSettings(res.data.settings || {});
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleSave = async (key) => {
    setSavingKey(key);
    try {
      await api.put('/api/settings', { key, value: settings[key] });
      toast.success('Setting saved');
    } catch (e) { toast.error('Failed to save'); }
    finally { setSavingKey(null); }
  };

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-kosora-600"></div></div>;

  const fields = [
    { key: 'ollama_url', label: 'Ollama URL', desc: 'URL for the Ollama AI service' },
    { key: 'ollama_model', label: 'Ollama Model', desc: 'Model name for AI exam generation' },
    { key: 'scanner_url', label: 'Scanner Service URL', desc: 'URL for the Python OMR scanner' },
    { key: 'jwt_expire', label: 'Token Expiration', desc: 'JWT token lifetime (e.g., 7d, 30d)' },
    { key: 'max_file_size', label: 'Max File Size', desc: 'Max upload size in bytes (default: 10485760)' },
  ];

  return (
    <div className="space-y-6 max-w-2xl">
      <h2 className="text-2xl font-bold">System Settings</h2>

      {fields.map(f => (
        <div key={f.key} className="card">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="font-semibold">{f.label}</h3>
              <p className="text-sm text-gray-500">{f.desc}</p>
            </div>
            <button
              onClick={() => handleSave(f.key)}
              disabled={savingKey === f.key}
              className="btn btn-primary text-sm"
            >
              {savingKey === f.key ? 'Saving...' : 'Save'}
            </button>
          </div>
          <input
            className="input mt-2"
            value={settings[f.key] || ''}
            onChange={e => setSettings({ ...settings, [f.key]: e.target.value })}
          />
        </div>
      ))}
    </div>
  );
};

export default Settings;
