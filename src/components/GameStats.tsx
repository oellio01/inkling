import React, { useCallback, useEffect, useMemo, useState } from "react";
import classNames from "classnames";
import {
  BarChart,
  Bar,
  Cell,
  LabelList,
  ResponsiveContainer,
  XAxis,
  YAxis,
} from "recharts";
import { IconShare } from "@tabler/icons-react";

import supabase from "../app/supabaseClient";
import styles from "./GameStats.module.scss";
import { formatTimeInSeconds } from "../hooks/formatTimeInSeconds";
import { useShareResult } from "../hooks/useShareResult";
import { useUser } from "../providers/UserProvider";
import { GAMES } from "../../public/game_data";
import { EPOCH_DATE, getTodaysGameIndex } from "../hooks/game-logic";

/* ------------------------------------------------------------------ */
/* Types                                                                */
/* ------------------------------------------------------------------ */

interface GameStatsProps {
  gameId: number;
  answerLength: number;
  onClose: (reason?: "back") => void;
  showBackButton?: boolean;
  onSelectGame?: (index: number) => void;
}

interface GameResult {
  time_seconds: number;
  guesses: number;
  hints: number;
  user_id: string;
}

interface UserResultRow {
  time_seconds: number;
  hints: number;
  game_id: number;
}

interface UserStats {
  gamesCompleted: number;
  totalGames: number;
  percentWithoutHints: number;
  fastestTime: number;
}

/* ------------------------------------------------------------------ */
/* Helpers                                                              */
/* ------------------------------------------------------------------ */

function formatTimeDisplay(timeInSeconds: number): string {
  if (timeInSeconds <= 0) return "--";
  const { minutes, seconds } = formatTimeInSeconds(timeInSeconds);
  return `${minutes}:${seconds}`;
}

function gameIdToDate(id: number): Date {
  const d = new Date(EPOCH_DATE);
  d.setDate(d.getDate() + (id - 1));
  return d;
}

function formatBoardDate(date: Date): string {
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function buildHistogram(values: number[]): Record<number, number> {
  const hist: Record<number, number> = {};
  for (const v of values) {
    hist[v] = (hist[v] ?? 0) + 1;
  }
  return hist;
}

function computeUserStats(
  rows: UserResultRow[],
  totalReleased: number
): UserStats {
  const gamesCompleted = rows.length;
  const gamesWithoutHints = rows.filter((r) => r.hints === 0).length;
  const validTimes = rows.map((r) => r.time_seconds).filter((t) => t > 0);

  return {
    gamesCompleted,
    totalGames: totalReleased,
    percentWithoutHints:
      gamesCompleted > 0
        ? Math.round((gamesWithoutHints / gamesCompleted) * 100)
        : 0,
    fastestTime: validTimes.length > 0 ? Math.min(...validTimes) : 0,
  };
}

/* ------------------------------------------------------------------ */
/* Subcomponents                                                        */
/* ------------------------------------------------------------------ */

function StatsCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className={styles.statsCard}>
      <div className={styles.statsLabel}>{label}</div>
      <div className={styles.statsValue}>{value}</div>
    </div>
  );
}

interface UserBarChartProps {
  hist: Record<number, number>;
  answerLength: number;
  barLabel: string;
  minValue?: number;
  userValue?: number;
}

const USER_BAR_COLOR = "#4caf50";
const DEFAULT_BAR_COLOR = "#9e9e9e";

