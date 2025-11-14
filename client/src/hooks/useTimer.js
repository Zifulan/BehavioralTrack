import { useState, useEffect, useRef } from 'react';

/**
 * Custom hook for managing a timer
 * @param {boolean} autoStart - Whether to start the timer automatically
 * @returns {object} Timer state and controls
 */
export const useTimer = (autoStart = false) => {
  const [isRunning, setIsRunning] = useState(autoStart);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (isRunning) {
      // Start timer
      const now = Date.now();
      setStartTime(now);

      intervalRef.current = setInterval(() => {
        const currentTime = Date.now();
        const elapsed = Math.floor((currentTime - now) / 1000) + elapsedSeconds;
        setElapsedSeconds(elapsed);
      }, 1000);
    } else {
      // Stop timer
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning]);

  const start = () => {
    if (!isRunning) {
      setIsRunning(true);
    }
  };

  const stop = () => {
    if (isRunning) {
      setIsRunning(false);
    }
  };

  const reset = () => {
    setIsRunning(false);
    setElapsedSeconds(0);
    setStartTime(null);
  };

  const toggle = () => {
    setIsRunning(!isRunning);
  };

  // Format time as HH:MM:SS
  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    return {
      hours: String(hours).padStart(2, '0'),
      minutes: String(minutes).padStart(2, '0'),
      seconds: String(secs).padStart(2, '0'),
      formatted: `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
    };
  };

  return {
    isRunning,
    elapsedSeconds,
    startTime,
    start,
    stop,
    reset,
    toggle,
    formatTime: () => formatTime(elapsedSeconds)
  };
};

export default useTimer;
