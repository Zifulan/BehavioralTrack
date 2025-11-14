import { useState } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import Modal from './Modal';
import api from '../services/api';

const StartSessionDialog = ({ isOpen, onClose, client }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    sessionDate: new Date().toISOString().split('T')[0],
    startTime: new Date().toISOString().slice(0, 16),
    location: '',
    notes: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await api.post('/sessions', {
        clientId: client.id,
        sessionDate: formData.sessionDate,
        startTime: new Date(formData.startTime).toISOString(),
        location: formData.location || null,
        notes: formData.notes || null
      });

      const newSession = response.data.data;

      // Reset form
      setFormData({
        sessionDate: new Date().toISOString().split('T')[0],
        startTime: new Date().toISOString().slice(0, 16),
        location: '',
        notes: ''
      });

      // Navigate to session view
      navigate(`/sessions/${newSession.id}`);
    } catch (err) {
      setError(err.message || 'Failed to start session');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      sessionDate: new Date().toISOString().split('T')[0],
      startTime: new Date().toISOString().slice(0, 16),
      location: '',
      notes: ''
    });
    setError('');
    onClose();
  };

  if (!client) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Start New Session">
      {error && (
        <div className="alert alert-error" style={{ marginBottom: 'var(--spacing-md)' }}>
          {error}
        </div>
      )}

      <div style={{ marginBottom: 'var(--spacing-lg)', padding: 'var(--spacing-md)', background: 'var(--gray-50)', borderRadius: 'var(--radius-md)' }}>
        <strong>Client:</strong> {client.firstName} {client.lastName}
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-2" style={{ gap: 'var(--spacing-md)' }}>
          <div className="form-group">
            <label className="form-label" htmlFor="sessionDate">Session Date *</label>
            <input
              id="sessionDate"
              name="sessionDate"
              type="date"
              className="form-input"
              value={formData.sessionDate}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="startTime">Start Time *</label>
            <input
              id="startTime"
              name="startTime"
              type="datetime-local"
              className="form-input"
              value={formData.startTime}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="location">Location (Optional)</label>
          <input
            id="location"
            name="location"
            type="text"
            className="form-input"
            value={formData.location}
            onChange={handleChange}
            placeholder="e.g., Clinic, Home, School"
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="notes">Session Notes (Optional)</label>
          <textarea
            id="notes"
            name="notes"
            className="form-textarea"
            value={formData.notes}
            onChange={handleChange}
            placeholder="Session goals, observations, etc."
            rows="4"
          />
        </div>

        <div style={{ display: 'flex', gap: 'var(--spacing-sm)', marginTop: 'var(--spacing-lg)' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleClose}
            style={{ flex: 1 }}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-success"
            disabled={isLoading}
            style={{ flex: 1 }}
          >
            {isLoading ? 'Starting...' : 'Start Session'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

StartSessionDialog.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  client: PropTypes.shape({
    id: PropTypes.number.isRequired,
    firstName: PropTypes.string.isRequired,
    lastName: PropTypes.string.isRequired
  })
};

export default StartSessionDialog;
