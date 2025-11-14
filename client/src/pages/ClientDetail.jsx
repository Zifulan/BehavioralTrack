import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import StartSessionDialog from '../components/StartSessionDialog';

const ClientDetail = () => {
  const { id } = useParams();
  const [client, setClient] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showStartSession, setShowStartSession] = useState(false);

  useEffect(() => {
    fetchClientData();
  }, [id]);

  const fetchClientData = async () => {
    try {
      setLoading(true);

      // Fetch client details
      const clientResponse = await api.get(`/clients/${id}`);
      setClient(clientResponse.data.data);

      // Fetch client's sessions
      const sessionsResponse = await api.get(`/sessions?clientId=${id}`);
      setSessions(sessionsResponse.data.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load client details');
    } finally {
      setLoading(false);
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

  if (error || !client) {
    return (
      <div className="page">
        <div className="container">
          <div className="alert alert-error">{error || 'Client not found'}</div>
          <Link to="/clients" className="btn btn-secondary">Back to Clients</Link>
        </div>
      </div>
    );
  }

  const activeSessions = sessions.filter(s => !s.endTime);
  const completedSessions = sessions.filter(s => s.endTime);

  return (
    <div className="page">
      <div className="container">
        {/* Header */}
        <div className="page-header">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h1 className="page-title">
                {client.firstName} {client.lastName}
              </h1>
              {client.dateOfBirth && (
                <p className="page-subtitle">
                  DOB: {new Date(client.dateOfBirth).toLocaleDateString()}
                </p>
              )}
            </div>
            <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
              <Link to="/clients" className="btn btn-secondary">
                Back to Clients
              </Link>
              <button
                className="btn btn-success"
                onClick={() => setShowStartSession(true)}
              >
                Start New Session
              </button>
            </div>
          </div>
        </div>

        {/* Client Notes */}
        {client.notes && (
          <div className="card" style={{ marginBottom: 'var(--spacing-xl)' }}>
            <h3 style={{ marginBottom: 'var(--spacing-md)' }}>Client Notes</h3>
            <p style={{ whiteSpace: 'pre-wrap', color: 'var(--gray-700)' }}>
              {client.notes}
            </p>
          </div>
        )}

        {/* Active Sessions */}
        {activeSessions.length > 0 && (
          <div style={{ marginBottom: 'var(--spacing-2xl)' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: 'var(--spacing-lg)', color: 'var(--success)' }}>
              Active Sessions ({activeSessions.length})
            </h2>
            <div className="grid">
              {activeSessions.map(session => (
                <Link
                  key={session.id}
                  to={`/sessions/${session.id}`}
                  className="card"
                  style={{ textDecoration: 'none', color: 'inherit', borderColor: 'var(--success)' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-sm)' }}>
                    <div style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: 'var(--success)',
                      animation: 'pulse-dot 1.5s ease-in-out infinite'
                    }}></div>
                    <strong style={{ color: 'var(--success)' }}>Session in Progress</strong>
                  </div>
                  <p style={{ color: 'var(--gray-600)', fontSize: '0.875rem' }}>
                    Started: {new Date(session.startTime).toLocaleString()}
                  </p>
                  {session.location && (
                    <p style={{ color: 'var(--gray-600)', fontSize: '0.875rem' }}>
                      Location: {session.location}
                    </p>
                  )}
                  <p style={{ marginTop: 'var(--spacing-sm)', fontSize: '0.875rem', color: 'var(--primary)' }}>
                    Tracking {session.behaviorCount} behavior{session.behaviorCount !== 1 ? 's' : ''}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Completed Sessions */}
        <div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: 'var(--spacing-lg)' }}>
            Session History ({completedSessions.length})
          </h2>

          {completedSessions.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: 'var(--spacing-2xl)' }}>
              <p style={{ color: 'var(--gray-600)' }}>
                No completed sessions yet. Start a session to begin tracking behaviors.
              </p>
            </div>
          ) : (
            <div className="grid">
              {completedSessions.map(session => {
                const duration = session.endTime
                  ? Math.round((new Date(session.endTime) - new Date(session.startTime)) / 60000)
                  : 0;

                return (
                  <Link
                    key={session.id}
                    to={`/sessions/${session.id}`}
                    className="card"
                    style={{ textDecoration: 'none', color: 'inherit' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'var(--spacing-sm)' }}>
                      <strong style={{ fontSize: '1.125rem' }}>
                        {new Date(session.sessionDate).toLocaleDateString()}
                      </strong>
                      <span style={{
                        fontSize: '0.75rem',
                        padding: '0.25rem 0.5rem',
                        backgroundColor: 'var(--gray-100)',
                        borderRadius: 'var(--radius-sm)',
                        color: 'var(--gray-600)'
                      }}>
                        {duration} min
                      </span>
                    </div>
                    <p style={{ color: 'var(--gray-600)', fontSize: '0.875rem', marginBottom: 'var(--spacing-xs)' }}>
                      {new Date(session.startTime).toLocaleTimeString()} - {new Date(session.endTime).toLocaleTimeString()}
                    </p>
                    {session.location && (
                      <p style={{ color: 'var(--gray-600)', fontSize: '0.875rem' }}>
                        Location: {session.location}
                      </p>
                    )}
                    {session.behaviorCount > 0 && (
                      <p style={{ marginTop: 'var(--spacing-sm)', fontSize: '0.875rem', color: 'var(--primary)' }}>
                        {session.behaviorCount} behavior{session.behaviorCount !== 1 ? 's' : ''} tracked
                      </p>
                    )}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Start Session Dialog */}
      <StartSessionDialog
        isOpen={showStartSession}
        onClose={() => setShowStartSession(false)}
        client={client}
      />
    </div>
  );
};

export default ClientDetail;
