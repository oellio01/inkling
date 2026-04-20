import React, { useCallback, useState } from "react";
import classNames from "classnames";
import {
  IconStar,
  IconStarFilled,
  IconShare,
  IconShirt,
  IconChartBar,
  IconPencil,
} from "@tabler/icons-react";

import styles from "./ResultsPopup.module.scss";
import { formatTimeInSeconds } from "../hooks/formatTimeInSeconds";
import { useCountdownToMidnight } from "../hooks/useCountdownToMidnight";
import { useShareResult } from "../hooks/useShareResult";
import supabase from "../app/supabaseClient";
import { useUser } from "../providers/UserProvider";

const SHOP_URL = "https://inkling-puzzle.printify.me/";

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
  const { user } = useUser();
  const { minutes, seconds } = formatTimeInSeconds(timeInSeconds);
  const timeUntilMidnight = useCountdownToMidnight();
  const { hasCopied, share } = useShareResult();

  const handleShare = useCallback(() => {
    share({
      gameId: gameNumber,
      timeInSeconds,
      guessCount,
      hintCount,
      userId: user?.id,
    });
  }, [share, gameNumber, timeInSeconds, guessCount, hintCount, user?.id]);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) close();
    },
    [close]
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
        <div className={styles.nextInklingLabel}>
          Next Inkling in {timeUntilMidnight}
        </div>

        <div className={styles.personalMessage}>
          <p>
            Hi 👋 I&apos;m Owen. This game was inspired from countless
            late-night Pictionary games. I hope you are enjoying it! If you are,
            it would mean a lot if helped spread the word by sharing it with
            your friends!
          </p>
        </div>

        <hr className={styles.divider} />

        <div className={styles.stats}>
          <StatItem value={gameNumber} label="Game" />
          <StatItem value={`${minutes}:${seconds}`} label="Time" />
          <StatItem value={guessCount} label="Guesses" />
          <StatItem value={hintCount} label="Hints" />
        </div>
        <div className={styles.shareSection}>
          <button
            className={styles.shareButton}
            onClick={handleShare}
            aria-label="Share your result"
            type="button"
          >
            <span>Share</span>
            <IconShare size={20} />
          </button>
          {hasCopied && (
            <div className={styles.copiedMessage}>Copied to clipboard!</div>
          )}
        </div>

        <hr className={styles.divider} />

        <button
          type="button"
          className={classNames(styles.button, styles.stats_button)}
          onClick={onShowStats}
        >
          <IconChartBar size={18} />
          <span>View today&apos;s stats</span>
        </button>

        <hr className={styles.divider} />

        {/* key={gameNumber} resets internal form state whenever the game changes. */}
        <RatingForm key={`rating-${gameNumber}`} gameNumber={gameNumber} />

        <hr className={styles.divider} />

        <SuggestForm key={`suggest-${gameNumber}`} />

        <hr className={styles.divider} />

        <a
          className={classNames(styles.button, styles.shop_button)}
          href={SHOP_URL}
          target="_blank"
          rel="noopener noreferrer"
        >
          <IconShirt size={18} />
          <span>Shop Inkling swag</span>
        </a>
      </div>
    </div>
  );
});

function StatItem({
  value,
  label,
}: {
  value: string | number;
  label: string;
}) {
  return (
    <div className={styles.statItem}>
      <div className={styles.statValue}>{value}</div>
      <div className={styles.statLabel}>{label}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Rate today's game                                                   */
/* ------------------------------------------------------------------ */

const MAX_RATING = 5;

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
        .insert([
          { game_id: gameNumber, rating, comment, user_id: user?.id },
        ])
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
          Thanks so much for your feedback! I really appreciate it 🎉
        </div>
      </div>
    );
  }

  if (!isOpen) {
    return (
      <button
        type="button"
        className={classNames(styles.button, styles.rate_button)}
        onClick={() => setIsOpen(true)}
      >
        <IconStar size={18} />
        <span>Rate today&apos;s game</span>
      </button>
    );
  }

  const displayedRating = hoverRating ?? rating ?? 0;
  const canSubmit = Boolean(rating) && !submitting;

  return (
    <form
      onSubmit={handleSubmit}
      className={styles.ratingForm}
      method="dialog"
    >
      <div className={styles.ratingLabel}>
        What did you think of today&apos;s inkling?
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
        className={styles.ratingTextarea}
      />
      <button
        type="submit"
        className={classNames(
          styles.button,
          canSubmit && styles.primary_button
        )}
        disabled={!canSubmit}
      >
        {submitting ? "Sending..." : "Send Feedback"}
      </button>
      {error && <div className={styles.ratingError}>{error}</div>}
    </form>
  );
}

/* ------------------------------------------------------------------ */
/* Suggest an Inkling                                                  */
/* ------------------------------------------------------------------ */

const MIN_WORD_LENGTH = 2;
const MAX_WORD_LENGTH = 50;
const MIN_DESCRIPTION_LENGTH = 3;
const MAX_DESCRIPTION_LENGTH = 500;

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
        .insert([
          {
            suggested_word: word,
            description,
            user_id: user?.id,
          },
        ]);

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
          Thanks for the suggestion! I&apos;ll take a look 🙌
        </div>
      </div>
    );
  }

  if (!isOpen) {
    return (
      <button
        type="button"
        className={classNames(styles.button, styles.suggest_button)}
        onClick={() => setIsOpen(true)}
      >
        <IconPencil size={18} />
        <span>Suggest an Inkling</span>
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={styles.ratingForm}
      method="dialog"
    >
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
        className={styles.ratingTextarea}
      />
      <button
        type="submit"
        className={classNames(
          styles.button,
          canSubmit && styles.primary_button
        )}
        disabled={!canSubmit}
      >
        {submitting ? "Submitting..." : "Submit suggestion"}
      </button>
      {error && <div className={styles.ratingError}>{error}</div>}
    </form>
  );
}
