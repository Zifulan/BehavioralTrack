import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import './NotificationCenter.css';

const NotificationCenter = () => {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Load notifications from localStorage
    loadNotifications();

    // Listen for new notifications
    window.addEventListener('newNotification', handleNewNotification);

    return () => {
      window.removeEventListener('newNotification', handleNewNotification);
    };
  }, []);

  useEffect(() => {
    // Update unread count
    const unread = notifications.filter(n => !n.read).length;
    setUnreadCount(unread);
  }, [notifications]);

  const loadNotifications = () => {
    const saved = localStorage.getItem('notifications');
    if (saved) {
      setNotifications(JSON.parse(saved));
    }
  };

  const saveNotifications = (notifs) => {
    localStorage.setItem('notifications', JSON.stringify(notifs));
    setNotifications(notifs);
  };

  const handleNewNotification = (event) => {
    const newNotif = {
      id: Date.now(),
      ...event.detail,
      read: false,
      timestamp: new Date().toISOString()
    };

    const updated = [newNotif, ...notifications].slice(0, 50); // Keep last 50
    saveNotifications(updated);

    // Show browser notification if permitted
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(newNotif.title, {
        body: newNotif.message,
        icon: '/vite.svg'
      });
    }
  };

  const markAsRead = (id) => {
    const updated = notifications.map(n =>
      n.id === id ? { ...n, read: true } : n
    );
    saveNotifications(updated);
  };

  const markAllAsRead = () => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    saveNotifications(updated);
  };

  const clearAll = () => {
    if (window.confirm('Clear all notifications?')) {
      saveNotifications([]);
    }
  };

  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success':
        return '✅';
      case 'warning':
        return '⚠️';
      case 'error':
        return '❌';
      case 'info':
        return 'ℹ️';
      case 'goal':
        return '🎯';
      case 'achievement':
        return '🎉';
      default:
        return '📢';
    }
  };

  return (
    <div className="notification-center">
      <button
        className="notification-button"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="notification-icon">🔔</span>
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <div className="notification-panel">
          <div className="notification-header">
            <h3>Notifications</h3>
            <div className="notification-actions">
              {unreadCount > 0 && (
                <button
                  className="notification-action-btn"
                  onClick={markAllAsRead}
                  title="Mark all as read"
                >
                  ✓
                </button>
              )}
              <button
                className="notification-action-btn"
                onClick={clearAll}
                title="Clear all"
              >
                🗑️
              </button>
              <button
                className="notification-action-btn"
                onClick={() => setIsOpen(false)}
                title="Close"
              >
                ✕
              </button>
            </div>
          </div>

          {Notification.permission === 'default' && (
            <div className="notification-permission">
              <p>Enable browser notifications?</p>
              <button
                className="btn btn-sm btn-primary"
                onClick={requestNotificationPermission}
              >
                Enable
              </button>
            </div>
          )}

          <div className="notification-list">
            {notifications.length === 0 ? (
              <div className="notification-empty">
                <span className="empty-icon">📭</span>
                <p>No notifications yet</p>
              </div>
            ) : (
              notifications.map(notif => (
                <div
                  key={notif.id}
                  className={`notification-item ${notif.read ? 'read' : 'unread'}`}
                  onClick={() => !notif.read && markAsRead(notif.id)}
                >
                  <span className="notif-icon">{getNotificationIcon(notif.type)}</span>
                  <div className="notif-content">
                    <div className="notif-title">{notif.title}</div>
                    <div className="notif-message">{notif.message}</div>
                    <div className="notif-time">
                      {new Date(notif.timestamp).toLocaleString()}
                    </div>
                  </div>
                  {!notif.read && <div className="notif-unread-dot"></div>}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Helper function to send notifications
export const sendNotification = (title, message, type = 'info') => {
  const event = new CustomEvent('newNotification', {
    detail: { title, message, type }
  });
  window.dispatchEvent(event);
};

// Predefined notification templates
export const notifySessionComplete = (clientName) => {
  sendNotification(
    'Session Completed',
    `Session with ${clientName} has been successfully completed.`,
    'success'
  );
};

export const notifyGoalAchieved = (behaviorName) => {
  sendNotification(
    'Goal Achieved! 🎉',
    `Target reached for ${behaviorName}!`,
    'achievement'
  );
};

export const notifySessionReminder = (clientName, time) => {
  sendNotification(
    'Session Reminder',
    `Upcoming session with ${clientName} at ${time}`,
    'info'
  );
};

export const notifyExportReady = (format) => {
  sendNotification(
    'Export Ready',
    `Your ${format.toUpperCase()} export is ready for download.`,
    'success'
  );
};

NotificationCenter.propTypes = {};

export default NotificationCenter;
