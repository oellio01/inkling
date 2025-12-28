import { useState, useEffect, useCallback } from "react";
import React from "react";
import styles from "./ResultsPopup.module.scss";
import { formatTimeInSeconds } from "../hooks/formatTimeInSeconds";
import classNames from "classnames";
import { IconStar, IconStarFilled, IconShare } from "@tabler/icons-react";
import supabase from "../app/supabaseClient";
import { useUser } from "../providers/UserProvider";

const COPY_FEEDBACK_DURATION = 2000;

export interface ResultsPopupProps {
  close: () => void;
  gameNumber: number;
  timeInSeconds: number;
  guessCount: number;
  hintCount: number;
  onShowStats: () => void;
}

export const ResultsPopup = React.memo(function ResultsPopup({
  close,
  gameNumber,
  timeInSeconds,
  guessCount,
  hintCount,
  onShowStats,
}: ResultsPopupProps) {
  const [hasCopied, setHasCopied] = useState(false);
  const { minutes, seconds } = formatTimeInSeconds(timeInSeconds);
  const [rating, setRating] = useState<number | null>(null);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeUntilMidnight, setTimeUntilMidnight] = useState("");
  const { user } = useUser();

  // Reset state when game changes
  useEffect(() => {
    setRating(null);
    setHoverRating(null);
    setComment("");
    setSubmitted(false);
    setError(null);
    setHasCopied(false);
  }, [gameNumber]);

  // Countdown to midnight
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      const diff = Math.max(0, tomorrow.getTime() - now.getTime());
      const hours = Math.floor(diff / 3600000);
      const minutes = Math.floor((diff % 3600000) / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);

      const format = (n: number) => String(n).padStart(2, "0");
      setTimeUntilMidnight(
        `${format(hours)}:${format(minutes)}:${format(seconds)}`
      );
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleShare = useCallback(() => {
    const shareText = `Inkling #${gameNumber} - ${minutes}:${seconds} - ${guessCount} guesses - ${hintCount} hints\n${window.location.href}`;
    navigator.clipboard.writeText(shareText);
    setHasCopied(true);
    setTimeout(() => setHasCopied(false), COPY_FEEDBACK_DURATION);

    supabase
      .from("share_events")
      .insert([
        {
          game_id: gameNumber,
          user_id: user?.id || null,
          share_method: "copy",
        },
      ])
      .then(({ error }) => {
        if (error) console.log("Share event insert error:", error.message);
      });
  }, [gameNumber, guessCount, hintCount, minutes, seconds, user?.id]);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) close();
  };

  const handleSubmitRating = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!rating) {
        return;
      }
      setSubmitting(true);
      setError(null);
      const { error } = await supabase
        .from("game_rating")
        .insert([{ game_id: gameNumber, rating, comment, user_id: user?.id }])
        .select();
      setSubmitting(false);
      if (error) {
        setError(error.message);
        return;
      }
      setSubmitted(true);
    },
    [rating, comment, gameNumber, user?.id]
  );

  return (
    <div className={styles.backdrop} onClick={handleBackdropClick}>
      <div className={styles.popup}>
        <button
          className={styles.closeButton}
          onClick={close}
          aria-label="Close"
        >
          ×
        </button>
        <h2 className={styles.title}>You got it!</h2>

        <div className={styles.stats}>
          <div className={styles.statItem}>
            <div className={styles.statValue}>{gameNumber}</div>
            <div className={styles.statLabel}>Game</div>
          </div>
          <div className={styles.statItem}>
            <div className={styles.statValue}>
              {minutes}:{seconds}
            </div>
            <div className={styles.statLabel}>Time</div>
          </div>
          <div className={styles.statItem}>
            <div className={styles.statValue}>{guessCount}</div>
            <div className={styles.statLabel}>Guesses</div>
          </div>
          <div className={styles.statItem}>
            <div className={styles.statValue}>{hintCount}</div>
            <div className={styles.statLabel}>Hints</div>
          </div>
        </div>
        <button
          className={classNames(styles.button, styles.stats_button)}
          onClick={onShowStats}
        >
          View today&apos;s stats
        </button>
        <hr className={styles.divider} />
        <div className={styles.personalMessage}>
          <p>
            Hi 👋 I&apos;m Owen. This game was inspired from countless
            late-night Pictionary games. I hope you are enjoying it! If you are,
            it would mean a lot if helped spread the word by sharing it with
            your friends!
          </p>
        </div>
        <div className={styles.shareSection}>
          <div className={styles.nextInklingLabel}>
            Next Inkling in {timeUntilMidnight}
          </div>
          <button
            className={styles.shareButton}
            onClick={handleShare}
            aria-label="Share your result"
          >
            <span>Share</span>
            <IconShare size={20} />
          </button>
          {hasCopied && (
            <div className={styles.copiedMessage}>Copied to clipboard!</div>
          )}
        </div>
        <hr className={styles.divider} />
        {submitted ? (
          <div className={styles.thankYouMessage}>
            <div className={styles.thankYouText}>
              Thanks so much for your feedback! I really appreciate it 🎉
            </div>
          </div>
        ) : (
          <form
            onSubmit={handleSubmitRating}
            className={styles.ratingForm}
            method="dialog"
          >
            <div className={styles.ratingLabel}>
              What did you think of today&apos;s inkling?
            </div>
            <div className={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((star) => {
                const isFilled = (hoverRating ?? rating ?? 0) >= star;
                const StarIcon = isFilled ? IconStarFilled : IconStar;
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
              className={styles.ratingTextarea}
            />
            <button
              type="submit"
              className={classNames(
                styles.button,
                rating && !submitting ? styles.primary_button : undefined
              )}
              disabled={submitting || !rating}
            >
              {submitting ? "Sending..." : "Send Feedback"}
            </button>
            {error && <div className={styles.ratingError}>{error}</div>}
          </form>
        )}
      </div>
    </div>
  );
});
