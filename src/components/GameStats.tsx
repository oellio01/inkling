import { useEffect, useState, useRef } from "react";
import supabase from "../app/supabaseClient";
import styles from "./GameStats.module.scss";
import classNames from "classnames";
import { BarChart } from "@mui/x-charts/BarChart";
import React from "react";
import { formatTimeInSeconds } from "./formatTimeInSeconds";

interface GameStatsProps {
  gameId: number;
  answerLength: number;
  timeInSeconds: number;
  onClose: (reason?: "back") => void;
  showBackButton?: boolean;
}

interface GameResult {
  time_seconds: number;
  guesses: number;
  hints: number;
}

interface UserBarChartProps {
  hist: Record<number, number>;
  answerLength: number;
  barLabel: string;
  minValue?: number;
}

function UserBarChart({
  hist,
  answerLength,
  barLabel,
  minValue = 0,
}: UserBarChartProps) {
  const min = minValue;
  const max = answerLength;
  const xLabels = Array.from({ length: max - min + 1 }, (_, i) =>
    (min + i).toString()
  );
  // Build dataset without color property
  const dataset = xLabels.map((val) => ({
    label: val,
    value: hist[Number(val)] || 0,
  }));
  return (
    <div className={styles.barChart}>
      <BarChart
        xAxis={[{ data: xLabels, label: barLabel }]}
        yAxis={[
          {
            label: undefined, // No label
            tickSize: 0, // Hide ticks
          },
        ]}
        dataset={dataset}
        series={[{ dataKey: "value" }]}
        height={200}
        margin={{ left: -20, bottom: 0 }}
        borderRadius={8}
        slots={{ legend: () => null, tooltip: () => null }}
      />
    </div>
  );
}

export function GameStats({
  gameId,
  answerLength,
  onClose,
  showBackButton = false,
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

  const fastestFormatted = formatTimeInSeconds(fastest);
  const averageFormatted = formatTimeInSeconds(average);
  const guessesHist = buildHistogram(results.map((r) => r.guesses));
  const hintsHist = buildHistogram(results.map((r) => r.hints));

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
          <h2>Inkling {gameId}</h2>
          <div className={styles.statsRow}>
            <div className={styles.statsCard}>
              <div className={styles.statsLabel}>Fastest</div>
              <div className={styles.statsValue}>
                {fastestFormatted.minutes}:{fastestFormatted.seconds}
              </div>
            </div>
            <div className={styles.statsCard}>
              <div className={styles.statsLabel}>Average</div>
              <div className={styles.statsValue}>
                {averageFormatted.minutes}:{averageFormatted.seconds}
              </div>
            </div>
          </div>
          <UserBarChart
            hist={guessesHist}
            answerLength={answerLength}
            barLabel="Guesses"
            minValue={1}
          />
          <UserBarChart
            hist={hintsHist}
            answerLength={answerLength}
            barLabel="Hints"
            minValue={0}
          />
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
