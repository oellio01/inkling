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
import {
  IconPencil,
  IconShare,
  IconShirt,
  IconStar,
  IconStarFilled,
} from "@tabler/icons-react";

import supabase from "../lib/supabase";
import styles from "./GameStats.module.scss";
import { formatTimeInSeconds } from "../lib/time";
import { useShareResult } from "../hooks/useShareResult";
import { useUser } from "../providers/UserProvider";
import { GAMES } from "../data/games";
import { EPOCH_DATE, getTodaysGameIndex } from "../lib/gameDate";
import { Popup } from "./ui/Popup";

const SHOP_URL = "https://inkling-puzzle.printify.me/";
const MAX_RATING = 5;
const MIN_WORD_LENGTH = 2;
const MAX_WORD_LENGTH = 50;
const MIN_DESCRIPTION_LENGTH = 3;
const MAX_DESCRIPTION_LENGTH = 500;

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
  averageTime: number;
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
  const averageTime =
    validTimes.length > 0
      ? Math.round(validTimes.reduce((sum, value) => sum + value, 0) / validTimes.length)
      : 0;

  return {
    gamesCompleted,
    totalGames: totalReleased,
    percentWithoutHints:
      gamesCompleted > 0
        ? Math.round((gamesWithoutHints / gamesCompleted) * 100)
        : 0,
    fastestTime: validTimes.length > 0 ? Math.min(...validTimes) : 0,
    averageTime,
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

function StatsFooterActions({ gameNumber }: { gameNumber: number }) {
  return (
    <div className={styles.actions}>
      <RatingForm key={`rating-${gameNumber}`} gameNumber={gameNumber} />
      <SuggestForm key={`suggest-${gameNumber}`} />
      <a
        className={classNames(styles.actionButton, styles.shopButton)}
        href={SHOP_URL}
        target="_blank"
        rel="noopener noreferrer"
      >
        <IconShirt size={18} />
        <span>Shop Inkling swag</span>
      </a>
    </div>
  );
}

function RatingForm({ gameNumber }: { gameNumber: number }) {
  const { user } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const [rating, setRating] = useState<number | null>(null);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!rating) return;

      setSubmitting(true);
      setError(null);

      const { error: insertError } = await supabase
        .from("game_rating")
        .insert([{ game_id: gameNumber, rating, comment, user_id: user?.id }])
        .select();

      setSubmitting(false);
      if (insertError) {
        setError(insertError.message);
        return;
      }
      setSubmitted(true);
    },
    [rating, comment, gameNumber, user?.id]
  );

  if (submitted) {
    return (
      <div className={styles.thankYouMessage}>
        <div className={styles.thankYouText}>
          Thanks so much for your feedback! I really appreciate it.
        </div>
      </div>
    );
  }

  if (!isOpen) {
    return (
      <button
        type="button"
        className={classNames(styles.actionButton, styles.rateButton)}
        onClick={() => setIsOpen(true)}
      >
        <IconStar size={18} />
        <span>Rate Inkling {gameNumber}</span>
      </button>
    );
  }

  const displayedRating = hoverRating ?? rating ?? 0;
  const canSubmit = Boolean(rating) && !submitting;

  return (
    <form onSubmit={handleSubmit} className={styles.ratingForm} method="dialog">
      <div className={styles.ratingLabel}>
        What did you think of Inkling {gameNumber}?
      </div>
      <div className={styles.starsRow}>
        {Array.from({ length: MAX_RATING }, (_, i) => i + 1).map((star) => {
          const StarIcon = displayedRating >= star ? IconStarFilled : IconStar;
          return (
            <button
              key={star}
              type="button"
              className={styles.starButton}
              aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(null)}
            >
              <StarIcon size={28} color="#FFD700" />
            </button>
          );
        })}
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="I'd love to hear your thoughts or suggestions!"
        disabled={submitting}
        className={styles.feedbackTextarea}
      />
      <button
        type="submit"
        className={classNames(styles.actionButton, canSubmit && styles.primaryButton)}
        disabled={!canSubmit}
      >
        {submitting ? "Sending..." : "Send Feedback"}
      </button>
      {error && <div className={styles.ratingError}>{error}</div>}
    </form>
  );
}

function SuggestForm() {
  const { user } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const [word, setWord] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit =
    !submitting &&
    word.length >= MIN_WORD_LENGTH &&
    description.length >= MIN_DESCRIPTION_LENGTH;

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!canSubmit) return;

      setSubmitting(true);
      setError(null);

      const { error: insertError } = await supabase
        .from("game_suggestion")
        .insert([{ suggested_word: word, description, user_id: user?.id }]);

      setSubmitting(false);
      if (insertError) {
        setError(insertError.message);
        return;
      }
      setSubmitted(true);
    },
    [word, description, user?.id, canSubmit]
  );

  if (submitted) {
    return (
      <div className={styles.thankYouMessage}>
        <div className={styles.thankYouText}>
          Thanks for the suggestion! I&apos;ll take a look.
        </div>
      </div>
    );
  }

  if (!isOpen) {
    return (
      <button
        type="button"
        className={classNames(styles.actionButton, styles.suggestButton)}
        onClick={() => setIsOpen(true)}
      >
        <IconPencil size={18} />
        <span>Suggest an Inkling</span>
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={styles.ratingForm} method="dialog">
      <div className={styles.ratingLabel}>Suggest an Inkling</div>
      <input
        type="text"
        value={word}
        onChange={(e) => setWord(e.target.value)}
        placeholder="Suggested word (e.g. CENTURY)"
        required
        minLength={MIN_WORD_LENGTH}
        maxLength={MAX_WORD_LENGTH}
        disabled={submitting}
        className={styles.suggestInput}
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="How should it be drawn..."
        required
        minLength={MIN_DESCRIPTION_LENGTH}
        maxLength={MAX_DESCRIPTION_LENGTH}
        disabled={submitting}
        className={styles.feedbackTextarea}
      />
      <button
        type="submit"
        className={classNames(styles.actionButton, canSubmit && styles.primaryButton)}
        disabled={!canSubmit}
      >
        {submitting ? "Submitting..." : "Submit suggestion"}
      </button>
      {error && <div className={styles.ratingError}>{error}</div>}
    </form>
  );
}

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
    <Popup
      onClose={() => onClose()}
      ariaLabel={`Inkling ${gameId} stats`}
      size="lg"
      onBack={showBackButton ? () => onClose("back") : undefined}
      className={styles.popupContent}
    >
      <>
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
                    label="Average time"
                    value={formatTimeDisplay(userStats.averageTime)}
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
                <div className={styles.yourResultSection}>
                  <h4 className={styles.subSectionTitle}>Your result</h4>
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
                  <div className={styles.shareAction}>
                    <button
                      className={styles.shareButton}
                      onClick={handleShare}
                      aria-label="Share your result for this game"
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
                  </div>
                </div>
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
            <section className={styles.postGameActionsSection}>
              <StatsFooterActions gameNumber={gameId} />
            </section>
          </>
        )}
      </>
    </Popup>
  );
});
