import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { getStorageInfo, clearAllStorage } from '../utils/offlineStorage';
import './Settings.css';

const Settings = () => {
  const { user, updateProfile, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [profileData, setProfileData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    credentials: user?.credentials || ''
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    sessionReminders: true,
    exportFormat: 'csv',
    theme: 'light'
  });
  const [storageInfo, setStorageInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadStorageInfo();
    loadPreferences();
  }, []);

  const loadStorageInfo = () => {
    const info = getStorageInfo();
    setStorageInfo(info);
  };

  const loadPreferences = () => {
    const saved = localStorage.getItem('userPreferences');
    if (saved) {
      setPreferences(JSON.parse(saved));
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      await updateProfile(profileData);
      setSuccess('Profile updated successfully!');
    } catch (err) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);

    try {
      await api.put('/auth/password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      setSuccess('Password changed successfully!');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setError(err.message || 'Failed to change password');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePreferencesUpdate = (e) => {
    e.preventDefault();
    localStorage.setItem('userPreferences', JSON.stringify(preferences));
    setSuccess('Preferences saved successfully!');
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleClearCache = () => {
    if (window.confirm('This will clear all offline data. Are you sure?')) {
      clearAllStorage();
      loadStorageInfo();
      setSuccess('Cache cleared successfully!');
      setTimeout(() => setSuccess(''), 3000);
    }
  };

  const handleExportData = async () => {
    try {
      const response = await api.get('/export/all-data');
      const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `behavioral-track-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      setSuccess('Data exported successfully!');
    } catch (err) {
      setError('Failed to export data');
    }
  };

  return (
    <div className="page settings-page">
      <div className="container">
        {/* Header */}
        <div className="page-header">
          <div>
            <h1 className="page-title">Settings</h1>
            <p className="page-subtitle">Manage your account and preferences</p>
          </div>
          <Link to="/" className="btn btn-secondary">
            Back to Dashboard
          </Link>
        </div>

        {/* Alerts */}
        {error && (
          <div className="alert alert-error" style={{ marginBottom: 'var(--spacing-md)' }}>
            {error}
          </div>
        )}
        {success && (
          <div className="alert alert-success" style={{ marginBottom: 'var(--spacing-md)' }}>
            {success}
          </div>
        )}

        {/* Tabs */}
        <div className="settings-tabs">
          <button
            className={`tab ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            Profile
          </button>
          <button
            className={`tab ${activeTab === 'password' ? 'active' : ''}`}
            onClick={() => setActiveTab('password')}
          >
            Password
          </button>
          <button
            className={`tab ${activeTab === 'preferences' ? 'active' : ''}`}
            onClick={() => setActiveTab('preferences')}
          >
            Preferences
          </button>
          <button
            className={`tab ${activeTab === 'data' ? 'active' : ''}`}
            onClick={() => setActiveTab('data')}
          >
            Data & Storage
          </button>
        </div>

        {/* Tab Content */}
        <div className="settings-content">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="card">
              <h2 style={{ marginBottom: 'var(--spacing-lg)' }}>Profile Information</h2>
              <form onSubmit={handleProfileUpdate}>
                <div className="grid grid-cols-2" style={{ gap: 'var(--spacing-md)' }}>
                  <div className="form-group">
                    <label className="form-label">First Name</label>
                    <input
                      type="text"
                      className="form-input"
                      value={profileData.firstName}
                      onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Last Name</label>
                    <input
                      type="text"
                      className="form-input"
                      value={profileData.lastName}
                      onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input
                    type="email"
                    className="form-input"
                    value={user?.email || ''}
                    disabled
                    style={{ backgroundColor: 'var(--gray-100)', cursor: 'not-allowed' }}
                  />
                  <small style={{ color: 'var(--gray-500)', marginTop: 'var(--spacing-xs)', display: 'block' }}>
                    Email cannot be changed
                  </small>
                </div>
                <div className="form-group">
                  <label className="form-label">Credentials</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g., BCBA, LBA, MS"
                    value={profileData.credentials}
                    onChange={(e) => setProfileData({ ...profileData, credentials: e.target.value })}
                  />
                </div>
                <button type="submit" className="btn btn-primary" disabled={isLoading}>
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </form>
            </div>
          )}

          {/* Password Tab */}
          {activeTab === 'password' && (
            <div className="card">
              <h2 style={{ marginBottom: 'var(--spacing-lg)' }}>Change Password</h2>
              <form onSubmit={handlePasswordChange}>
                <div className="form-group">
                  <label className="form-label">Current Password</label>
                  <input
                    type="password"
                    className="form-input"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">New Password</label>
                  <input
                    type="password"
                    className="form-input"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Confirm New Password</label>
                  <input
                    type="password"
                    className="form-input"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    required
                  />
                </div>
                <button type="submit" className="btn btn-primary" disabled={isLoading}>
                  {isLoading ? 'Changing...' : 'Change Password'}
                </button>
              </form>
            </div>
          )}

          {/* Preferences Tab */}
          {activeTab === 'preferences' && (
            <div className="card">
              <h2 style={{ marginBottom: 'var(--spacing-lg)' }}>Preferences</h2>
              <form onSubmit={handlePreferencesUpdate}>
                <div className="preference-section">
                  <h3 style={{ marginBottom: 'var(--spacing-md)', fontSize: '1.125rem' }}>Notifications</h3>
                  <div className="preference-item">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={preferences.emailNotifications}
                        onChange={(e) => setPreferences({ ...preferences, emailNotifications: e.target.checked })}
                      />
                      <span>Email notifications for completed sessions</span>
                    </label>
                  </div>
                  <div className="preference-item">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={preferences.sessionReminders}
                        onChange={(e) => setPreferences({ ...preferences, sessionReminders: e.target.checked })}
                      />
                      <span>Daily session reminders</span>
                    </label>
                  </div>
                </div>

                <div className="preference-section">
                  <h3 style={{ marginBottom: 'var(--spacing-md)', fontSize: '1.125rem' }}>Export Defaults</h3>
                  <div className="form-group">
                    <label className="form-label">Preferred Export Format</label>
                    <select
                      className="form-select"
                      value={preferences.exportFormat}
                      onChange={(e) => setPreferences({ ...preferences, exportFormat: e.target.value })}
                    >
                      <option value="csv">CSV (Spreadsheet)</option>
                      <option value="pdf">PDF (Report)</option>
                    </select>
                  </div>
                </div>

                <div className="preference-section">
                  <h3 style={{ marginBottom: 'var(--spacing-md)', fontSize: '1.125rem' }}>Appearance</h3>
                  <div className="form-group">
                    <label className="form-label">Theme</label>
                    <select
                      className="form-select"
                      value={preferences.theme}
                      onChange={(e) => setPreferences({ ...preferences, theme: e.target.value })}
                    >
                      <option value="light">Light</option>
                      <option value="dark">Dark (Coming Soon)</option>
                      <option value="auto">Auto (Coming Soon)</option>
                    </select>
                  </div>
                </div>

                <button type="submit" className="btn btn-primary">
                  Save Preferences
                </button>
              </form>
            </div>
          )}

          {/* Data & Storage Tab */}
          {activeTab === 'data' && (
            <div className="card">
              <h2 style={{ marginBottom: 'var(--spacing-lg)' }}>Data & Storage</h2>

              {storageInfo && (
                <div className="storage-info">
                  <h3 style={{ marginBottom: 'var(--spacing-md)', fontSize: '1.125rem' }}>Offline Storage</h3>
                  <div className="storage-stats">
                    <div className="storage-stat">
                      <div className="stat-label">Items Cached</div>
                      <div className="stat-value">{storageInfo.itemCount}</div>
                    </div>
                    <div className="storage-stat">
                      <div className="stat-label">Storage Used</div>
                      <div className="stat-value">{storageInfo.totalSizeKB} KB</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleClearCache}
                    style={{ marginTop: 'var(--spacing-md)' }}
                  >
                    Clear Offline Cache
                  </button>
                </div>
              )}

              <div style={{ marginTop: 'var(--spacing-xl)', paddingTop: 'var(--spacing-xl)', borderTop: '1px solid var(--gray-200)' }}>
                <h3 style={{ marginBottom: 'var(--spacing-md)', fontSize: '1.125rem' }}>Export All Data</h3>
                <p style={{ color: 'var(--gray-600)', marginBottom: 'var(--spacing-md)' }}>
                  Download all your data in JSON format for backup or migration.
                </p>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleExportData}
                >
                  Export All Data
                </button>
              </div>

              <div style={{ marginTop: 'var(--spacing-xl)', paddingTop: 'var(--spacing-xl)', borderTop: '1px solid var(--gray-200)' }}>
                <h3 style={{ marginBottom: 'var(--spacing-md)', fontSize: '1.125rem', color: 'var(--danger)' }}>
                  Danger Zone
                </h3>
                <p style={{ color: 'var(--gray-600)', marginBottom: 'var(--spacing-md)' }}>
                  Permanently delete your account and all associated data.
                </p>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => {
                    if (window.confirm('Are you absolutely sure? This action cannot be undone.')) {
                      alert('Account deletion feature coming soon. Please contact support.');
                    }
                  }}
                >
                  Delete Account
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
