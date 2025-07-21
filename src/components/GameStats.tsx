import { useEffect, useState, useRef } from "react";
import supabase from "../app/supabaseClient";
import styles from "./GameStats.module.scss";
import classNames from "classnames";

interface GameStatsProps {
  gameId: number;
  answerLength: number;
  timeInSeconds: number;
  guessCount: number;
  hintCount: number;
  onClose: (reason?: "back") => void;
}

interface GameResult {
  time_seconds: number;
  guesses: number;
  hints: number;
}

export function GameStats({
  gameId,
  answerLength,
  timeInSeconds,
  guessCount,
  hintCount,
  onClose,
}: GameStatsProps) {
  const [results, setResults] = useState<GameResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    supabase
      .from("game_results")
      .select("time_seconds,guesses,hints,user_id")
      .eq("game_id", gameId)
      .then(({ data, error }) => {
        if (error) setError(error.message);
        else setResults(data || []);
        setLoading(false);
      });
  }, [gameId]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog) dialog.showModal();
    return () => {
      if (dialog) dialog.close();
    };
  }, []);

  const handleClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (dialogRef.current && e.target === dialogRef.current) {
      onClose();
    }
  };

  // Calculate stats
  const times = results.map((r) => r.time_seconds).filter((t) => t > 0);
  const fastest = times.length ? Math.min(...times) : 0;
  const average = times.length
    ? Math.round(times.reduce((a, b) => a + b, 0) / times.length)
    : 0;

  const sorted = [...times].sort((a, b) => a - b);
  const rank = sorted.findIndex((t) => t === timeInSeconds) + 1;

  const guessesHist = buildHistogram(results.map((r) => r.guesses));
  const hintsHist = buildHistogram(results.map((r) => r.hints));

  return (
    <dialog ref={dialogRef} className={styles.popup} onClick={handleClick}>
      <button
        className={classNames(styles.button, styles.back_button)}
        onClick={() => onClose("back")}
      >
        Back
      </button>
      <h2 className={styles.statsTitle}>Game Stats</h2>
      {loading ? (
        <div>Loading...</div>
      ) : error ? (
        <div className={styles.ratingError}>{error}</div>
      ) : results.length === 0 ? (
        <div className={styles.noResultsMsg}>No results yet for this game.</div>
      ) : (
        <>
          <div className={styles.statsRow}>
            <div className={styles.statsCard}>
              <div className={styles.statsLabel}>Fastest</div>
              <div className={styles.statsValue}>{fastest} sec</div>
            </div>
            <div className={styles.statsCard}>
              <div className={styles.statsLabel}>Average</div>
              <div className={styles.statsValue}>{average} sec</div>
            </div>
            <div className={styles.statsCard}>
              <div className={styles.statsLabel}>Rank</div>
              <div className={styles.statsPercentile}>
                {rank}/{times.length}
              </div>
            </div>
          </div>

          <div className={styles.statsChartsWrapper}>
            <BarChart
              hist={guessesHist}
              label="Guesses"
              userValue={guessCount}
              maxValue={answerLength}
              minValue={1}
            />
            <BarChart
              hist={hintsHist}
              label="Hints"
              userValue={hintCount}
              maxValue={answerLength}
              minValue={0}
            />
          </div>
        </>
      )}
    </dialog>
  );
}

// Build histograms
function buildHistogram(arr: number[]) {
  const hist: Record<number, number> = {};
  arr.forEach((val) => {
    hist[val] = (hist[val] || 0) + 1;
  });
  return hist;
}

// Render a histogram bar chart with highlight for the user's bucket
function BarChart({
  hist,
  label,
  userValue,
  maxValue,
  minValue = 0,
}: {
  hist: Record<number, number>;
  label: string;
  userValue: number | null;
  maxValue: number;
  minValue?: number;
}) {
  const min = minValue;
  const max = maxValue;
  const maxCount = Math.max(...Object.values(hist), 1);
  return (
    <div className={styles.statsChartVertical}>
      <div className={styles.statsChartLabel}>{label}</div>
      <div className={styles.statsChartBarsVertical}>
        {Array.from({ length: max - min + 1 }, (_, i) => {
          const val = min + i;
          const count = hist[val] || 0;
          const isUser = userValue !== null && val === userValue;
          return (
            <div key={val} className={styles.statsChartBarCol}>
              <div
                className={
                  isUser
                    ? styles.statsChartBarVertical +
                      " " +
                      styles.statsChartBarUser
                    : styles.statsChartBarVertical
                }
                style={{ height: `${(count / maxCount) * 100}%` }}
              >
                {count > 0 && (
                  <span className={styles.statsChartBarCount}>{count}</span>
                )}
              </div>
              <div className={styles.statsChartBarLabelVertical}>{val}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
