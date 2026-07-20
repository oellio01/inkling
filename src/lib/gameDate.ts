import { GAMES } from "../data/games";

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
 * The 0-based index a purely date-based schedule would land on today. This can
 * point past the end of the archive now that new puzzles have stopped, so it's
 * kept private in favour of the clamped helpers below.
 */
function getScheduledGameIndex(): number {
  return daysBetween(EPOCH_DATE, new Date());
}

/**
 * The index of the newest playable game. New puzzles are no longer published,
 * so this is clamped to the final game in the archive.
 */
export function getLatestGameIndex(): number {
  return Math.min(Math.max(getScheduledGameIndex(), 0), GAMES.length - 1);
}

/**
 * How many games are available to play. Every puzzle has now been released, so
 * this is simply the whole archive up to and including the latest game.
 */
export function getReleasedGameCount(): number {
  return getLatestGameIndex() + 1;
}
