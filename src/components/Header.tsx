import { useState, useCallback } from "react";
import React from "react";
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

export const Header = React.memo(function Header({
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

  const handleArchiveClick = useCallback(() => {
    setIsArchiveOpen(true);
  }, []);

  const handleSuggestClick = useCallback(() => {
    setIsSuggestOpen(true);
  }, [setIsSuggestOpen]);

  const handleInfoClick = useCallback(() => {
    setIsInfoOpen(true);
  }, [setIsInfoOpen]);

  const handleCloseInfo = useCallback(() => {
    setIsInfoOpen(false);
  }, [setIsInfoOpen]);

  const handleCloseSuggest = useCallback(() => {
    setIsSuggestOpen(false);
  }, [setIsSuggestOpen]);

  const handleCloseArchive = useCallback(() => {
    setIsArchiveOpen(false);
  }, [setIsArchiveOpen]);

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
            onClick={handleSuggestClick}
            aria-label="Suggest an Inkling"
            type="button"
          >
            <IconBulb size={22} color="#333" stroke={2} />
          </button>
          <button className={styles.headerButton} onClick={handleInfoClick}>
            <IconInfoCircle size={22} color="#333" stroke={2} />
          </button>
        </div>
      </div>
      <InfoPopup isOpen={isInfoOpen} close={handleCloseInfo} />
      <SuggestPopup isOpen={isSuggestOpen} close={handleCloseSuggest} />
      <ArchivePopup
        isOpen={isArchiveOpen}
        close={handleCloseArchive}
        currentGameIndex={gameIndex - 1}
        maxGameIndex={maxGameIndex}
        onSelectGame={onSelectGame}
      />
    </>
  );
});
