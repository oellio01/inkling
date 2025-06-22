import { GAMES, GameData } from "../../public/game_data";

// The release date of the very first game.
export const EPOCH_DATE = new Date(2025, 5, 19);

/**
 * Calculates the difference in days between two dates, ignoring the time component.
 */
function daysBetween(start: Date, end: Date): number {
  const startDate = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const endDate = new Date(end.getFullYear(), end.getMonth(), end.getDate());

  const msPerDay = 1000 * 60 * 60 * 24;
  const diffMs = endDate.getTime() - startDate.getTime();

  return Math.round(diffMs / msPerDay);
}

/**
 * Returns the game data for the current day based on the epoch date.
 */
export function getGameForToday(): GameData | null {
  const today = new Date();
  const gameIndex = daysBetween(EPOCH_DATE, today);

  if (gameIndex < 0 || gameIndex >= GAMES.length) {
    // This can happen if the current date is before the epoch or after the last game.
    return null;
  }

  return GAMES[gameIndex];
} 