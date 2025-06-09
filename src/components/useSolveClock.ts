import { useEffect, useState } from "react";
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

  const [state, setState] = useState({
    msBeforeThisInterval: initialTimeInSeconds * 1000,
    msForThisInterval: 0,
  });

  useEffect(() => {
    if (hasSolved || !isVisible) {
      return;
    }

    const intervalStartTime = Date.now();

    const interval = setInterval(() => {
      setState((existing) => ({
        ...existing,
        msForThisInterval: Date.now() - intervalStartTime,
      }));
    }, 500);

    return () => {
      setState((existing) => ({
        msBeforeThisInterval:
          existing.msBeforeThisInterval + Date.now() - intervalStartTime,
        msForThisInterval: 0,
      }));
      clearInterval(interval);
    };
  }, [hasSolved, isVisible]);

  return {
    timeInSeconds: Math.round(
      (state.msBeforeThisInterval + state.msForThisInterval) / 1000
    ),
  };
}
