import { useState, useEffect } from "react";
import { formatTimeInSeconds } from "./formatTimeInSeconds";
import styles from "./Header.module.scss";
import { InfoPopup } from "./InfoPopup";
import classNames from "classnames";

export function Header({
  timerInSeconds,
  className,
  gameIndex,
  onSelectGame,
  maxGameIndex = 19,
  onHint,
  hintDisabled,
  hintAriaLabel = "Reveal a letter (costs +30s)",
}: {
  timerInSeconds: number;
  className?: string;
  gameIndex: number;
  onSelectGame: (index: number) => void;
  maxGameIndex?: number;
  onHint?: () => void;
  hintDisabled?: boolean;
  hintAriaLabel?: string;
}) {
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { minutes, seconds } = formatTimeInSeconds(timerInSeconds);

  // Close dropdown on outside click
  useEffect(() => {
    if (!dropdownOpen) return;
    function handleClick() {
      setDropdownOpen(false);
    }
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, [dropdownOpen]);

  // Prevent dropdown from closing when clicking the button
  function handleGameNumberClick(e: React.MouseEvent) {
    e.stopPropagation();
    setDropdownOpen((open) => !open);
  }

  function handleSelectGame(idx: number) {
    setDropdownOpen(false);
    if (idx !== gameIndex) {
      onSelectGame(idx);
    }
  }

  return (
    <>
      <div className={classNames(styles.headerContainer, className)}>
        <div className={styles.left}>
          <span className={styles.leftDropdownWrapper}>
            <button
              className={styles.gameNumberButton}
              onClick={handleGameNumberClick}
              aria-label="Select game number"
            >
              Inkling {gameIndex + 1}
              <span className={styles.gameNumberButtonDropdownIcon}>▼</span>
            </button>
            {dropdownOpen && (
              <div
                className={styles.dropdownMenu}
                onClick={(e) => e.stopPropagation()}
              >
                {[...Array(maxGameIndex).keys()].map((idx) => (
                  <div
                    key={idx}
                    className={
                      idx === gameIndex
                        ? `${styles.dropdownMenuItem} ${styles.dropdownMenuItemActive}`
                        : styles.dropdownMenuItem
                    }
                    onClick={() => handleSelectGame(idx)}
                  >
                    Game {idx + 1}
                  </div>
                ))}
              </div>
            )}
          </span>
        </div>
        <div className={styles.center}>
          <div className={styles.timer}>
            <div>{minutes}</div>
            <div>:</div>
            <div>{seconds}</div>
          </div>
        </div>
        <div className={styles.right}>
          {onHint && (
            <button
              className={styles.hintButton}
              type="button"
              aria-label={hintAriaLabel}
              onClick={onHint}
              disabled={hintDisabled}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#fff"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="3" />
                <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
              </svg>
            </button>
          )}
          <button
            className={styles.infoButton}
            onClick={() => setIsInfoOpen(true)}
          >
            i
          </button>
        </div>
      </div>
      <InfoPopup isOpen={isInfoOpen} close={() => setIsInfoOpen(false)} />
    </>
  );
}
