import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import TallyCounter from '../components/TallyCounter';
import DurationTimer from '../components/DurationTimer';
import AddBehaviorDialog from '../components/AddBehaviorDialog';
import BulkBehaviorDialog from '../components/BulkBehaviorDialog';
import './SessionView.css';

const SessionView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [behaviors, setBehaviors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddBehavior, setShowAddBehavior] = useState(false);
  const [showBulkBehavior, setShowBulkBehavior] = useState(false);
  const [isEndingSession, setIsEndingSession] = useState(false);

  useEffect(() => {
    fetchSession();
  }, [id]);

  const fetchSession = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/sessions/${id}`);
      setSession(response.data.data);
      setBehaviors(response.data.data.behaviors || []);
    } catch (err) {
      setError(err.message || 'Failed to load session');
    } finally {
      setLoading(false);
    }
  };

  const handleBehaviorUpdate = (behaviorId, updates) => {
    setBehaviors(prev =>
      prev.map(b => b.id === behaviorId ? { ...b, ...updates } : b)
    );
  };

  const handleBehaviorAdded = (newBehavior) => {
    setBehaviors(prev => [...prev, { ...newBehavior, totalCount: 0, totalDuration: 0 }]);
  };

  const handleBehaviorsAdded = (newBehaviors) => {
    const behaviorsWithDefaults = newBehaviors.map(b => ({ ...b, totalCount: 0, totalDuration: 0 }));
    setBehaviors(prev => [...prev, ...behaviorsWithDefaults]);
  };

  const handleEndSession = async () => {
    if (!window.confirm('Are you sure you want to end this session?')) {
      return;
    }

    setIsEndingSession(true);
    try {
      await api.post(`/sessions/${id}/end`);
      navigate(`/clients/${session.clientId}`);
    } catch (err) {
      alert(err.message || 'Failed to end session');
      setIsEndingSession(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      const response = await fetch(`/api/export/csv/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `session_${id}_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      alert(err.message || 'Failed to export session');
    }
  };

  if (loading) {
    return (
      <div className="page">
        <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--spacing-2xl)' }}>
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page">
        <div className="container">
          <div className="alert alert-error">{error}</div>
          <Link to="/" className="btn btn-secondary">Back to Dashboard</Link>
        </div>
      </div>
    );
  }

  const tallyBehaviors = behaviors.filter(b => b.type === 'tally');
  const durationBehaviors = behaviors.filter(b => b.type === 'duration');
  const isSessionActive = !session.endTime;

  return (
    <div className="page session-view-page">
      <div className="container">
        {/* Header */}
        <div className="session-header">
          <div className="session-header-content">
            <div>
              <h1 className="page-title">{session.clientName}</h1>
              <p className="page-subtitle">
                Session on {new Date(session.sessionDate).toLocaleDateString()} at{' '}
                {new Date(session.startTime).toLocaleTimeString()}
              </p>
              {session.location && (
                <p style={{ color: 'var(--gray-600)', fontSize: '0.875rem' }}>
                  Location: {session.location}
                </p>
              )}
            </div>

            <div className="session-header-actions">
              {isSessionActive ? (
                <div className="session-status session-status-active">
                  <div className="status-indicator"></div>
                  <span>Session Active</span>
                </div>
              ) : (
                <div className="session-status session-status-ended">
                  <span>Session Ended</span>
                </div>
              )}
            </div>
          </div>

          <div className="session-controls">
            <button
              className="btn btn-secondary"
              onClick={() => navigate(`/clients/${session.clientId}`)}
            >
              Back to Client
            </button>

            {isSessionActive && (
              <>
                <button
                  className="btn btn-primary"
                  onClick={() => setShowAddBehavior(true)}
                >
                  + Add Behavior
                </button>
                <button
                  className="btn btn-success"
                  onClick={() => setShowBulkBehavior(true)}
                >
                  + Add Multiple
                </button>
              </>
            )}

            <button
              className="btn btn-secondary"
              onClick={handleExportCSV}
            >
              Export CSV
            </button>

            {isSessionActive && (
              <button
                className="btn btn-danger"
                onClick={handleEndSession}
                disabled={isEndingSession}
              >
                {isEndingSession ? 'Ending...' : 'End Session'}
              </button>
            )}
          </div>
        </div>

        {/* Behaviors */}
        {behaviors.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 'var(--spacing-2xl)' }}>
            <h3 style={{ marginBottom: 'var(--spacing-md)' }}>No behaviors being tracked</h3>
            <p style={{ color: 'var(--gray-600)', marginBottom: 'var(--spacing-lg)' }}>
              Add behaviors to start tracking during this session
            </p>
            {isSessionActive && (
              <button
                className="btn btn-primary"
                onClick={() => setShowAddBehavior(true)}
              >
                Add Your First Behavior
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Tally Counters */}
            {tallyBehaviors.length > 0 && (
              <div className="behavior-section">
                <h2 className="section-title">Tally Counters</h2>
                <div className="behaviors-grid">
                  {tallyBehaviors.map(behavior => (
                    <TallyCounter
                      key={behavior.id}
                      behavior={behavior}
                      sessionId={session.id}
                      onUpdate={handleBehaviorUpdate}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Duration Timers */}
            {durationBehaviors.length > 0 && (
              <div className="behavior-section">
                <h2 className="section-title">Duration Timers</h2>
                <div className="behaviors-grid">
                  {durationBehaviors.map(behavior => (
                    <DurationTimer
                      key={behavior.id}
                      behavior={behavior}
                      sessionId={session.id}
                      onUpdate={handleBehaviorUpdate}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Session Notes */}
        {session.notes && (
          <div className="card" style={{ marginTop: 'var(--spacing-xl)' }}>
            <h3 style={{ marginBottom: 'var(--spacing-md)' }}>Session Notes</h3>
            <p style={{ whiteSpace: 'pre-wrap', color: 'var(--gray-700)' }}>
              {session.notes}
            </p>
          </div>
        )}
      </div>

      {/* Add Behavior Dialog */}
      <AddBehaviorDialog
        isOpen={showAddBehavior}
        onClose={() => setShowAddBehavior(false)}
        sessionId={session.id}
        onBehaviorAdded={handleBehaviorAdded}
      />

      {/* Bulk Behavior Dialog */}
      <BulkBehaviorDialog
        isOpen={showBulkBehavior}
        onClose={() => setShowBulkBehavior(false)}
        sessionId={session.id}
        onBehaviorsAdded={handleBehaviorsAdded}
      />
    </div>
  );
};

export default SessionView;
