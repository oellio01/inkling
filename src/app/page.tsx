"use client";

import { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import { Header } from "../components/Header";
import { Keyboard } from "../components/Keyboard";
import { ResultsPopup } from "../components/ResultsPopup";
import { getGameForToday } from "../hooks/game-logic";
import styles from "./Game.module.scss";

export default function Game() {
  const gameForToday = getGameForToday();

  const [isDone, setIsDone] = useState(false);
  const [isResultsOpen, setIsResultsOpen] = useState(false);
  const [currentGuess, setCurrentGuess] = useState("");
  const [timer, setTimer] = useState(0);
  const [showIncorrect, setShowIncorrect] = useState(false);
  const [hintCount, setHintCount] = useState(0);

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
      if (!gameForToday) return false;
      return guess.toLowerCase() === gameForToday.answer.toLowerCase();
    },
    [gameForToday]
  );

  const onPressLetter = useCallback(
    (letter: string) => {
      setCurrentGuess((prev) => {
        if (!gameForToday) return prev;
        if (hintCount === undefined) return prev + letter;
        const safePrefix = prev.slice(0, hintCount);
        const rest = prev.slice(hintCount);
        if (safePrefix.length < hintCount) {
          return gameForToday.answer.slice(0, hintCount).toUpperCase() + letter;
        }
        if (safePrefix.length + rest.length < gameForToday.answer.length) {
          return safePrefix + rest + letter;
        }
        return prev;
      });
    },
    [hintCount, gameForToday]
  );

  const onPressBackspace = useCallback(() => {
    setCurrentGuess((prev) => {
      if (hintCount === undefined) return prev.slice(0, -1);
      if (prev.length > hintCount) {
        return prev.slice(0, -1);
      }
      return prev;
    });
  }, [hintCount]);

  const commitGuess = useCallback(() => {
    const isCorrect = isCorrectSolution(currentGuess);
    if (isCorrect) {
      setIsDone(true);
      setIsResultsOpen(true);
    } else {
      setShowIncorrect(true);
      setTimeout(() => setShowIncorrect(false), 500);
    }
    console.log({ currentGuess, isCorrect });
  }, [currentGuess, isCorrectSolution]);

  const onHint = useCallback(() => {
    if (!gameForToday) return;
    if (hintCount < gameForToday.answer.length) {
      setTimer((t) => t + 30);
      const newHintCount = hintCount + 1;
      setCurrentGuess(
        gameForToday.answer
          .slice(0, newHintCount)
          .toUpperCase()
          .padEnd(gameForToday.answer.length, "")
      );
      setHintCount(newHintCount);
    }
  }, [gameForToday, hintCount]);

  useEffect(() => {
    if (isDone) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (isResultsOpen) return; // Don't accept input if results are open

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
  }, [isDone, isResultsOpen, onPressLetter, onPressBackspace, commitGuess]);

  if (!gameForToday) {
    return (
      <div className={styles.game}>
        <p>Come back tomorrow for a new puzzle!</p>
      </div>
    );
  }

  return (
    <div className={styles.game}>
      <Header timerInSeconds={timer} className={styles.header} />
      <div className={styles.imageWrapper}>
        <Image
          src={gameForToday.image}
          alt="rebus"
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
              {Array.from({ length: gameForToday.answer.length }).map(
                (_, index) => (
                  <div key={index} className={styles.charContainer}>
                    <span className={styles.char}>
                      {index < hintCount
                        ? gameForToday.answer[index].toUpperCase()
                        : currentGuess[index] || " "}
                    </span>
                    <span className={styles.dash}>_</span>
                  </div>
                )
              )}
              <button
                type="button"
                aria-label="Reveal a letter (costs +30s)"
                onClick={onHint}
                disabled={hintCount >= gameForToday.answer.length}
                style={{
                  background: "none",
                  border: "none",
                  cursor:
                    hintCount < gameForToday.answer.length
                      ? "pointer"
                      : "not-allowed",
                  marginLeft: 12,
                  padding: 0,
                  display: "flex",
                  alignItems: "center",
                }}
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
        gameNumber={gameForToday.id}
        timeInSeconds={timer}
      />
    </div>
  );
}
