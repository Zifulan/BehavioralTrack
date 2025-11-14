import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { BarChart, LineChart, ProgressChart } from '../components/Chart';
import './Analytics.css';

const Analytics = () => {
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('week'); // week, month, all

  useEffect(() => {
    fetchClients();
  }, []);

  useEffect(() => {
    if (selectedClient) {
      fetchAnalytics();
    }
  }, [selectedClient, dateRange]);

  const fetchClients = async () => {
    try {
      const response = await api.get('/clients');
      setClients(response.data.data);
      if (response.data.data.length > 0) {
        setSelectedClient(response.data.data[0].id);
      }
    } catch (err) {
      console.error('Failed to load clients:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    if (!selectedClient) return;

    setLoading(true);
    try {
      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();

      if (dateRange === 'week') {
        startDate.setDate(startDate.getDate() - 7);
      } else if (dateRange === 'month') {
        startDate.setMonth(startDate.getMonth() - 1);
      } else {
        startDate.setFullYear(startDate.getFullYear() - 1);
      }

      // Fetch sessions for client
      const sessionsResponse = await api.get(`/sessions?clientId=${selectedClient}&startDate=${startDate.toISOString().split('T')[0]}&endDate=${endDate.toISOString().split('T')[0]}`);
      const sessionsData = sessionsResponse.data.data || [];
      setSessions(sessionsData);

      // Process analytics
      const analyticsData = processAnalytics(sessionsData);
      setAnalytics(analyticsData);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const processAnalytics = (sessionsData) => {
    // Calculate total sessions
    const totalSessions = sessionsData.length;
    const completedSessions = sessionsData.filter(s => s.endTime).length;

    // Calculate total duration
    const totalDuration = sessionsData.reduce((sum, session) => {
      if (session.endTime) {
        const duration = new Date(session.endTime) - new Date(session.startTime);
        return sum + duration;
      }
      return sum;
    }, 0);

    const avgDuration = completedSessions > 0 ? totalDuration / completedSessions : 0;

    // Group sessions by date
    const sessionsByDate = {};
    sessionsData.forEach(session => {
      const date = new Date(session.sessionDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      sessionsByDate[date] = (sessionsByDate[date] || 0) + 1;
    });

    const sessionsOverTime = Object.entries(sessionsByDate).map(([date, count]) => ({
      label: date,
      value: count
    }));

    // Behavior statistics (would need additional API call to get detailed behavior data)
    // For now, using session behavior counts
    const behaviorStats = {
      totalBehaviors: sessionsData.reduce((sum, s) => sum + (s.behaviorCount || 0), 0),
      avgBehaviorsPerSession: totalSessions > 0 ? sessionsData.reduce((sum, s) => sum + (s.behaviorCount || 0), 0) / totalSessions : 0
    };

    return {
      totalSessions,
      completedSessions,
      activeSessions: totalSessions - completedSessions,
      totalDuration: Math.round(totalDuration / 60000), // Convert to minutes
      avgDuration: Math.round(avgDuration / 60000),
      sessionsOverTime,
      behaviorStats
    };
  };

  if (loading && !analytics) {
    return (
      <div className="page">
        <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--spacing-2xl)' }}>
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  if (clients.length === 0) {
    return (
      <div className="page">
        <div className="container">
          <div className="page-header">
            <h1 className="page-title">Analytics & Trends</h1>
          </div>
          <div className="card" style={{ textAlign: 'center', padding: 'var(--spacing-2xl)' }}>
            <h3 style={{ marginBottom: 'var(--spacing-md)' }}>No clients yet</h3>
            <p style={{ color: 'var(--gray-600)', marginBottom: 'var(--spacing-lg)' }}>
              Add clients and start tracking sessions to see analytics
            </p>
            <Link to="/clients" className="btn btn-primary">
              Go to Clients
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page analytics-page">
      <div className="container">
        {/* Header */}
        <div className="page-header">
          <div>
            <h1 className="page-title">Analytics & Trends</h1>
            <p className="page-subtitle">Behavior tracking insights and statistics</p>
          </div>
          <Link to="/" className="btn btn-secondary">
            Back to Dashboard
          </Link>
        </div>

        {/* Filters */}
        <div className="analytics-filters">
          <div className="filter-group">
            <label className="filter-label">Client:</label>
            <select
              className="form-select"
              value={selectedClient || ''}
              onChange={(e) => setSelectedClient(parseInt(e.target.value))}
            >
              {clients.map(client => (
                <option key={client.id} value={client.id}>
                  {client.firstName} {client.lastName}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label className="filter-label">Time Period:</label>
            <select
              className="form-select"
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
            >
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
              <option value="all">All Time</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--spacing-2xl)' }}>
            <div className="spinner"></div>
          </div>
        ) : analytics ? (
          <>
            {/* Summary Cards */}
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon" style={{ backgroundColor: 'rgba(37, 99, 235, 0.1)' }}>
                  <span style={{ fontSize: '1.5rem' }}>📊</span>
                </div>
                <div className="stat-content">
                  <div className="stat-value">{analytics.totalSessions}</div>
                  <div className="stat-label">Total Sessions</div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)' }}>
                  <span style={{ fontSize: '1.5rem' }}>✓</span>
                </div>
                <div className="stat-content">
                  <div className="stat-value">{analytics.completedSessions}</div>
                  <div className="stat-label">Completed</div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)' }}>
                  <span style={{ fontSize: '1.5rem' }}>⏱️</span>
                </div>
                <div className="stat-content">
                  <div className="stat-value">{analytics.avgDuration}</div>
                  <div className="stat-label">Avg Duration (min)</div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon" style={{ backgroundColor: 'rgba(139, 92, 246, 0.1)' }}>
                  <span style={{ fontSize: '1.5rem' }}>🎯</span>
                </div>
                <div className="stat-content">
                  <div className="stat-value">{analytics.behaviorStats.totalBehaviors}</div>
                  <div className="stat-label">Behaviors Tracked</div>
                </div>
              </div>
            </div>

            {/* Charts */}
            <div className="charts-grid">
              <div className="chart-card">
                <BarChart
                  data={analytics.sessionsOverTime}
                  title="Sessions Over Time"
                  color="var(--primary)"
                />
              </div>

              <div className="chart-card">
                <div className="chart-container">
                  <h3 className="chart-title">Session Completion Rate</h3>
                  <div style={{ padding: 'var(--spacing-lg) 0' }}>
                    <ProgressChart
                      value={analytics.completedSessions}
                      max={analytics.totalSessions}
                      label="Completed Sessions"
                      color="var(--success)"
                    />
                  </div>
                  <div style={{ textAlign: 'center', marginTop: 'var(--spacing-lg)', color: 'var(--gray-600)' }}>
                    <p style={{ fontSize: '0.875rem' }}>
                      {analytics.activeSessions} session{analytics.activeSessions !== 1 ? 's' : ''} currently active
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Sessions Table */}
            {sessions.length > 0 && (
              <div className="card" style={{ marginTop: 'var(--spacing-xl)' }}>
                <h3 style={{ marginBottom: 'var(--spacing-lg)' }}>Recent Sessions</h3>
                <div className="sessions-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Duration</th>
                        <th>Behaviors</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sessions.slice(0, 10).map(session => {
                        const duration = session.endTime
                          ? Math.round((new Date(session.endTime) - new Date(session.startTime)) / 60000)
                          : 'In Progress';

                        return (
                          <tr key={session.id}>
                            <td>{new Date(session.sessionDate).toLocaleDateString()}</td>
                            <td>{typeof duration === 'number' ? `${duration} min` : duration}</td>
                            <td>{session.behaviorCount || 0}</td>
                            <td>
                              <span className={`status-badge ${session.endTime ? 'completed' : 'active'}`}>
                                {session.endTime ? 'Completed' : 'Active'}
                              </span>
                            </td>
                            <td>
                              <Link to={`/sessions/${session.id}`} className="table-link">
                                View →
                              </Link>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="card" style={{ textAlign: 'center', padding: 'var(--spacing-2xl)' }}>
            <p style={{ color: 'var(--gray-600)' }}>
              No session data available for the selected time period.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Analytics;
