import React from "react";
import { formatTimeInSeconds } from "../lib/time";
import styles from "./Header.module.scss";
import classNames from "classnames";
import {
  IconInfoCircle,
  IconEye,
  IconChartBar,
  IconShirt,
} from "@tabler/icons-react";

export interface HeaderProps {
  timerInSeconds: number;
  className?: string;
  gameIndex: number;
  onOpenArchive: () => void;
  onOpenStats: () => void;
  onOpenInfo: () => void;
  onHint: () => void;
  hintDisabled?: boolean;
}

export const Header = React.memo(function Header({
  timerInSeconds,
  className,
  gameIndex,
  onOpenArchive,
  onOpenStats,
  onOpenInfo,
  onHint,
  hintDisabled,
}: HeaderProps) {
  const { minutes, seconds } = formatTimeInSeconds(timerInSeconds);

  return (
    <div className={classNames(styles.headerContainer, className)}>
      <div className={styles.left}>
        <button
          className={styles.gameNumberButton}
          onClick={onOpenArchive}
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
          aria-label="Reveal a letter (costs +30s)"
          onClick={onHint}
          disabled={hintDisabled}
        >
          <IconEye size={24} color="#333" stroke={2} />
        </button>
        <button
          className={styles.headerButton}
          type="button"
          onClick={onOpenStats}
          aria-label="View today's stats"
        >
          <IconChartBar size={24} color="#333" stroke={2} />
        </button>
        <a
          className={styles.headerButton}
          href="https://inkling-puzzle.printify.me/"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Shop"
        >
          <IconShirt size={18} color="#333" stroke={2} />
        </a>
        <button
          className={styles.headerButton}
          onClick={onOpenInfo}
          aria-label="How to play"
        >
          <IconInfoCircle size={22} color="#333" stroke={2} />
        </button>
      </div>
    </div>
  );
});
