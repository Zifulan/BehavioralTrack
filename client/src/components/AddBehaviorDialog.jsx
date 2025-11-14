import { useState } from 'react';
import PropTypes from 'prop-types';
import Modal from './Modal';
import api from '../services/api';

const BEHAVIOR_TEMPLATES = [
  { name: 'Hand Raising', type: 'tally', description: 'Student raises hand before speaking', category: 'Communication' },
  { name: 'On-Task Behavior', type: 'duration', description: 'Time student is focused on assigned task', category: 'Academic' },
  { name: 'Verbal Aggression', type: 'tally', description: 'Yelling, screaming, or threatening language', category: 'Challenging' },
  { name: 'Physical Aggression', type: 'tally', description: 'Hitting, kicking, pushing others', category: 'Challenging' },
  { name: 'Self-Injurious Behavior', type: 'tally', description: 'Head banging, scratching, biting self', category: 'Challenging' },
  { name: 'Peer Interaction', type: 'duration', description: 'Appropriate interaction with peers', category: 'Social' },
  { name: 'Task Completion', type: 'tally', description: 'Successfully completes assigned tasks', category: 'Academic' },
  { name: 'Tantrum', type: 'duration', description: 'Duration of tantrum behavior', category: 'Challenging' },
];

const AddBehaviorDialog = ({ isOpen, onClose, sessionId, onBehaviorAdded }) => {
  const [formData, setFormData] = useState({
    name: '',
    type: 'tally',
    description: '',
    targetValue: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showTemplates, setShowTemplates] = useState(true);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleTemplateSelect = (template) => {
    setFormData({
      name: template.name,
      type: template.type,
      description: template.description,
      targetValue: ''
    });
    setShowTemplates(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await api.post('/behaviors', {
        sessionId,
        name: formData.name,
        type: formData.type,
        description: formData.description || null,
        targetValue: formData.targetValue ? parseInt(formData.targetValue) : null
      });

      // Notify parent and close dialog
      if (onBehaviorAdded) {
        onBehaviorAdded(response.data.data);
      }

      // Reset form
      setFormData({
        name: '',
        type: 'tally',
        description: '',
        targetValue: ''
      });
      setShowTemplates(true);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to add behavior');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      type: 'tally',
      description: '',
      targetValue: ''
    });
    setShowTemplates(true);
    setError('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add Behavior to Track">
      {error && (
        <div className="alert alert-error" style={{ marginBottom: 'var(--spacing-md)' }}>
          {error}
        </div>
      )}

      {showTemplates && formData.name === '' ? (
        <div>
          <h3 style={{ marginBottom: 'var(--spacing-md)', fontSize: '1.125rem' }}>
            Quick Templates
          </h3>
          <div style={{ display: 'grid', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-lg)' }}>
            {BEHAVIOR_TEMPLATES.map((template, index) => (
              <button
                key={index}
                className="btn btn-secondary"
                style={{ justifyContent: 'flex-start', textAlign: 'left' }}
                onClick={() => handleTemplateSelect(template)}
              >
                <strong>{template.name}</strong>
                <small style={{ display: 'block', opacity: 0.7, fontSize: '0.875rem' }}>
                  {template.type === 'tally' ? 'Tally Counter' : 'Duration Timer'} • {template.description}
                </small>
              </button>
            ))}
          </div>

          <div style={{ textAlign: 'center', margin: 'var(--spacing-md) 0' }}>
            <span style={{ color: 'var(--gray-500)' }}>— or —</span>
          </div>

          <button
            className="btn btn-primary"
            style={{ width: '100%' }}
            onClick={() => setShowTemplates(false)}
          >
            Create Custom Behavior
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          {showTemplates && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => {
                setFormData({ name: '', type: 'tally', description: '', targetValue: '' });
                setShowTemplates(true);
              }}
              style={{ marginBottom: 'var(--spacing-md)' }}
            >
              ← Back to Templates
            </button>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="name">Behavior Name *</label>
            <input
              id="name"
              name="name"
              type="text"
              className="form-input"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="e.g., Hand Raising"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="type">Tracking Type *</label>
            <select
              id="type"
              name="type"
              className="form-select"
              value={formData.type}
              onChange={handleChange}
              required
            >
              <option value="tally">Tally Counter (count occurrences)</option>
              <option value="duration">Duration Timer (track time)</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="description">Description (Optional)</label>
            <textarea
              id="description"
              name="description"
              className="form-textarea"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe the behavior..."
              rows="3"
            />
          </div>

          {formData.type === 'tally' && (
            <div className="form-group">
              <label className="form-label" htmlFor="targetValue">Target Count (Optional)</label>
              <input
                id="targetValue"
                name="targetValue"
                type="number"
                className="form-input"
                value={formData.targetValue}
                onChange={handleChange}
                placeholder="e.g., 10"
                min="0"
              />
            </div>
          )}

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
              {isLoading ? 'Adding...' : 'Add Behavior'}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
};

AddBehaviorDialog.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  sessionId: PropTypes.number.isRequired,
  onBehaviorAdded: PropTypes.func
};

export default AddBehaviorDialog;
