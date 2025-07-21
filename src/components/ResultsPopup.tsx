import { useState, useEffect, useRef } from "react";
import styles from "./ResultsPopup.module.scss";
import { formatTimeInSeconds } from "./formatTimeInSeconds";
import classNames from "classnames";
import { IconStar, IconStarFilled } from "@tabler/icons-react";
import supabase from "../app/supabaseClient";
import { useUser } from "../providers/UserProvider";

export interface ResultsPopupProps {
  isOpen: boolean;
  close: () => void;
  gameNumber: number;
  timeInSeconds: number;
  guessCount: number;
  hintCount: number;
  onShowStats: () => void;
}

export function ResultsPopup({
  isOpen,
  close,
  gameNumber,
  timeInSeconds,
  guessCount,
  hintCount,
  onShowStats,
}: ResultsPopupProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [hasCopied, setHasCopied] = useState(false);
  const { minutes, seconds } = formatTimeInSeconds(timeInSeconds);
  const [rating, setRating] = useState<number | null>(null);
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useUser();

  useEffect(() => {
    setRating(null);
    setHoverRating(null);
    setComment("");
    setSubmitted(false);
    setError(null);
  }, [gameNumber]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog) {
      if (isOpen) {
        dialog.showModal();
      } else {
        dialog.close();
        setHasCopied(false); // Reset copy status on close
      }
    }
  }, [isOpen]);

  useEffect(() => {
    const dialog = dialogRef.current;
    dialog?.addEventListener("close", close);
    return () => {
      dialog?.removeEventListener("close", close);
    };
  }, [close]);

  const handleShare = () => {
    const url = window.location.href;
    const shareText = `Inkling #${gameNumber} - ${minutes}:${seconds} - ${guessCount} guesses - ${hintCount} hints\n${url}`;
    navigator.clipboard.writeText(shareText).then(() => {
      setHasCopied(true);
    });
  };

  const handleClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (dialogRef.current && e.target === dialogRef.current) {
      close();
    }
  };

  const handleSubmitRating = async (e: React.FormEvent) => {
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
  };

  return (
    <dialog ref={dialogRef} className={styles.popup} onClick={handleClick}>
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
        className={classNames(styles.button, styles.share_button)}
        onClick={handleShare}
      >
        {hasCopied ? "Copied!" : "Share"}
      </button>
      <hr className={styles.divider} />
      <button
        className={classNames(styles.button, styles.stats_button)}
        onClick={onShowStats}
      >
        {"View today's stats"}
      </button>
      <hr className={styles.divider} />
      <form
        onSubmit={handleSubmitRating}
        className={styles.ratingForm}
        method="dialog"
      >
        <div className={styles.ratingLabel}>How was today&apos;s inkling?</div>
        <div className={styles.starsRow}>
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              className={styles.starButton}
              aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
              disabled={submitted}
              onClick={() => !submitted && setRating(star)}
              onMouseEnter={() => !submitted && setHoverRating(star)}
              onMouseLeave={() => !submitted && setHoverRating(null)}
            >
              {(hoverRating ?? rating ?? 0) >= star ? (
                <IconStarFilled size={28} color="#FFD700" />
              ) : (
                <IconStar size={28} color="#FFD700" />
              )}
            </button>
          ))}
        </div>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Thoughts..."
          disabled={submitting || submitted}
          className={styles.ratingTextarea}
        />
        <button
          type="submit"
          className={classNames(
            styles.button,
            rating && !submitting && !submitted
              ? styles.primary_button
              : undefined
          )}
          disabled={submitting || submitted || !rating}
        >
          {submitted
            ? "Thank you!"
            : submitting
            ? "Submitting..."
            : "Submit Rating"}
        </button>
        {error && <div className={styles.ratingError}>{error}</div>}
      </form>
    </dialog>
  );
}
