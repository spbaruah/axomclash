import React, { useState } from 'react';
import './SystemSettings.css';

const SystemSettings = () => {
  const [settings, setSettings] = useState({
    maintenanceMode: false,
    registrationEnabled: true,
    maxFileSize: 10,
    pointsMultiplier: 1.0,
    autoModeration: true
  });

  const handleSettingChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const saveSettings = () => {
    // Save settings to backend
    console.log('Saving settings:', settings);
    alert('Settings saved successfully!');
  };

  return (
    <div className="system-settings">
      <div className="management-header">
        <h2>System Settings</h2>
        <p>Configure system-wide settings and preferences</p>
      </div>

      <div className="settings-container">
        <div className="settings-section">
          <h3>General Settings</h3>
          
          <div className="setting-item">
            <label>
              <input
                type="checkbox"
                checked={settings.maintenanceMode}
                onChange={(e) => handleSettingChange('maintenanceMode', e.target.checked)}
              />
              Maintenance Mode
            </label>
            <p className="setting-description">Enable maintenance mode to restrict access</p>
          </div>

          <div className="setting-item">
            <label>
              <input
                type="checkbox"
                checked={settings.registrationEnabled}
                onChange={(e) => handleSettingChange('registrationEnabled', e.target.checked)}
              />
              User Registration
            </label>
            <p className="setting-description">Allow new users to register</p>
          </div>

          <div className="setting-item">
            <label>
              <input
                type="checkbox"
                checked={settings.autoModeration}
                onChange={(e) => handleSettingChange('autoModeration', e.target.checked)}
              />
              Auto Moderation
            </label>
            <p className="setting-description">Automatically moderate content</p>
          </div>
        </div>

        <div className="settings-section">
          <h3>System Limits</h3>
          
          <div className="setting-item">
            <label>Max File Size (MB)</label>
            <input
              type="number"
              value={settings.maxFileSize}
              onChange={(e) => handleSettingChange('maxFileSize', parseInt(e.target.value))}
              min="1"
              max="100"
            />
            <p className="setting-description">Maximum file size for uploads</p>
          </div>

          <div className="setting-item">
            <label>Points Multiplier</label>
            <input
              type="number"
              step="0.1"
              value={settings.pointsMultiplier}
              onChange={(e) => handleSettingChange('pointsMultiplier', parseFloat(e.target.value))}
              min="0.1"
              max="5.0"
            />
            <p className="setting-description">Multiplier for points earned</p>
          </div>
        </div>

        <div className="settings-section">
          <h3>Danger Zone</h3>
          
          <div className="danger-actions">
            <button className="danger-btn">
              🗑️ Clear All Data
            </button>
            <button className="danger-btn">
              🔄 Reset System
            </button>
            <button className="danger-btn">
              📊 Export Data
            </button>
          </div>
        </div>

        <div className="settings-actions">
          <button className="save-btn" onClick={saveSettings}>
            💾 Save Settings
          </button>
          <button className="reset-btn">
            🔄 Reset to Default
          </button>
        </div>
      </div>
    </div>
  );
};

export default SystemSettings;
