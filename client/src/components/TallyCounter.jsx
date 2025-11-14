import { useState } from 'react';
import PropTypes from 'prop-types';
import api from '../services/api';
import './TallyCounter.css';

const TallyCounter = ({ behavior, sessionId, onUpdate }) => {
  const [count, setCount] = useState(behavior.totalCount || 0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleIncrement = async () => {
    if (isLoading) return;

    setIsLoading(true);
    setError('');

    // Optimistic update
    const newCount = count + 1;
    setCount(newCount);
    setIsAnimating(true);

    try {
      // Log the tally to the backend
      await api.post(`/behaviors/${behavior.id}/logs`, {
        type: 'tally',
        timestamp: new Date().toISOString()
      });

      // Trigger animation
      setTimeout(() => setIsAnimating(false), 300);

      // Notify parent of update
      if (onUpdate) {
        onUpdate(behavior.id, { totalCount: newCount });
      }
    } catch (err) {
      // Revert on error
      setCount(count);
      setError(err.message || 'Failed to log behavior');
      setIsAnimating(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="tally-counter">
      <div className="tally-header">
        <h3 className="tally-name">{behavior.name}</h3>
        {behavior.description && (
          <p className="tally-description">{behavior.description}</p>
        )}
      </div>

      <div className="tally-display">
        <div className={`tally-count ${isAnimating ? 'pulse' : ''}`}>
          {count}
        </div>
        {behavior.targetValue && (
          <div className="tally-target">
            Target: {behavior.targetValue}
          </div>
        )}
      </div>

      <button
        className="tally-button"
        onClick={handleIncrement}
        disabled={isLoading}
      >
        <span className="tally-button-icon">+</span>
        <span className="tally-button-text">Tap to Count</span>
      </button>

      {error && (
        <div className="tally-error">{error}</div>
      )}

      <div className="tally-footer">
        <small className="tally-timestamp">
          Last updated: {new Date().toLocaleTimeString()}
        </small>
      </div>
    </div>
  );
};

TallyCounter.propTypes = {
  behavior: PropTypes.shape({
    id: PropTypes.number.isRequired,
    name: PropTypes.string.isRequired,
    description: PropTypes.string,
    type: PropTypes.string.isRequired,
    targetValue: PropTypes.number,
    totalCount: PropTypes.number
  }).isRequired,
  sessionId: PropTypes.number.isRequired,
  onUpdate: PropTypes.func
};

export default TallyCounter;
