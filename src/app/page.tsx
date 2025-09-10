"use client";

import { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import { Header } from "../components/Header";
import { Keyboard } from "../components/Keyboard";
import { ResultsPopup } from "../components/ResultsPopup";
import { SuggestPopup } from "../components/SuggestPopup";
import { getTodaysGameIndex } from "../hooks/game-logic";
import { usePersistentTimer } from "../hooks/usePersistentTimer";
import { GAMES } from "../../public/game_data";
import styles from "./Game.module.scss";
import { useUser } from "../providers/UserProvider";
import { GameStats } from "../components/GameStats";
import supabase from "./supabaseClient";

export default function Game() {
  const [gameIndex, setGameIndex] = useState(getTodaysGameIndex);
  const game = GAMES[gameIndex];
  const { user } = useUser();
  const [isDone, setIsDone] = useState(false);
  const [isResultsOpen, setIsResultsOpen] = useState(false);
  const [currentGuess, setCurrentGuess] = useState("");
  const [showIncorrect, setShowIncorrect] = useState(false);
  const [hintCount, setHintCount] = useState(0);
  const [guessCount, setGuessCount] = useState(0);
  const [isSuggestOpen, setIsSuggestOpen] = useState(false);
  const [isTodaysStatsOpen, setIsTodaysStatsOpen] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [cameFromResults, setCameFromResults] = useState(false);
  const [spaceIndexes, setSpaceIndexes] = useState<number[]>([]);
  const gameAnswer = game?.answer.replace(" ", "");

  // Use persistent timer hook
  const isPaused = isDone || isSuggestOpen || isTodaysStatsOpen || isInfoOpen;
  const {
    timeInSeconds: timer,
    startTimer,
    pauseTimer,
    resetTimer,
    addTime,
  } = usePersistentTimer(gameIndex, isPaused);

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

  useEffect(() => {
    const indexes: number[] = [];
    for (let i = 0; i < game.answer.length; i++) {
      if (game.answer[i] === " ") {
        indexes.push(i);
      }
    }
    setSpaceIndexes(indexes);
  }, [game]);

  // Start timer when component mounts and game is not paused
  useEffect(() => {
    if (!isPaused) {
      startTimer();
    } else {
      pauseTimer();
    }
  }, [isPaused, startTimer, pauseTimer]);

  const isCorrectSolution = useCallback(
    (guess: string) => {
      if (!game) {
        return false;
      }
      console.log(
        guess.replace(/ /g, "").toLowerCase(),
        game.answer.replace(/ /g, "").toLowerCase()
      );
      return (
        guess.replace(/ /g, "").toLowerCase() ===
        game.answer.replace(/ /g, "").toLowerCase()
      );
    },
    [game]
  );

  const onPressLetter = useCallback(
    (letter: string) => {
      setCurrentGuess((prev) => {
        if (!game) {
          return prev;
        }
        if (hintCount === undefined) {
          return prev + letter;
        }
        const safePrefix = prev.slice(0, hintCount);
        const rest = prev.slice(hintCount);
        if (safePrefix.length < hintCount) {
          return gameAnswer.slice(0, hintCount).toUpperCase() + letter;
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
      if (hintCount === undefined) {
        return prev.slice(0, -1);
      }
      if (prev.length > hintCount) {
        return prev.slice(0, -1);
      }
      return prev;
    });
  }, [hintCount]);

  const commitGuess = useCallback(async () => {
    const isCorrect = isCorrectSolution(currentGuess);
    setGuessCount((g) => g + 1);
    if (isCorrect) {
      setIsDone(true);
      setIsResultsOpen(true);

      const { error } = await supabase.from("game_results").insert([
        {
          game_id: game.id,
          user_id: user ? user.id : null,
          time_seconds: timer,
          guesses: guessCount + 1,
          hints: hintCount,
        },
      ]);

      if (error) {
        console.log("Game result insert error:", error.message);
      }
    } else {
      setShowIncorrect(true);
      setTimeout(() => setShowIncorrect(false), 500);
    }
  }, [
    currentGuess,
    isCorrectSolution,
    user,
    game.id,
    timer,
    guessCount,
    hintCount,
  ]);

  const onHint = useCallback(() => {
    if (!game) return;
    if (hintCount < gameAnswer.length) {
      addTime(30);
      const newHintCount = hintCount + 1;
      setCurrentGuess(
        gameAnswer
          .slice(0, newHintCount)
          .toUpperCase()
          .padEnd(gameAnswer.length, "")
      );
      setHintCount(newHintCount);
    }
  }, [game, hintCount, gameAnswer, addTime]);

  useEffect(() => {
    if (isDone) {
      return;
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      // Prevent typing in currentGuess if SuggestPopup is open or a textarea is focused
      const active = document.activeElement;
      if (isSuggestOpen || (active && active.tagName === "TEXTAREA")) {
        return;
      }
      if (isResultsOpen) {
        // Don't accept input if results are open
        return;
      }
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
  }, [
    isDone,
    isResultsOpen,
    onPressLetter,
    onPressBackspace,
    commitGuess,
    isSuggestOpen,
  ]);

  // Add this callback to reset state on game switch
  const handleSelectGame = (newIndex: number) => {
    setGameIndex(newIndex);
    setIsDone(false);
    setIsResultsOpen(false);
    setCurrentGuess("");
    resetTimer();
    setShowIncorrect(false);
    setHintCount(0);
    setGuessCount(0);
    // Reset resultSubmitted on game switch
  };

  // Calculate the maximum selectable game index (today or last available)
  const maxSelectableGameIndex = Math.min(
    getTodaysGameIndex() + 1,
    GAMES.length
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
        timerInSeconds={timer}
        className={styles.header}
        gameIndex={game.id}
        onSelectGame={handleSelectGame}
        maxGameIndex={maxSelectableGameIndex}
        onHint={onHint}
        hintDisabled={hintCount >= gameAnswer.length}
        hintAriaLabel="Reveal a letter (costs +30s)"
        isSuggestOpen={isSuggestOpen}
        setIsSuggestOpen={setIsSuggestOpen}
        onShowStats={() => {
          setIsTodaysStatsOpen(true);
          setCameFromResults(false);
        }}
        isInfoOpen={isInfoOpen}
        setIsInfoOpen={setIsInfoOpen}
      />
      <SuggestPopup
        isOpen={isSuggestOpen}
        close={() => setIsSuggestOpen(false)}
      />
      <div className={styles.imageWrapper}>
        <Image
          src={game.image}
          alt="inkling"
          fill
          sizes="(max-width: 600px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className={styles.image}
          priority={true}
        />
      </div>
      <div className={styles.guess}>
        {isDone ? (
          "Correct!"
        ) : (
          <>
            <div
              className={
                styles.guessWithDashes +
                (showIncorrect ? " " + styles.incorrectGuess : "")
              }
            >
              <span className={styles.guessWithDashesContent}>
                {Array.from({ length: game.answer.length }).map(
                  (_, originalIndex) => {
                    if (spaceIndexes.includes(originalIndex)) {
                      // This is a space position
                      return (
                        <div
                          key={`space-${originalIndex}`}
                          className={styles.spaceSeparator}
                        >
                          <span className={styles.spaceChar}> </span>
                        </div>
                      );
                    } else {
                      // This is a letter position - calculate which letter it is
                      const letterIndex =
                        originalIndex -
                        spaceIndexes.filter((si) => si < originalIndex).length;
                      return (
                        <div
                          key={`char-${originalIndex}`}
                          className={styles.charContainer}
                        >
                          <span className={styles.char}>
                            {letterIndex < hintCount
                              ? gameAnswer[letterIndex].toUpperCase()
                              : currentGuess[letterIndex] || " "}
                          </span>
                          <span className={styles.dash}>_</span>
                        </div>
                      );
                    }
                  }
                )}
              </span>
            </div>
          </>
        )}
      </div>
      <Keyboard
        onPressBackspace={
          currentGuess.length > 0 ? onPressBackspace : undefined
        }
        onPressCharacter={onPressLetter}
        onPressEnter={commitGuess}
        className={styles.keyboard}
      />
      <ResultsPopup
        isOpen={isResultsOpen}
        close={() => setIsResultsOpen(false)}
        gameNumber={game.id}
        timeInSeconds={timer}
        guessCount={guessCount}
        hintCount={hintCount}
        onShowStats={() => {
          setIsResultsOpen(false);
          setIsTodaysStatsOpen(true);
          setCameFromResults(true);
        }}
      />
      {isTodaysStatsOpen && (
        <GameStats
          gameId={game.id}
          answerLength={gameAnswer.length}
          guessCount={guessCount}
          hintCount={hintCount}
          showBackButton={cameFromResults}
          onClose={(reason) => {
            if (reason === "back") {
              setIsTodaysStatsOpen(false);
              setIsResultsOpen(true);
            } else {
              setIsTodaysStatsOpen(false);
            }
            setCameFromResults(false);
          }}
        />
      )}
    </div>
  );
}
