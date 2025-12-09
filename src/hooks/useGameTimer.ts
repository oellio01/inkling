import { useState, useCallback, useEffect, useRef } from "react";

interface TimerState {
  gameIndex: number;
  timeInSeconds: number;
  lastUpdated: number;
  isActive: boolean;
}

const STORAGE_KEY = "inkling_timer_state";

export function useGameTimer(gameIndex: number, isPaused: boolean) {
  const [timeInSeconds, setTimeInSeconds] = useState(0);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const timeRef = useRef(0);

  // Update the ref when the time changes
  useEffect(() => {
    timeRef.current = timeInSeconds;
  }, [timeInSeconds]);

  // Save timer state to localStorage
  const saveTimerState = useCallback(
    (time: number, active: boolean) => {
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
    },
    [gameIndex]
  );

  // Load timer state from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const state: TimerState = JSON.parse(stored);

        if (state.gameIndex === gameIndex) {
          setTimeInSeconds(state.timeInSeconds);
          setIsTimerActive(state.isActive);
        } else {
          // Clear old state if it's a different game
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch (error) {
      console.error("Error loading timer state:", error);
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [gameIndex]);

  // Timer interval - runs every second when active
  useEffect(() => {
    if (!isTimerActive || isPaused) {
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
  }, [isTimerActive, isPaused, saveTimerState]);

  // Start the timer
  const startTimer = useCallback(() => {
    setIsTimerActive(true);
    saveTimerState(timeInSeconds, true);
  }, [timeInSeconds, saveTimerState]);

  // Pause the timer
  const pauseTimer = useCallback(() => {
    setIsTimerActive(false);
    saveTimerState(timeInSeconds, false);
  }, [timeInSeconds, saveTimerState]);

  // Reset the timer for a new game
  const resetTimer = useCallback(() => {
    setTimeInSeconds(0);
    setIsTimerActive(false);
    saveTimerState(0, false);
  }, [saveTimerState]);

  // Add time (for hints)
  const addTime = useCallback(
    (seconds: number) => {
      setTimeInSeconds((prev) => {
        const newTime = prev + seconds;
        saveTimerState(newTime, isTimerActive);
        return newTime;
      });
    },
    [isTimerActive, saveTimerState]
  );

  // Auto-start/pause timer based on isPaused prop
  useEffect(() => {
    if (!isPaused) {
      startTimer();
    } else {
      pauseTimer();
    }
  }, [isPaused, startTimer, pauseTimer]);

  return {
    timeInSeconds,
    timeRef,
    startTimer,
    pauseTimer,
    resetTimer,
    addTime,
  };
}
