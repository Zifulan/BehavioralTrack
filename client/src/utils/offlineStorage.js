/**
 * Offline storage utilities using LocalStorage
 * Provides fallback data when offline
 */

const STORAGE_PREFIX = 'behavioraltrack_';
const OFFLINE_QUEUE_KEY = `${STORAGE_PREFIX}offline_queue`;

/**
 * Save data to local storage
 */
export const saveToStorage = (key, data) => {
  try {
    const fullKey = `${STORAGE_PREFIX}${key}`;
    localStorage.setItem(fullKey, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error('Failed to save to storage:', error);
    return false;
  }
};

/**
 * Get data from local storage
 */
export const getFromStorage = (key) => {
  try {
    const fullKey = `${STORAGE_PREFIX}${key}`;
    const data = localStorage.getItem(fullKey);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Failed to get from storage:', error);
    return null;
  }
};

/**
 * Remove data from local storage
 */
export const removeFromStorage = (key) => {
  try {
    const fullKey = `${STORAGE_PREFIX}${key}`;
    localStorage.removeItem(fullKey);
    return true;
  } catch (error) {
    console.error('Failed to remove from storage:', error);
    return false;
  }
};

/**
 * Clear all app data from storage
 */
export const clearAllStorage = () => {
  try {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(STORAGE_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
    return true;
  } catch (error) {
    console.error('Failed to clear storage:', error);
    return false;
  }
};

/**
 * Queue an API request for later when back online
 */
export const queueOfflineRequest = (request) => {
  try {
    const queue = getOfflineQueue();
    queue.push({
      ...request,
      id: Date.now() + Math.random(),
      timestamp: new Date().toISOString()
    });
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
    return true;
  } catch (error) {
    console.error('Failed to queue request:', error);
    return false;
  }
};

/**
 * Get all queued offline requests
 */
export const getOfflineQueue = () => {
  try {
    const queue = localStorage.getItem(OFFLINE_QUEUE_KEY);
    return queue ? JSON.parse(queue) : [];
  } catch (error) {
    console.error('Failed to get offline queue:', error);
    return [];
  }
};

/**
 * Process offline queue when back online
 */
export const processOfflineQueue = async (api) => {
  const queue = getOfflineQueue();
  if (queue.length === 0) return { success: true, processed: 0 };

  const results = {
    success: 0,
    failed: 0,
    errors: []
  };

  for (const request of queue) {
    try {
      await api({
        method: request.method,
        url: request.url,
        data: request.data
      });
      results.success++;
    } catch (error) {
      results.failed++;
      results.errors.push({
        request,
        error: error.message
      });
    }
  }

  // Clear queue if all successful
  if (results.failed === 0) {
    localStorage.removeItem(OFFLINE_QUEUE_KEY);
  }

  return results;
};

/**
 * Check if device is online
 */
export const isOnline = () => {
  return navigator.onLine;
};

/**
 * Cache clients data
 */
export const cacheClients = (clients) => {
  saveToStorage('clients', clients);
};

/**
 * Get cached clients
 */
export const getCachedClients = () => {
  return getFromStorage('clients') || [];
};

/**
 * Cache sessions data
 */
export const cacheSessions = (sessions) => {
  saveToStorage('sessions', sessions);
};

/**
 * Get cached sessions
 */
export const getCachedSessions = () => {
  return getFromStorage('sessions') || [];
};

/**
 * Cache single session with behaviors
 */
export const cacheSession = (sessionId, sessionData) => {
  saveToStorage(`session_${sessionId}`, sessionData);
};

/**
 * Get cached session
 */
export const getCachedSession = (sessionId) => {
  return getFromStorage(`session_${sessionId}`);
};

/**
 * Save behavior log locally (for offline use)
 */
export const saveOfflineBehaviorLog = (sessionId, behaviorId, logData) => {
  const key = `offline_logs_${sessionId}`;
  const logs = getFromStorage(key) || [];
  logs.push({
    behaviorId,
    ...logData,
    offlineId: Date.now() + Math.random(),
    createdAt: new Date().toISOString()
  });
  saveToStorage(key, logs);
};

/**
 * Get offline behavior logs for a session
 */
export const getOfflineBehaviorLogs = (sessionId) => {
  return getFromStorage(`offline_logs_${sessionId}`) || [];
};

/**
 * Clear offline logs for a session after sync
 */
export const clearOfflineLogs = (sessionId) => {
  removeFromStorage(`offline_logs_${sessionId}`);
};

/**
 * Get storage usage info
 */
export const getStorageInfo = () => {
  try {
    let totalSize = 0;
    const keys = Object.keys(localStorage);
    const appKeys = keys.filter(k => k.startsWith(STORAGE_PREFIX));

    appKeys.forEach(key => {
      const item = localStorage.getItem(key);
      if (item) {
        totalSize += item.length + key.length;
      }
    });

    return {
      itemCount: appKeys.length,
      totalSize: totalSize,
      totalSizeKB: (totalSize / 1024).toFixed(2),
      totalSizeMB: (totalSize / 1024 / 1024).toFixed(2)
    };
  } catch (error) {
    console.error('Failed to get storage info:', error);
    return null;
  }
};

export default {
  saveToStorage,
  getFromStorage,
  removeFromStorage,
  clearAllStorage,
  queueOfflineRequest,
  getOfflineQueue,
  processOfflineQueue,
  isOnline,
  cacheClients,
  getCachedClients,
  cacheSessions,
  getCachedSessions,
  cacheSession,
  getCachedSession,
  saveOfflineBehaviorLog,
  getOfflineBehaviorLogs,
  clearOfflineLogs,
  getStorageInfo
};
