import { useEffect, useState } from "react";

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function getTimeUntilMidnight(now: Date = new Date()): string {
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  const diff = Math.max(0, tomorrow.getTime() - now.getTime());
  const hours = Math.floor(diff / 3_600_000);
  const minutes = Math.floor((diff % 3_600_000) / 60_000);
  const seconds = Math.floor((diff % 60_000) / 1_000);

  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

/**
 * Ticking countdown string (HH:MM:SS) until the user's local midnight, when
 * the next Inkling unlocks. Updates once per second.
 */
export function useCountdownToMidnight(): string {
  const [value, setValue] = useState<string>(() => getTimeUntilMidnight());

  useEffect(() => {
    const id = setInterval(() => setValue(getTimeUntilMidnight()), 1000);
    return () => clearInterval(id);
  }, []);

  return value;
}
