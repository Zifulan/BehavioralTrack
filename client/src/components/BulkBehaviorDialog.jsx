import { useState } from 'prop-types';
import PropTypes from 'prop-types';
import Modal from './Modal';
import api from '../services/api';

// Predefined behavior sets for common scenarios
const BEHAVIOR_SETS = {
  classroom: {
    name: 'Classroom Behaviors',
    behaviors: [
      { name: 'Hand Raising', type: 'tally', description: 'Student raises hand before speaking' },
      { name: 'On-Task Behavior', type: 'duration', description: 'Time focused on assigned task' },
      { name: 'Following Directions', type: 'tally', description: 'Compliance with instructions' },
      { name: 'Peer Interaction', type: 'duration', description: 'Appropriate interaction with peers' }
    ]
  },
  challenging: {
    name: 'Challenging Behaviors',
    behaviors: [
      { name: 'Verbal Aggression', type: 'tally', description: 'Yelling, screaming, threatening' },
      { name: 'Physical Aggression', type: 'tally', description: 'Hitting, kicking, pushing' },
      { name: 'Tantrum', type: 'duration', description: 'Duration of tantrum behavior' },
      { name: 'Property Destruction', type: 'tally', description: 'Damaging items or materials' }
    ]
  },
  communication: {
    name: 'Communication Skills',
    behaviors: [
      { name: 'Verbal Requests', type: 'tally', description: 'Using words to request items/help' },
      { name: 'Eye Contact', type: 'tally', description: 'Making appropriate eye contact' },
      { name: 'Turn-Taking', type: 'tally', description: 'Waiting for turn in conversation' },
      { name: 'Conversation Duration', type: 'duration', description: 'Length of sustained conversation' }
    ]
  },
  social: {
    name: 'Social Skills',
    behaviors: [
      { name: 'Sharing', type: 'tally', description: 'Sharing toys/materials with others' },
      { name: 'Parallel Play', type: 'duration', description: 'Playing alongside peers' },
      { name: 'Cooperative Play', type: 'duration', description: 'Playing together with peers' },
      { name: 'Greeting Others', type: 'tally', description: 'Saying hello/goodbye appropriately' }
    ]
  },
  selfCare: {
    name: 'Self-Care & Independence',
    behaviors: [
      { name: 'Task Completion', type: 'tally', description: 'Completing tasks independently' },
      { name: 'Self-Help Skills', type: 'tally', description: 'Dressing, eating, hygiene' },
      { name: 'Independent Work', type: 'duration', description: 'Working without assistance' },
      { name: 'Transitions', type: 'tally', description: 'Smooth transitions between activities' }
    ]
  }
};

