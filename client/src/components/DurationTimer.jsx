import { useState } from 'react';
import PropTypes from 'prop-types';
import useTimer from '../hooks/useTimer';
import api from '../services/api';
import './DurationTimer.css';

const DurationTimer = ({ behavior, sessionId, onUpdate }) => {
  const { isRunning, elapsedSeconds, start, stop, reset, formatTime } = useTimer();
  const [totalDuration, setTotalDuration] = useState(behavior.totalDuration || 0);
  const [sessionStartTime, setSessionStartTime] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleStart = () => {
    setSessionStartTime(new Date().toISOString());
    start();
    setError('');
  };

  const handleStop = async () => {
    if (!isRunning || isLoading) return;

    setIsLoading(true);
    setError('');

    const endTime = new Date().toISOString();
    const duration = elapsedSeconds;

    try {
      // Log the duration to the backend
      await api.post(`/behaviors/${behavior.id}/logs`, {
        type: 'duration',
        startTime: sessionStartTime,
        endTime: endTime,
        duration: duration,
        timestamp: sessionStartTime
      });

      // Update total duration
      const newTotal = totalDuration + duration;
      setTotalDuration(newTotal);

      // Stop and reset timer
      stop();
      reset();
      setSessionStartTime(null);

      // Notify parent of update
      if (onUpdate) {
        onUpdate(behavior.id, { totalDuration: newTotal });
      }
    } catch (err) {
      setError(err.message || 'Failed to log duration');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const time = formatTime();

  return (
    <div className={`duration-timer ${isRunning ? 'running' : ''}`}>
      <div className="timer-header">
        <h3 className="timer-name">{behavior.name}</h3>
        {behavior.description && (
          <p className="timer-description">{behavior.description}</p>
        )}
      </div>

      <div className="timer-display">
        <div className="timer-current">
          <div className="timer-label">Current Session</div>
          <div className={`timer-time ${isRunning ? 'active' : ''}`}>
            {time.formatted}
          </div>
        </div>

        <div className="timer-total">
          <div className="timer-label">Total Duration</div>
          <div className="timer-total-time">
            {formatDuration(totalDuration)}
          </div>
        </div>
      </div>

      <div className="timer-controls">
        {!isRunning ? (
          <button
            className="timer-button timer-button-start"
            onClick={handleStart}
            disabled={isLoading}
          >
            <span className="timer-button-icon">▶</span>
            <span className="timer-button-text">Start Timer</span>
          </button>
        ) : (
          <button
            className="timer-button timer-button-stop"
            onClick={handleStop}
            disabled={isLoading}
          >
            <span className="timer-button-icon">■</span>
            <span className="timer-button-text">
              {isLoading ? 'Saving...' : 'Stop & Save'}
            </span>
          </button>
        )}
      </div>

      {error && (
        <div className="timer-error">{error}</div>
      )}

      {isRunning && (
        <div className="timer-status">
          <div className="timer-indicator"></div>
          <span>Recording...</span>
        </div>
      )}
    </div>
  );
};

DurationTimer.propTypes = {
  behavior: PropTypes.shape({
    id: PropTypes.number.isRequired,
    name: PropTypes.string.isRequired,
    description: PropTypes.string,
    type: PropTypes.string.isRequired,
    targetValue: PropTypes.number,
    totalDuration: PropTypes.number
  }).isRequired,
  sessionId: PropTypes.number.isRequired,
  onUpdate: PropTypes.func
};

export default DurationTimer;
