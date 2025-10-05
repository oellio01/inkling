import { useState, useEffect, useRef, useCallback } from "react";
import React from "react";
import styles from "./ResultsPopup.module.scss";
import { formatTimeInSeconds } from "./formatTimeInSeconds";
import classNames from "classnames";
import {
  IconStar,
  IconStarFilled,
  IconBrandTwitter,
  IconMessage,
  IconCopy,
  IconBrandWhatsapp,
} from "@tabler/icons-react";
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

export const ResultsPopup = React.memo(function ResultsPopup({
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
    setHasCopied(false);
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

  const createShareText = useCallback(() => {
    const url = window.location.href;
    return `Inkling #${gameNumber} - ${minutes}:${seconds} - ${guessCount} guesses - ${hintCount} hints\n${url}`;
  }, [gameNumber, minutes, seconds, guessCount, hintCount]);

  const handleCopyShare = useCallback(() => {
    const shareText = createShareText();
    navigator.clipboard.writeText(shareText).then(() => {
      setHasCopied(true);
      setTimeout(() => setHasCopied(false), 2000);
    });
  }, [createShareText]);

  const handleTwitterShare = useCallback(() => {
    const text = encodeURIComponent(
      `Inkling #${gameNumber} - ${minutes}:${seconds} - ${guessCount} guesses - ${hintCount} hints\n${window.location.href}`
    );
    const twitterUrl = `https://twitter.com/intent/tweet?text=${text}`;
    window.open(twitterUrl, "_blank", "width=550,height=420");
  }, [gameNumber, minutes, seconds, guessCount, hintCount]);

  const handleWhatsAppShare = useCallback(() => {
    const text = encodeURIComponent(
      `Inkling #${gameNumber} - ${minutes}:${seconds} - ${guessCount} guesses - ${hintCount} hints\n${window.location.href}`
    );
    const whatsappUrl = `https://wa.me/?text=${text}`;
    window.open(whatsappUrl, "_blank");
  }, [gameNumber, minutes, seconds, guessCount, hintCount]);

  const handleTextShare = useCallback(() => {
    const text = encodeURIComponent(
      `Inkling #${gameNumber} - ${minutes}:${seconds} - ${guessCount} guesses - ${hintCount} hints\n${window.location.href}`
    );
    const smsUrl = `sms:?body=${text}`;
    window.location.href = smsUrl;
  }, [gameNumber, minutes, seconds, guessCount, hintCount]);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDialogElement>) => {
      if (dialogRef.current && e.target === dialogRef.current) {
        close();
      }
    },
    [close]
  );

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
        className={classNames(styles.button, styles.stats_button)}
        onClick={onShowStats}
      >
        {"View today's stats"}
      </button>
      <hr className={styles.divider} />
      <div className={styles.personalMessage}>
        <p>
          Hi 👋 I&apos;m Owen. This game was inspired from countless late-night
          Pictionary games. I hope you are enjoying it! If you are, it would
          mean a lot if helped spread the word by sharing it with your friends!
        </p>
      </div>
      <div className={styles.shareSection}>
        <div className={styles.shareLabel}>Share your result</div>
        <div className={styles.shareButtons}>
          <button
            className={styles.shareIconButton}
            onClick={handleCopyShare}
            title="Copy to clipboard"
            aria-label="Copy share text to clipboard"
          >
            <IconCopy size={20} />
          </button>
          <button
            className={styles.shareIconButton}
            onClick={handleTwitterShare}
            title="Share on Twitter"
            aria-label="Share on Twitter"
          >
            <IconBrandTwitter size={20} />
          </button>
          <button
            className={styles.shareIconButton}
            onClick={handleWhatsAppShare}
            title="Share on WhatsApp"
            aria-label="Share on WhatsApp"
          >
            <IconBrandWhatsapp size={20} />
          </button>
          <button
            className={styles.shareIconButton}
            onClick={handleTextShare}
            title="Share via Text"
            aria-label="Share via text message"
          >
            <IconMessage size={20} />
          </button>
        </div>
        {hasCopied && (
          <div className={styles.copiedMessage}>Copied to clipboard!</div>
        )}
      </div>
      <hr className={styles.divider} />
      {submitted ? (
        <div className={styles.thankYouMessage}>
          <div className={styles.thankYouText}>
            Thank you for your feedback! 🎉
          </div>
        </div>
      ) : (
        <form
          onSubmit={handleSubmitRating}
          className={styles.ratingForm}
          method="dialog"
        >
          <div className={styles.ratingLabel}>
            How was today&apos;s inkling?
          </div>
          <div className={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className={styles.starButton}
                aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(null)}
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
            placeholder="Any suggestions?"
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
            {submitting ? "Submitting..." : "Submit Rating"}
          </button>
          {error && <div className={styles.ratingError}>{error}</div>}
        </form>
      )}
    </dialog>
  );
});