const BulkBehaviorDialog = ({ isOpen, onClose, sessionId, onBehaviorsAdded }) => {
  const [selectedSet, setSelectedSet] = useState('');
  const [customBehaviors, setCustomBehaviors] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedBehaviors, setSelectedBehaviors] = useState([]);

  const handleSetSelect = (setKey) => {
    setSelectedSet(setKey);
    // Auto-select all behaviors in the set
    const behaviors = BEHAVIOR_SETS[setKey].behaviors;
    setSelectedBehaviors(behaviors.map((_, index) => index));
  };

  const toggleBehavior = (index) => {
    setSelectedBehaviors(prev => {
      if (prev.includes(index)) {
        return prev.filter(i => i !== index);
      } else {
        return [...prev, index];
      }
    });
  };

  const handleSubmit = async () => {
    if (!selectedSet || selectedBehaviors.length === 0) {
      setError('Please select at least one behavior');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const behaviors = BEHAVIOR_SETS[selectedSet].behaviors;
      const selectedBehaviorData = selectedBehaviors.map(index => behaviors[index]);

      // Create all behaviors in parallel
      const promises = selectedBehaviorData.map(behavior =>
        api.post('/behaviors', {
          sessionId,
          name: behavior.name,
          type: behavior.type,
          description: behavior.description
        })
      );

      const responses = await Promise.all(promises);
      const createdBehaviors = responses.map(r => r.data.data);

      // Notify parent
      if (onBehaviorsAdded) {
        onBehaviorsAdded(createdBehaviors);
      }

      // Reset and close
      setSelectedSet('');
      setSelectedBehaviors([]);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to add behaviors');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedSet('');
    setSelectedBehaviors([]);
    setError('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Add Multiple Behaviors" size="large">
      {error && (
        <div className="alert alert-error" style={{ marginBottom: 'var(--spacing-md)' }}>
          {error}
        </div>
      )}

      {!selectedSet ? (
        <div>
          <h3 style={{ marginBottom: 'var(--spacing-md)', fontSize: '1.125rem' }}>
            Choose a Behavior Set
          </h3>
          <p style={{ color: 'var(--gray-600)', marginBottom: 'var(--spacing-lg)', fontSize: '0.875rem' }}>
            Select a pre-configured set of behaviors for quick setup
          </p>

          <div style={{ display: 'grid', gap: 'var(--spacing-md)' }}>
            {Object.entries(BEHAVIOR_SETS).map(([key, set]) => (
              <button
                key={key}
                className="btn btn-secondary"
                style={{
                  justifyContent: 'flex-start',
                  textAlign: 'left',
                  padding: 'var(--spacing-md)'
                }}
                onClick={() => handleSetSelect(key)}
              >
                <div>
                  <strong style={{ display: 'block', marginBottom: 'var(--spacing-xs)' }}>
                    {set.name}
                  </strong>
                  <small style={{ opacity: 0.7, fontSize: '0.875rem' }}>
                    {set.behaviors.length} behaviors included
                  </small>
                </div>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => {
              setSelectedSet('');
              setSelectedBehaviors([]);
            }}
            style={{ marginBottom: 'var(--spacing-md)' }}
          >
            ← Back to Sets
          </button>

          <h3 style={{ marginBottom: 'var(--spacing-md)', fontSize: '1.125rem' }}>
            {BEHAVIOR_SETS[selectedSet].name}
          </h3>
          <p style={{ color: 'var(--gray-600)', marginBottom: 'var(--spacing-lg)', fontSize: '0.875rem' }}>
            Select the behaviors you want to add to this session
          </p>

          <div style={{ display: 'grid', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-lg)' }}>
            {BEHAVIOR_SETS[selectedSet].behaviors.map((behavior, index) => (
              <label
                key={index}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 'var(--spacing-md)',
                  padding: 'var(--spacing-md)',
                  border: `2px solid ${selectedBehaviors.includes(index) ? 'var(--primary)' : 'var(--gray-200)'}`,
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  backgroundColor: selectedBehaviors.includes(index) ? 'rgba(37, 99, 235, 0.05)' : 'white',
                  transition: 'all var(--transition-base)'
                }}
              >
                <input
                  type="checkbox"
                  checked={selectedBehaviors.includes(index)}
                  onChange={() => toggleBehavior(index)}
                  style={{ marginTop: '4px', cursor: 'pointer' }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, marginBottom: 'var(--spacing-xs)' }}>
                    {behavior.name}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)', marginBottom: 'var(--spacing-xs)' }}>
                    {behavior.description}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>
                    Type: {behavior.type === 'tally' ? 'Tally Counter' : 'Duration Timer'}
                  </div>
                </div>
              </label>
            ))}
          </div>

          <div style={{
            display: 'flex',
            gap: 'var(--spacing-sm)',
            marginTop: 'var(--spacing-lg)',
            padding: 'var(--spacing-md)',
            backgroundColor: 'var(--gray-50)',
            borderRadius: 'var(--radius-md)'
          }}>
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--primary)' }}>
                {selectedBehaviors.length}
              </div>
              <div style={{ fontSize: '0.875rem', color: 'var(--gray-600)' }}>
                behaviors selected
              </div>
            </div>
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
              type="button"
              className="btn btn-primary"
              onClick={handleSubmit}
              disabled={isLoading || selectedBehaviors.length === 0}
              style={{ flex: 1 }}
            >
              {isLoading ? 'Adding...' : `Add ${selectedBehaviors.length} Behavior${selectedBehaviors.length !== 1 ? 's' : ''}`}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
};

BulkBehaviorDialog.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  sessionId: PropTypes.number.isRequired,
  onBehaviorsAdded: PropTypes.func
};

export default BulkBehaviorDialog;
