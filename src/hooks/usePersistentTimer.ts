import { useState, useEffect, useCallback } from "react";

interface TimerState {
  gameIndex: number;
  timeInSeconds: number;
  lastUpdated: number;
  isActive: boolean;
}

const STORAGE_KEY = "rebus_timer_state";

export function usePersistentTimer(
  gameIndex: number,
  isPaused: boolean = false
) {
  const [timeInSeconds, setTimeInSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);

  // Load timer state from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const state: TimerState = JSON.parse(stored);
        
        if (state.gameIndex === gameIndex) {
          setTimeInSeconds(state.timeInSeconds);
          setIsActive(state.isActive);
        } else {
          // Clear old state if it's a different game or too old
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch (error) {
      console.error("Error loading timer state:", error);
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [gameIndex]);

  // Save timer state to localStorage whenever it changes
  const saveTimerState = useCallback((time: number, active: boolean) => {
    try {
      const state: TimerState = {
        gameIndex,
        timeInSeconds: time,
        lastUpdated: Date.now(),
        isActive: active,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error("Error saving timer state:", error);
    }
  }, [gameIndex]);

  // Update timer every second when active and not paused
  useEffect(() => {
    if (!isActive || isPaused) {
      return;
    }

    const interval = setInterval(() => {
      setTimeInSeconds((prev) => {
        const newTime = prev + 1;
        saveTimerState(newTime, true);
        return newTime;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, isPaused, saveTimerState]);

  // Start the timer
  const startTimer = useCallback(() => {
    setIsActive(true);
    saveTimerState(timeInSeconds, true);
  }, [timeInSeconds, saveTimerState]);

  // Pause the timer
  const pauseTimer = useCallback(() => {
    setIsActive(false);
    saveTimerState(timeInSeconds, false);
  }, [timeInSeconds, saveTimerState]);

  // Reset the timer for a new game
  const resetTimer = useCallback(() => {
    setTimeInSeconds(0);
    setIsActive(false);
    saveTimerState(0, false);
  }, [saveTimerState]);

  // Add time (for hints)
  const addTime = useCallback((seconds: number) => {
    setTimeInSeconds((prev) => {
      const newTime = prev + seconds;
      saveTimerState(newTime, isActive);
      return newTime;
    });
  }, [isActive, saveTimerState]);

  return {
    timeInSeconds,
    isActive,
    startTimer,
    pauseTimer,
    resetTimer,
    addTime,
  };
} 