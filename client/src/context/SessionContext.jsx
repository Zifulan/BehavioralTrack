import { createContext, useState, useContext } from 'react';

const SessionContext = createContext(null);

export const SessionProvider = ({ children }) => {
  const [currentSession, setCurrentSession] = useState(null);
  const [activeBehaviors, setActiveBehaviors] = useState([]);

  const startSession = (session) => {
    setCurrentSession(session);
    setActiveBehaviors([]);
  };

  const endSession = () => {
    setCurrentSession(null);
    setActiveBehaviors([]);
  };

  const addBehavior = (behavior) => {
    setActiveBehaviors(prev => [...prev, behavior]);
  };

  const updateBehavior = (behaviorId, updates) => {
    setActiveBehaviors(prev =>
      prev.map(b => b.id === behaviorId ? { ...b, ...updates } : b)
    );
  };

  const removeBehavior = (behaviorId) => {
    setActiveBehaviors(prev => prev.filter(b => b.id !== behaviorId));
  };

  const value = {
    currentSession,
    activeBehaviors,
    startSession,
    endSession,
    addBehavior,
    updateBehavior,
    removeBehavior
  };

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
};

export const useSession = () => {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within SessionProvider');
  }
  return context;
};

export default SessionContext;
