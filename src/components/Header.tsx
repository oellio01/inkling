import { useState } from "react";
import { formatTimeInSeconds } from "./formatTimeInSeconds";
import styles from "./Header.module.scss";
import { InfoPopup } from "./InfoPopup";
import { ArchivePopup } from "./ArchivePopup";
import classNames from "classnames";
import { SuggestPopup } from "./SuggestPopup";
import {
  IconBulb,
  IconInfoCircle,
  IconEye,
  IconChartBar,
} from "@tabler/icons-react";

export function Header({
  timerInSeconds,
  className,
  gameIndex,
  onSelectGame,
  maxGameIndex = 19,
  onHint,
  hintDisabled,
  hintAriaLabel = "Reveal a letter (costs +30s)",
  isSuggestOpen,
  setIsSuggestOpen,
  onShowStats,
  isInfoOpen,
  setIsInfoOpen,
}: {
  timerInSeconds: number;
  className?: string;
  gameIndex: number;
  onSelectGame: (index: number) => void;
  maxGameIndex?: number;
  onHint?: () => void;
  hintDisabled?: boolean;
  hintAriaLabel?: string;
  isSuggestOpen: boolean;
  setIsSuggestOpen: (open: boolean) => void;
  onShowStats: () => void;
  isInfoOpen: boolean;
  setIsInfoOpen: (open: boolean) => void;
}) {
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);
  const { minutes, seconds } = formatTimeInSeconds(timerInSeconds);

  function handleArchiveClick() {
    setIsArchiveOpen(true);
  }

  return (
    <>
      <div className={classNames(styles.headerContainer, className)}>
        <div className={styles.left}>
          <button
            className={styles.gameNumberButton}
            onClick={handleArchiveClick}
            aria-label="Open game archive"
          >
            Inkling {gameIndex}
            <span className={styles.gameNumberButtonDropdownIcon}>▼</span>
          </button>
        </div>
        <div className={styles.center}>
          <div className={styles.timer}>
            <div>{minutes}</div>
            <div>:</div>
            <div>{seconds}</div>
          </div>
        </div>
        <div className={styles.right}>
          <button
            className={styles.headerButton}
            type="button"
            aria-label={hintAriaLabel}
            onClick={onHint}
            disabled={hintDisabled}
          >
            <IconEye size={24} color="#333" stroke={2} />
          </button>
          <button
            className={styles.headerButton}
            type="button"
            onClick={onShowStats}
            aria-label="View today's stats"
          >
            <IconChartBar size={24} color="#333" stroke={2} />
          </button>
          <button
            className={styles.headerButton}
            onClick={() => setIsSuggestOpen(true)}
            aria-label="Suggest an Inkling"
            type="button"
          >
            <IconBulb size={22} color="#333" stroke={2} />
          </button>
          <button
            className={styles.headerButton}
            onClick={() => setIsInfoOpen(true)}
          >
            <IconInfoCircle size={22} color="#333" stroke={2} />
          </button>
        </div>
      </div>
      <InfoPopup isOpen={isInfoOpen} close={() => setIsInfoOpen(false)} />
      <SuggestPopup
        isOpen={isSuggestOpen}
        close={() => setIsSuggestOpen(false)}
      />
      <ArchivePopup
        isOpen={isArchiveOpen}
        close={() => setIsArchiveOpen(false)}
        currentGameIndex={gameIndex - 1}
        maxGameIndex={maxGameIndex}
        onSelectGame={onSelectGame}
      />
    </>
  );
}
