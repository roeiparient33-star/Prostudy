import { createContext, useContext } from 'react';
import { useStudyTimer, formatTime } from '../hooks/useStudyTimer';
import { useAuth } from './AuthContext';

const TimerContext = createContext(null);

export function TimerProvider({ children }) {
  const { user, refreshProfile } = useAuth();
  const timer = useStudyTimer(user?.id, refreshProfile);
  return <TimerContext.Provider value={timer}>{children}</TimerContext.Provider>;
}

export function useTimer() {
  return useContext(TimerContext);
}

export { formatTime };
