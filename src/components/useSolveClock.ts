import { useEffect, useState, useRef } from "react";
import { useIsPageVisible } from "../components/useIsPageVisible";

export interface UseSolveClockArgs {
  initialTimeInSeconds: number;
  hasSolved: boolean;
}

export interface UseSolveClockReturn {
  timeInSeconds: number;
}

export function useSolveClock({
  hasSolved,
  initialTimeInSeconds,
}: UseSolveClockArgs): UseSolveClockReturn {
  // if no data, then default to true
  // (better for clock to run a bit unnecessarily than to show a stopped clock)
  const isVisible = useIsPageVisible() ?? false;
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);

  const [state, setState] = useState({
    msBeforeThisInterval: initialTimeInSeconds * 1000,
    msForThisInterval: 0,
  });

  useEffect(() => {
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (hasSolved || !isVisible) {
      return;
    }

    const intervalStartTime = Date.now();
    startTimeRef.current = intervalStartTime;

    // Use 1000ms interval instead of 500ms for better performance
    intervalRef.current = setInterval(() => {
      // Check if this interval is still valid (prevent stale closures)
      if (startTimeRef.current === intervalStartTime) {
        setState((existing) => ({
          ...existing,
          msForThisInterval: Date.now() - intervalStartTime,
        }));
      }
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      
      // Only update state if this cleanup is for the current interval
      if (startTimeRef.current === intervalStartTime) {
        setState((existing) => ({
          msBeforeThisInterval:
            existing.msBeforeThisInterval + Date.now() - intervalStartTime,
          msForThisInterval: 0,
        }));
      }
      startTimeRef.current = null;
    };
  }, [hasSolved, isVisible]);

  return {
    timeInSeconds: Math.round(
      (state.msBeforeThisInterval + state.msForThisInterval) / 1000
    ),
  };
}
