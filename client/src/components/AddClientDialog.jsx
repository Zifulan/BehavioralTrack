import { useState } from 'react';
import PropTypes from 'prop-types';
import Modal from './Modal';
import api from '../services/api';

const AddClientDialog = ({ isOpen, onClose, onClientAdded }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
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
      const response = await api.post('/clients', {
        firstName: formData.firstName,
        lastName: formData.lastName,
        dateOfBirth: formData.dateOfBirth || null,
        notes: formData.notes || null
      });

      // Notify parent and close dialog
      if (onClientAdded) {
        onClientAdded(response.data.data);
      }

      // Reset form
      setFormData({
        firstName: '',
        lastName: '',
        dateOfBirth: '',
        notes: ''
      });

      onClose();
    } catch (err) {
      setError(err.message || 'Failed to add client');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      firstName: '',
      lastName: '',
      dateOfBirth: '',
      notes: ''
    });
    setError('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add New Client">
      {error && (
        <div className="alert alert-error" style={{ marginBottom: 'var(--spacing-md)' }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-2" style={{ gap: 'var(--spacing-md)' }}>
          <div className="form-group">
            <label className="form-label" htmlFor="firstName">First Name *</label>
            <input
              id="firstName"
              name="firstName"
              type="text"
              className="form-input"
              value={formData.firstName}
              onChange={handleChange}
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="lastName">Last Name *</label>
            <input
              id="lastName"
              name="lastName"
              type="text"
              className="form-input"
              value={formData.lastName}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="dateOfBirth">Date of Birth (Optional)</label>
          <input
            id="dateOfBirth"
            name="dateOfBirth"
            type="date"
            className="form-input"
            value={formData.dateOfBirth}
            onChange={handleChange}
          />
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="notes">Notes (Optional)</label>
          <textarea
            id="notes"
            name="notes"
            className="form-textarea"
            value={formData.notes}
            onChange={handleChange}
            placeholder="Initial assessment notes, goals, etc."
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
            className="btn btn-primary"
            disabled={isLoading}
            style={{ flex: 1 }}
          >
            {isLoading ? 'Adding...' : 'Add Client'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

AddClientDialog.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onClientAdded: PropTypes.func
};

export default AddClientDialog;
