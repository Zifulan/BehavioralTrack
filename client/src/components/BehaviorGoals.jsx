import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { ProgressChart } from './Chart';
import api from '../services/api';
import './BehaviorGoals.css';

const BehaviorGoals = ({ behavior, sessionId }) => {
  const [goal, setGoal] = useState(null);
  const [showGoalForm, setShowGoalForm] = useState(false);
  const [goalData, setGoalData] = useState({
    targetValue: '',
    targetDate: '',
    notes: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check if behavior has a target value (simple goal)
    if (behavior.targetValue) {
      setGoal({
        targetValue: behavior.targetValue,
        currentValue: behavior.totalCount || behavior.totalDuration || 0,
        type: behavior.type
      });
    }
  }, [behavior]);

  const handleSetGoal = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await api.put(`/behaviors/${behavior.id}`, {
        targetValue: parseInt(goalData.targetValue)
      });

      setGoal({
        targetValue: parseInt(goalData.targetValue),
        currentValue: behavior.totalCount || behavior.totalDuration || 0,
        type: behavior.type,
        targetDate: goalData.targetDate,
        notes: goalData.notes
      });

      setShowGoalForm(false);
      setGoalData({ targetValue: '', targetDate: '', notes: '' });
    } catch (err) {
      console.error('Failed to set goal:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateProgress = () => {
    if (!goal) return 0;
    const progress = (goal.currentValue / goal.targetValue) * 100;
    return Math.min(progress, 100);
  };

  const isGoalAchieved = () => {
    if (!goal) return false;
    return goal.currentValue >= goal.targetValue;
  };

  const getProgressColor = () => {
    const progress = calculateProgress();
    if (progress >= 100) return 'var(--success)';
    if (progress >= 75) return 'var(--primary)';
    if (progress >= 50) return 'var(--warning)';
    return 'var(--danger)';
  };

  if (!goal && !showGoalForm) {
    return (
      <div className="behavior-goals-empty">
        <button
          className="btn btn-sm btn-secondary"
          onClick={() => setShowGoalForm(true)}
        >
          Set Goal
        </button>
      </div>
    );
  }

  if (showGoalForm) {
    return (
      <div className="behavior-goals-form">
        <h4 style={{ marginBottom: 'var(--spacing-md)', fontSize: '1rem' }}>
          Set Goal for {behavior.name}
        </h4>
        <form onSubmit={handleSetGoal}>
          <div className="form-group">
            <label className="form-label">
              Target {behavior.type === 'tally' ? 'Count' : 'Duration (seconds)'}
            </label>
            <input
              type="number"
              className="form-input"
              value={goalData.targetValue}
              onChange={(e) => setGoalData({ ...goalData, targetValue: e.target.value })}
              required
              min="1"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Target Date (Optional)</label>
            <input
              type="date"
              className="form-input"
              value={goalData.targetDate}
              onChange={(e) => setGoalData({ ...goalData, targetDate: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Notes (Optional)</label>
            <textarea
              className="form-textarea"
              value={goalData.notes}
              onChange={(e) => setGoalData({ ...goalData, notes: e.target.value })}
              rows="2"
              placeholder="Goal description or criteria..."
            />
          </div>
          <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
            <button
              type="button"
              className="btn btn-sm btn-secondary"
              onClick={() => setShowGoalForm(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-sm btn-primary"
              disabled={isLoading}
            >
              {isLoading ? 'Setting...' : 'Set Goal'}
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className={`behavior-goals ${isGoalAchieved() ? 'achieved' : ''}`}>
      {isGoalAchieved() && (
        <div className="achievement-badge">
          <span className="badge-icon">🎉</span>
          <span className="badge-text">Goal Achieved!</span>
        </div>
      )}

      <div className="goal-progress">
        <ProgressChart
          value={goal.currentValue}
          max={goal.targetValue}
          label={`Goal: ${goal.targetValue} ${behavior.type === 'tally' ? 'counts' : 'seconds'}`}
          color={getProgressColor()}
        />
      </div>

      <div className="goal-details">
        <div className="goal-stat">
          <span className="goal-stat-label">Current:</span>
          <span className="goal-stat-value">{goal.currentValue}</span>
        </div>
        <div className="goal-stat">
          <span className="goal-stat-label">Target:</span>
          <span className="goal-stat-value">{goal.targetValue}</span>
        </div>
        <div className="goal-stat">
          <span className="goal-stat-label">Remaining:</span>
          <span className="goal-stat-value">
            {Math.max(0, goal.targetValue - goal.currentValue)}
          </span>
        </div>
      </div>

      {goal.targetDate && (
        <div className="goal-deadline">
          <span className="deadline-icon">📅</span>
          <span>Target Date: {new Date(goal.targetDate).toLocaleDateString()}</span>
        </div>
      )}

      {goal.notes && (
        <div className="goal-notes">
          <small>{goal.notes}</small>
        </div>
      )}

      <button
        className="btn btn-sm btn-secondary"
        onClick={() => setShowGoalForm(true)}
        style={{ marginTop: 'var(--spacing-sm)' }}
      >
        Update Goal
      </button>
    </div>
  );
};

BehaviorGoals.propTypes = {
  behavior: PropTypes.shape({
    id: PropTypes.number.isRequired,
    name: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
    targetValue: PropTypes.number,
    totalCount: PropTypes.number,
    totalDuration: PropTypes.number
  }).isRequired,
  sessionId: PropTypes.number.isRequired
};

export default BehaviorGoals;
