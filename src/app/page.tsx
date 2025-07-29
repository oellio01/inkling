"use client";

import { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import { Header } from "../components/Header";
import { Keyboard } from "../components/Keyboard";
import { ResultsPopup } from "../components/ResultsPopup";
import { SuggestPopup } from "../components/SuggestPopup";
import { getTodaysGameIndex } from "../hooks/game-logic";
import { GAMES } from "../../public/game_data";
import styles from "./Game.module.scss";
import { useUser } from "../providers/UserProvider";
import { GameStats } from "../components/GameStats";
import supabase from "./supabaseClient";

export default function Game() {
  const [gameIndex, setGameIndex] = useState(getTodaysGameIndex);
  const game = GAMES[gameIndex];

  const [isDone, setIsDone] = useState(false);
  const [isResultsOpen, setIsResultsOpen] = useState(false);
  const [currentGuess, setCurrentGuess] = useState("");
  const [timer, setTimer] = useState(0);
  const [showIncorrect, setShowIncorrect] = useState(false);
  const [hintCount, setHintCount] = useState(0);
  const [guessCount, setGuessCount] = useState(0);
  const [isSuggestOpen, setIsSuggestOpen] = useState(false);
  const [isTodaysStatsOpen, setIsTodaysStatsOpen] = useState(false);

  const { user } = useUser();

  useEffect(() => {
    if (isDone) {
      return;
    }
    const intervalId = setInterval(() => {
      setTimer((t) => t + 1);
    }, 1000);
    return () => clearInterval(intervalId);
  }, [isDone]);

  const isCorrectSolution = useCallback(
    (guess: string) => {
      if (!game) {
        return false;
      }
      return guess.toLowerCase() === game.answer.toLowerCase();
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
          return game.answer.slice(0, hintCount).toUpperCase() + letter;
        }
        if (safePrefix.length + rest.length < game.answer.length) {
          return safePrefix + rest + letter;
        }
        return prev;
      });
    },
    [hintCount, game]
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
    if (hintCount < game.answer.length) {
      setTimer((t) => t + 30);
      const newHintCount = hintCount + 1;
      setCurrentGuess(
        game.answer
          .slice(0, newHintCount)
          .toUpperCase()
          .padEnd(game.answer.length, "")
      );
      setHintCount(newHintCount);
    }
  }, [game, hintCount]);

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
    setTimer(0);
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
        hintDisabled={hintCount >= game.answer.length}
        hintAriaLabel="Reveal a letter (costs +30s)"
        isSuggestOpen={isSuggestOpen}
        setIsSuggestOpen={setIsSuggestOpen}
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
                {Array.from({ length: game.answer.length }).map((_, index) => (
                  <div key={index} className={styles.charContainer}>
                    <span className={styles.char}>
                      {index < hintCount
                        ? game.answer[index].toUpperCase()
                        : currentGuess[index] || " "}
                    </span>
                    <span className={styles.dash}>_</span>
                  </div>
                ))}
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
        }}
      />
      {isTodaysStatsOpen && (
        <GameStats
          gameId={game.id}
          answerLength={game.answer.length}
          timeInSeconds={timer}
          onClose={(reason) => {
            if (reason === "back") {
              setIsTodaysStatsOpen(false);
              setIsResultsOpen(true);
            } else {
              setIsTodaysStatsOpen(false);
            }
          }}
        />
      )}
    </div>
  );
}
