import {
  useState,
  useCallback,
  useImperativeHandle,
  forwardRef,
  useEffect,
} from "react";
import React from "react";
import { formatTimeInSeconds } from "../hooks/formatTimeInSeconds";
import styles from "./Header.module.scss";
import { InfoPopup } from "./InfoPopup";
import { ArchivePopup } from "./ArchivePopup";
import classNames from "classnames";
import { SuggestPopup } from "./SuggestPopup";
import { GameStats } from "./GameStats";
import { ResultsPopup } from "./ResultsPopup";
import {
  IconBulb,
  IconInfoCircle,
  IconEye,
  IconChartBar,
} from "@tabler/icons-react";
import { getTodaysGameIndex } from "@/hooks/game-logic";
import { GAMES } from "../../public/game_data";
import { useUser } from "../providers/UserProvider";
import supabase from "../app/supabaseClient";

export interface HeaderRef {
  openStats: (fromResults?: boolean) => void;
  showResults: (
    gameNumber: number,
    timeInSeconds: number,
    guessCount: number,
    hintCount: number
  ) => void;
  openInfo: () => void;
}

export const Header = React.memo(
  forwardRef<
    HeaderRef,
    {
      timerInSeconds: number;
      className?: string;
      gameIndex: number;
      gameAnswerLength: number;
      onSelectGame: (index: number) => void;
      onHint?: () => void;
      hintDisabled?: boolean;
      onPausedChange?: (isPaused: boolean) => void;
    }
  >(function Header(
    {
      timerInSeconds,
      className,
      gameIndex,
      gameAnswerLength,
      onSelectGame,
      onHint,
      hintDisabled,
      onPausedChange,
    },
    ref
  ) {
    const [isArchiveOpen, setIsArchiveOpen] = useState(false);
    const [isSuggestOpen, setIsSuggestOpen] = useState(false);
    const [isInfoOpen, setIsInfoOpen] = useState(false);
    const [isTodaysStatsOpen, setIsTodaysStatsOpen] = useState(false);
    const [isResultsOpen, setIsResultsOpen] = useState(false);
    const [cameFromResults, setCameFromResults] = useState(false);
    const [resultsData, setResultsData] = useState<{
      gameNumber: number;
      timeInSeconds: number;
      guessCount: number;
      hintCount: number;
    } | null>(null);
    const { minutes, seconds } = formatTimeInSeconds(timerInSeconds);
    const maxGameIndex = Math.min(getTodaysGameIndex() + 1, GAMES.length);
    const { user } = useUser();

    // Notify parent whenever any popup state changes
    const anyPopupOpen =
      isArchiveOpen ||
      isSuggestOpen ||
      isInfoOpen ||
      isTodaysStatsOpen ||
      isResultsOpen;

    useEffect(() => {
      if (onPausedChange) {
        onPausedChange(anyPopupOpen);
      }
    }, [anyPopupOpen, onPausedChange]);

    useEffect(() => {
      const checkUserResults = async () => {
        if (!user) return;

        try {
          const { data, error } = await supabase
            .from("game_results")
            .select("id")
            .eq("user_id", user.id)
            .limit(1);

          if (error) {
            console.error("Error checking user results:", error);
            return;
          }

          // If no results found, show the info popup
          if (!data || data.length === 0) {
            setIsInfoOpen(true);
          }
        } catch (error) {
          console.error("Error checking user results:", error);
        }
      };
      checkUserResults();
    }, [user]);

    const handleArchiveClick = useCallback(() => {
      setIsArchiveOpen(true);
    }, []);

    const handleSuggestClick = useCallback(() => {
      setIsSuggestOpen(true);
    }, []);

    const handleInfoClick = useCallback(() => {
      setIsInfoOpen(true);
    }, []);

    const handleCloseInfo = useCallback(() => {
      setIsInfoOpen(false);
    }, []);

    const handleCloseSuggest = useCallback(() => {
      setIsSuggestOpen(false);
    }, []);

    const handleCloseArchive = useCallback(() => {
      setIsArchiveOpen(false);
    }, []);

    const handleShowStats = useCallback(() => {
      setIsTodaysStatsOpen(true);
      setCameFromResults(false);
    }, []);

    const handleCloseResults = useCallback(() => {
      setIsResultsOpen(false);
    }, []);

    const handleOnShowStats = useCallback(() => {
      setIsResultsOpen(false);
      setIsTodaysStatsOpen(true);
      setCameFromResults(true);
    }, []);

    const handleCloseGameStats = useCallback(
      (reason?: "back") => {
        setIsTodaysStatsOpen(false);

        if (reason === "back" && cameFromResults) {
          // Going back to results popup
          setIsResultsOpen(true);
        }

        setCameFromResults(false);
      },
      [cameFromResults]
    );

    // Expose methods to parent via ref
    useImperativeHandle(
      ref,
      () => ({
        openStats: (fromResults = false) => {
          setIsTodaysStatsOpen(true);
          setCameFromResults(fromResults);
        },
        showResults: (
          gameNumber: number,
          timeInSeconds: number,
          guessCount: number,
          hintCount: number
        ) => {
          setResultsData({ gameNumber, timeInSeconds, guessCount, hintCount });
          setIsResultsOpen(true);
        },
        openInfo: () => {
          setIsInfoOpen(true);
        },
      }),
      []
    );

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
              aria-label={"Reveal a letter (costs +30s)"}
              onClick={onHint}
              disabled={hintDisabled}
            >
              <IconEye size={24} color="#333" stroke={2} />
            </button>
            <button
              className={styles.headerButton}
              type="button"
              onClick={handleShowStats}
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
        {isInfoOpen ? <InfoPopup close={handleCloseInfo} /> : undefined}
        {isSuggestOpen ? (
          <SuggestPopup close={handleCloseSuggest} />
        ) : undefined}
        {isArchiveOpen ? (
          <ArchivePopup
            close={handleCloseArchive}
            currentGameIndex={gameIndex - 1}
            maxGameIndex={maxGameIndex ?? 0}
            onSelectGame={onSelectGame}
          />
        ) : undefined}
        {isResultsOpen && resultsData ? (
          <ResultsPopup
            close={handleCloseResults}
            gameNumber={resultsData.gameNumber}
            timeInSeconds={resultsData.timeInSeconds}
            guessCount={resultsData.guessCount}
            hintCount={resultsData.hintCount}
            onShowStats={handleOnShowStats}
          />
        ) : undefined}
        {isTodaysStatsOpen ? (
          <GameStats
            gameId={gameIndex}
            answerLength={gameAnswerLength}
            showBackButton={cameFromResults}
            onClose={handleCloseGameStats}
          />
        ) : undefined}
      </>
    );
  })
);
