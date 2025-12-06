import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import supabase from "../app/supabaseClient";
import styles from "./GameStats.module.scss";
import classNames from "classnames";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Cell,
  LabelList,
} from "recharts";
import React from "react";
import { formatTimeInSeconds } from "./formatTimeInSeconds";
import { useUser } from "../providers/UserProvider";
import { GAMES } from "../../public/game_data";

interface GameStatsProps {
  gameId: number;
  answerLength: number;
  onClose: (reason?: "back") => void;
  showBackButton?: boolean;
}

interface GameResult {
  time_seconds: number;
  guesses: number;
  hints: number;
  user_id: string;
}

interface UserStats {
  gamesCompleted: number;
  totalGames: number;
  percentWithoutHints: number;
  fastestTime: number;
}

interface UserBarChartProps {
  hist: Record<number, number>;
  answerLength: number;
  barLabel: string;
  minValue?: number;
  userValue?: number;
}

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
          value: hist[value] || 0,
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
              style={{
                fontSize: "12px",
              }}
              formatter={(value: unknown) =>
                typeof value === "number" && value > 0 ? value : ""
              }
            />
            {useMemo(
              () =>
                data.map((entry, index) => {
                  const isUserValue =
                    userValue !== undefined &&
                    parseInt(entry.name) === userValue;
                  return (
                    <Cell
                      key={`cell-${index}`}
                      fill={isUserValue ? "#4caf50" : "#9e9e9e"}
                    />
                  );
                }),
              [data, userValue]
            )}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
});

// Helper function to format time display
function formatTimeDisplay(timeInSeconds: number): string {
  if (timeInSeconds <= 0) return "--";
  const { minutes, seconds } = formatTimeInSeconds(timeInSeconds);
  return `${minutes}:${seconds}`;
}

// Helper component for stats cards
const StatsCard = React.memo(function StatsCard({
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
});

export const GameStats = React.memo(function GameStats({
  gameId,
  answerLength,
  onClose,
  showBackButton = false,
}: GameStatsProps) {
  const { user } = useUser();
  const [results, setResults] = useState<GameResult[]>([]);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch game results
        const { data: gameData, error: gameError } = await supabase
          .from("game_results")
          .select("time_seconds,guesses,hints,user_id")
          .eq("game_id", gameId);

        if (gameError) throw gameError;

        setResults(gameData || []);

        // Fetch user stats
        if (user) {
          const { data: userResults, error: userError } = await supabase
            .from("game_results")
            .select("time_seconds,hints,game_id")
            .eq("user_id", user.id);

          if (userError) throw userError;

          if (userResults) {
            const gamesCompleted = userResults.length;
            const gamesWithoutHints = userResults.filter(
              (r) => r.hints === 0
            ).length;
            const validTimes = userResults
              .map((r) => r.time_seconds)
              .filter((t) => t > 0);

            setUserStats({
              gamesCompleted,
              totalGames: GAMES.length,
              percentWithoutHints:
                gamesCompleted > 0
                  ? Math.round((gamesWithoutHints / gamesCompleted) * 100)
                  : 0,
              fastestTime: validTimes.length > 0 ? Math.min(...validTimes) : 0,
            });
          }
        }
      } catch (error: unknown) {
        setError(error instanceof Error ? error.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [gameId, user]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog) dialog.showModal();
    return () => {
      if (dialog) dialog.close();
    };
  }, []);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDialogElement>) => {
      if (dialogRef.current && e.target === dialogRef.current) {
        onClose();
      }
    },
    [onClose]
  );

  // Calculate stats
  const times = useMemo(
    () => results.map((r) => r.time_seconds).filter((t) => t > 0),
    [results]
  );
  const fastest = useMemo(
    () => (times.length ? Math.min(...times) : 0),
    [times]
  );
  const average = useMemo(
    () =>
      times.length
        ? Math.round(times.reduce((a, b) => a + b, 0) / times.length)
        : 0,
    [times]
  );

  const guessesHist = useMemo(
    () => buildHistogram(results.map((r) => r.guesses)),
    [results]
  );
  const hintsHist = useMemo(
    () => buildHistogram(results.map((r) => r.hints)),
    [results]
  );

  // Check if current user has played this specific game
  const userGameResult = useMemo(
    () => (user ? results.find((r) => r.user_id === user.id) : null),
    [user, results]
  );

  return (
    <dialog ref={dialogRef} className={styles.popup} onClick={handleClick}>
      {showBackButton ? (
        <button
          className={classNames(styles.button, styles.back_button)}
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
      ) : results.length === 0 ? (
        <div className={styles.noResultsMsg}>No results yet for this game.</div>
      ) : (
        <>
          {/* Your Stats Section */}
          {userStats && (
            <div className={styles.userStatsSection}>
              <h3 className={styles.sectionTitle}>Your Stats</h3>

              {/* Current Game Results */}
              <h4 className={styles.subSectionTitle}>This Game</h4>
              <div className={styles.statsRow}>
                <StatsCard
                  label="Your time"
                  value={formatTimeDisplay(userGameResult?.time_seconds || 0)}
                />
                <StatsCard
                  label="Guesses"
                  value={userGameResult?.guesses ?? "--"}
                />
                <StatsCard
                  label="Hints"
                  value={userGameResult?.hints ?? "--"}
                />
              </div>

              {/* Overall Stats */}
              <h4 className={styles.subSectionTitle}>Overall</h4>
              <div className={styles.statsRow}>
                <StatsCard
                  label="Games completed"
                  value={`${userStats.gamesCompleted} of ${userStats.totalGames}`}
                />
                <StatsCard
                  label="Completed without hints"
                  value={`${userStats.percentWithoutHints}%`}
                />
                <StatsCard
                  label="Your fastest ever"
                  value={formatTimeDisplay(userStats.fastestTime)}
                />
              </div>
            </div>
          )}

          {/* Game Stats Section */}
          <div className={styles.gameStatsSection}>
            <h3>Inkling {gameId} Stats</h3>
            <div className={styles.statsRow}>
              <StatsCard label="Fastest" value={formatTimeDisplay(fastest)} />
              <StatsCard label="Average" value={formatTimeDisplay(average)} />
            </div>
            <UserBarChart
              hist={guessesHist}
              answerLength={answerLength}
              barLabel="Guesses"
              minValue={1}
              userValue={userGameResult?.guesses}
            />
            <UserBarChart
              hist={hintsHist}
              answerLength={answerLength}
              barLabel="Hints"
              minValue={0}
              userValue={userGameResult?.hints}
            />
          </div>
        </>
      )}
    </dialog>
  );
});

// Build histograms
function buildHistogram(arr: number[]) {
  const hist: Record<number, number> = {};
  arr.forEach((val) => {
    hist[val] = (hist[val] || 0) + 1;
  });
  return hist;
}
