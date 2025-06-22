import { useState, useEffect, useRef } from "react";
import styles from "./ResultsPopup.module.scss";
import { formatTimeInSeconds } from "./formatTimeInSeconds";
import classNames from "classnames";

export interface ResultsPopupProps {
  isOpen: boolean;
  close: () => void;
  gameNumber: number;
  timeInSeconds: number;
}

export function ResultsPopup({
  isOpen,
  close,
  gameNumber,
  timeInSeconds,
}: ResultsPopupProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [hasCopied, setHasCopied] = useState(false);
  const { minutes, seconds } = formatTimeInSeconds(timeInSeconds);

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
    const shareText = `Inkling #${gameNumber} - ${minutes}:${seconds}\n${url}`;
    navigator.clipboard.writeText(shareText).then(() => {
      setHasCopied(true);
    });
  };

  const handleClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target === dialogRef.current) {
      close();
    }
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
      </div>

      <button
        className={classNames(styles.button, styles.share_button)}
        onClick={handleShare}
      >
        {hasCopied ? "Copied!" : "Share"}
      </button>
    </dialog>
  );
}