const UserBarChart = React.memo(function UserBarChart({
  hist,
  answerLength,
  barLabel,
  minValue = 0,
  userValue,
}: UserBarChartProps) {
  const data = useMemo(
    () =>
      Array.from({ length: answerLength - minValue + 1 }, (_, i) => {
        const value = minValue + i;
        return {
          name: value.toString(),
          value: hist[value] ?? 0,
        };
      }),
    [answerLength, minValue, hist]
  );

  return (
    <div className={styles.barChart}>
      <div className={styles.chartLabel}>{barLabel}</div>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 20 }}>
          <XAxis dataKey="name" axisLine={false} tickLine={false} />
          <YAxis hide domain={[0, "dataMax"]} />
          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
            <LabelList
              dataKey="value"
              position="top"
              style={{ fontSize: "12px" }}
              formatter={(value: unknown) =>
                typeof value === "number" && value > 0 ? value : ""
              }
            />
            {data.map((entry, index) => {
              const isUserValue =
                userValue !== undefined && parseInt(entry.name) === userValue;
              return (
                <Cell
                  key={`cell-${index}`}
                  fill={isUserValue ? USER_BAR_COLOR : DEFAULT_BAR_COLOR}
                />
              );
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
});

interface ContributionBoardProps {
  playedGameIds: Set<number>;
  todayGameIndex: number;
  currentGameId: number;
  onSelectGame?: (gameId: number) => void;
}

const ContributionBoard = React.memo(function ContributionBoard({
  playedGameIds,
  todayGameIndex,
  currentGameId,
  onSelectGame,
}: ContributionBoardProps) {
  const cells = useMemo(() => {
    // todayGameIndex is 0-based, so `todayGameIndex + 1` games are released.
    const totalGames = Math.min(
      Math.max(todayGameIndex + 1, 0),
      GAMES.length
    );
    const out: { gameId: number; date: Date; played: boolean }[] = [];
    for (let g = 1; g <= totalGames; g++) {
      out.push({
        gameId: g,
        date: gameIdToDate(g),
        played: playedGameIds.has(g),
      });
    }
    return out;
  }, [playedGameIds, todayGameIndex]);

  return (
    <div className={styles.boardWrapper}>
      <div className={styles.board}>
        {cells.map((cell) => {
          const isCurrent = cell.gameId === currentGameId;
          const label = `Inkling #${cell.gameId} - ${formatBoardDate(
            cell.date
          )} - ${cell.played ? "played" : "not played"}`;
          const className = classNames(
            styles.boardTile,
            cell.played ? styles.boardTilePlayed : styles.boardTileEmpty,
            isCurrent && styles.boardTileCurrent,
            onSelectGame && styles.boardTileClickable
          );
          if (!onSelectGame) {
            return (
              <div
                key={`g-${cell.gameId}`}
                className={className}
                title={label}
              />
            );
          }
          return (
            <button
              key={`g-${cell.gameId}`}
              type="button"
              className={className}
              title={label}
              aria-label={label}
              onClick={() => onSelectGame(cell.gameId)}
            />
          );
        })}
      </div>
    </div>
  );
});

/* ------------------------------------------------------------------ */
/* Main component                                                       */
/* ------------------------------------------------------------------ */

export const GameStats = React.memo(function GameStats({
  gameId,
  answerLength,
  onClose,
  showBackButton = false,
  onSelectGame,
}: GameStatsProps) {
  const { user } = useUser();
  const [results, setResults] = useState<GameResult[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [playedGameIds, setPlayedGameIds] = useState<Set<number>>(
    () => new Set()
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const todayGameIndex = useMemo(() => getTodaysGameIndex(), []);
  const { hasCopiedFor, share } = useShareResult();

  // Fetch current-game and user-aggregate data whenever game or user changes.
  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      setLoading(true);
      setError(null);

      try {
        const { data: gameData, error: gameError } = await supabase
          .from("game_results")
          .select("time_seconds,guesses,hints,user_id")
          .eq("game_id", gameId);

        if (gameError) throw gameError;
        if (cancelled) return;

        setResults((gameData ?? []) as GameResult[]);

        if (!user) {
          setUserStats(null);
          setPlayedGameIds(new Set());
          return;
        }

        const { data: userResults, error: userError } = await supabase
          .from("game_results")
          .select("time_seconds,hints,game_id")
          .eq("user_id", user.id);

        if (userError) throw userError;
        if (cancelled) return;

        const rows = (userResults ?? []) as UserResultRow[];
        const totalReleased = Math.min(
          Math.max(todayGameIndex + 1, 0),
          GAMES.length
        );
        setUserStats(computeUserStats(rows, totalReleased));
        setPlayedGameIds(new Set(rows.map((r) => r.game_id)));
      } catch (err: unknown) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchData();
    return () => {
      cancelled = true;
    };
  }, [gameId, user, todayGameIndex]);

  const userGameResult = useMemo(
    () => (user ? results.find((r) => r.user_id === user.id) ?? null : null),
    [results, user]
  );

  const globalStats = useMemo(() => {
    const times = results.map((r) => r.time_seconds).filter((t) => t > 0);
    const fastest = times.length ? Math.min(...times) : 0;
    const average = times.length
      ? Math.round(times.reduce((a, b) => a + b, 0) / times.length)
      : 0;
    return {
      fastest,
      average,
      guessesHist: buildHistogram(results.map((r) => r.guesses)),
      hintsHist: buildHistogram(results.map((r) => r.hints)),
    };
  }, [results]);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose]
  );

  const handleSelectBoardGame = useCallback(
    (selectedGameId: number) => {
      if (!onSelectGame) return;
      onClose();
      onSelectGame(selectedGameId - 1);
    },
    [onClose, onSelectGame]
  );

  const handleShare = useCallback(() => {
    if (!userGameResult) return;
    share({
      gameId,
      timeInSeconds: userGameResult.time_seconds,
      guessCount: userGameResult.guesses,
      hintCount: userGameResult.hints,
      userId: user?.id,
    });
  }, [share, gameId, user?.id, userGameResult]);

  return (
    <div className={styles.backdrop} onClick={handleBackdropClick}>
      <div className={styles.popup}>
        {showBackButton ? (
          <button
            className={styles.back_button}
            onClick={() => onClose("back")}
          >
            Back
          </button>
        ) : (
          <button
            className={styles.closeButton}
            onClick={() => onClose()}
            aria-label="Close"
          >
            ×
          </button>
        )}

        {loading ? (
          <div>Loading...</div>
        ) : error ? (
          <div className={styles.ratingError}>{error}</div>
        ) : (
          <>
            {userStats && (
              <section className={styles.allTimeSection}>
                <h3 className={styles.sectionTitle}>All-time stats</h3>
                <ContributionBoard
                  playedGameIds={playedGameIds}
                  todayGameIndex={todayGameIndex}
                  currentGameId={gameId}
                  onSelectGame={
                    onSelectGame ? handleSelectBoardGame : undefined
                  }
                />
                <div className={styles.statsRow}>
                  <StatsCard
                    label="Games played"
                    value={`${userStats.gamesCompleted} of ${userStats.totalGames}`}
                  />
                  <StatsCard
                    label="Fastest ever"
                    value={formatTimeDisplay(userStats.fastestTime)}
                  />
                  <StatsCard
                    label="Without hints"
                    value={`${userStats.percentWithoutHints}%`}
                  />
                </div>
              </section>
            )}

            <section className={styles.gameStatsSection}>
              <h3 className={styles.sectionTitle}>Inkling {gameId}</h3>

              {userGameResult ? (
                <>
                  <div className={styles.statsRow}>
                    <StatsCard
                      label="Your time"
                      value={formatTimeDisplay(userGameResult.time_seconds)}
                    />
                    <StatsCard
                      label="Guesses"
                      value={userGameResult.guesses}
                    />
                    <StatsCard label="Hints" value={userGameResult.hints} />
                  </div>
                  <button
                    className={styles.shareButton}
                    onClick={handleShare}
                    aria-label="Share your result"
                    type="button"
                  >
                    <span>Share</span>
                    <IconShare size={20} />
                  </button>
                  {hasCopiedFor(gameId) && (
                    <div className={styles.copiedMessage}>
                      Copied to clipboard!
                    </div>
                  )}
                </>
              ) : (
                <div className={styles.noResultsMsg}>
                  You haven&apos;t played this inkling yet.
                </div>
              )}

              <hr className={styles.innerDivider} />

              <h4 className={styles.subSectionTitle}>Everyone&apos;s stats</h4>
              {results.length === 0 ? (
                <div className={styles.noResultsMsg}>
                  No results yet for this inkling.
                </div>
              ) : (
                <>
                  <div className={styles.statsRow}>
                    <StatsCard
                      label="Fastest"
                      value={formatTimeDisplay(globalStats.fastest)}
                    />
                    <StatsCard
                      label="Average"
                      value={formatTimeDisplay(globalStats.average)}
                    />
                  </div>
                  <UserBarChart
                    hist={globalStats.guessesHist}
                    answerLength={answerLength}
                    barLabel="Guesses"
                    minValue={1}
                    userValue={userGameResult?.guesses}
                  />
                  <UserBarChart
                    hist={globalStats.hintsHist}
                    answerLength={answerLength}
                    barLabel="Hints"
                    minValue={0}
                    userValue={userGameResult?.hints}
                  />
                </>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
});
