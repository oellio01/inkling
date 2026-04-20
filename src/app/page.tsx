"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Header } from "../components/Header";
import { Keyboard } from "../components/Keyboard";
import { GuessDisplay } from "../components/GuessDisplay";
import { InfoPopup } from "../components/InfoPopup";
import { ArchivePopup } from "../components/ArchivePopup";
import { ResultsPopup } from "../components/ResultsPopup";
import { GameStats } from "../components/GameStats";
import { getTodaysGameIndex } from "../lib/gameDate";
import { useGameTimer } from "../hooks/useGameTimer";
import { GAMES } from "../data/games";
import styles from "./Game.module.scss";
import { useUser } from "../providers/UserProvider";
import supabase from "../lib/supabase";

type ActivePopup = "info" | "archive" | "stats" | "results" | null;

interface ResultsData {
  gameNumber: number;
  timeInSeconds: number;
  guessCount: number;
  hintCount: number;
}

const normalizeText = (text: string): string =>
  text.replaceAll(" ", "").toLowerCase();

export default function Game() {
  const [gameIndex, setGameIndex] = useState(getTodaysGameIndex);
  const game = GAMES[gameIndex];
  const { user, firstTimeUser } = useUser();
  const [isDone, setIsDone] = useState(false);
  const [currentGuess, setCurrentGuess] = useState("");
  const [hintCount, setHintCount] = useState(0);
  const [guessCount, setGuessCount] = useState(0);
  const [showLetterFeedback, setShowLetterFeedback] = useState(false);

  const [activePopup, setActivePopup] = useState<ActivePopup>(
    firstTimeUser ? "info" : null
  );
  const [cameFromResults, setCameFromResults] = useState(false);
  const [resultsData, setResultsData] = useState<ResultsData | null>(null);

  // Auto-open the info popup the very first time the anon user is created.
  useEffect(() => {
    if (firstTimeUser) setActivePopup("info");
  }, [firstTimeUser]);

  const gameAnswer = game?.answer.replaceAll(" ", "") ?? "";
  const isPausedByPopup = activePopup !== null;
  const isPaused = isDone || isPausedByPopup;

  const { timeInSeconds, timeRef, resetTimer, addTime } = useGameTimer(
    gameIndex,
    isPaused
  );

  const maxGameIndex = useMemo(
    () => Math.min(getTodaysGameIndex() + 1, GAMES.length),
    []
  );

  const isCorrectSolution = useCallback(
    (guess: string) => {
      if (!game) return false;
      return normalizeText(guess) === normalizeText(game.answer);
    },
    [game]
  );

  const getLetterStatus = useCallback(
    (letterIndex: number): "normal" | "correct" | "incorrect" => {
      if (!game || !showLetterFeedback) return "normal";

      const answer = normalizeText(game.answer);
      const guessLetters = normalizeText(currentGuess);

      if (letterIndex >= guessLetters.length) return "normal";

      return guessLetters[letterIndex] === answer[letterIndex]
        ? "correct"
        : "incorrect";
    },
    [game, showLetterFeedback, currentGuess]
  );

  const onPressLetter = useCallback(
    (letter: string) => {
      setCurrentGuess((prev) => {
        if (!game) return prev;
        const safePrefix = prev.slice(0, hintCount);
        const rest = prev.slice(hintCount);
        if (safePrefix.length < hintCount) {
          return gameAnswer.slice(0, hintCount) + letter;
        }
        if (safePrefix.length + rest.length < gameAnswer.length) {
          return safePrefix + rest + letter;
        }
        return prev;
      });
    },
    [game, hintCount, gameAnswer]
  );

  const onPressBackspace = useCallback(() => {
    setCurrentGuess((prev) => {
      if (prev.length > hintCount) {
        return prev.slice(0, -1);
      }
      return prev;
    });
  }, [hintCount]);

  const commitGuess = useCallback(async () => {
    if (isDone || isPaused) return;
    const newCount = guessCount + 1;

    if (isCorrectSolution(currentGuess)) {
      setGuessCount(newCount);
      setIsDone(true);
      setResultsData({
        gameNumber: game.id,
        timeInSeconds: timeRef.current,
        guessCount: newCount,
        hintCount,
      });
      setActivePopup("results");

      supabase
        .from("game_results")
        .insert([
          {
            game_id: game.id,
            user_id: user ? user.id : null,
            time_seconds: timeRef.current,
            guesses: newCount,
            hints: hintCount,
          },
        ])
        .then(({ error }) => {
          if (error) {
            console.log("Game result insert error:", error.message);
          }
        });
    } else {
      setGuessCount(newCount);
      setShowLetterFeedback(true);
      setTimeout(() => {
        setShowLetterFeedback(false);
      }, 1000);
    }
  }, [
    isDone,
    isPaused,
    isCorrectSolution,
    currentGuess,
    guessCount,
    game,
    timeRef,
    hintCount,
    user,
  ]);

  const onHint = useCallback(() => {
    if (!game) return;
    if (hintCount < gameAnswer.length) {
      addTime(30);
      const newHintCount = hintCount + 1;
      setCurrentGuess(gameAnswer.slice(0, newHintCount).toUpperCase());
      setHintCount(newHintCount);
    }
  }, [game, hintCount, gameAnswer, addTime]);

  useEffect(() => {
    if (isDone) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (isPaused) return;
      const key = event.key;
      if (/^[a-zA-Z]$/.test(key)) {
        onPressLetter(key.toUpperCase());
      } else if (key === "Backspace") {
        onPressBackspace();
      } else if (key === "Enter") {
        commitGuess();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isDone, onPressLetter, onPressBackspace, commitGuess, isPaused]);

  const handleSelectGame = useCallback(
    (newIndex: number) => {
      setGameIndex(newIndex);
      setIsDone(false);
      setCurrentGuess("");
      resetTimer();
      setHintCount(0);
      setGuessCount(0);
      setShowLetterFeedback(false);
    },
    [resetTimer]
  );

  const handleCloseResults = useCallback(() => setActivePopup(null), []);
  const handleCloseInfo = useCallback(() => setActivePopup(null), []);
  const handleCloseArchive = useCallback(() => setActivePopup(null), []);

  const handleOpenArchive = useCallback(() => setActivePopup("archive"), []);
  const handleOpenInfo = useCallback(() => setActivePopup("info"), []);

  const handleOpenStats = useCallback(() => {
    setCameFromResults(false);
    setActivePopup("stats");
  }, []);

  const handleShowStatsFromResults = useCallback(() => {
    setCameFromResults(true);
    setActivePopup("stats");
  }, []);

  const handleCloseGameStats = useCallback(
    (reason?: "back") => {
      if (reason === "back" && cameFromResults) {
        setActivePopup("results");
      } else {
        setActivePopup(null);
      }
      setCameFromResults(false);
    },
    [cameFromResults]
  );

  if (!game) {
    return (
      <div className={styles.game}>
        <p>Come back tomorrow for a new puzzle!</p>
      </div>
    );
  }

  return (
    <div className={styles.game}>
      <Header
        timerInSeconds={timeInSeconds}
        className={styles.header}
        gameIndex={game.id}
        onOpenArchive={handleOpenArchive}
        onOpenInfo={handleOpenInfo}
        onOpenStats={handleOpenStats}
        onHint={onHint}
        hintDisabled={hintCount >= gameAnswer.length}
      />
      <div className={styles.imageWrapper}>
        <Image
          src={game.image}
          alt="inkling"
          fill
          sizes="(max-width: 600px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className={styles.image}
        />
      </div>
      <GuessDisplay
        isDone={isDone}
        answer={game.answer}
        gameAnswer={gameAnswer}
        currentGuess={currentGuess}
        hintCount={hintCount}
        getLetterStatus={getLetterStatus}
      />
      <Keyboard
        onPressLetter={onPressLetter}
        onPressBackspace={onPressBackspace}
        onPressEnter={commitGuess}
        className={styles.keyboard}
      />

      {activePopup === "info" && <InfoPopup close={handleCloseInfo} />}
      {activePopup === "archive" && (
        <ArchivePopup
          close={handleCloseArchive}
          currentGameIndex={game.id - 1}
          maxGameIndex={maxGameIndex}
          onSelectGame={handleSelectGame}
        />
      )}
      {activePopup === "results" && resultsData && (
        <ResultsPopup
          close={handleCloseResults}
          gameNumber={resultsData.gameNumber}
          timeInSeconds={resultsData.timeInSeconds}
          guessCount={resultsData.guessCount}
          hintCount={resultsData.hintCount}
          onShowStats={handleShowStatsFromResults}
        />
      )}
      {activePopup === "stats" && (
        <GameStats
          gameId={game.id}
          answerLength={gameAnswer.length}
          showBackButton={cameFromResults}
          onClose={handleCloseGameStats}
          onSelectGame={handleSelectGame}
        />
      )}
    </div>
  );
}
