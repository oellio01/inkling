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

  const onPressLetter = useCallback((letter: string) => {
    setCurrentGuess((prev) => prev + letter);
  }, []);

  const onPressBackspace = useCallback(() => {
    setCurrentGuess((prev) => prev.slice(0, -1));
  }, []);

  const commitGuess = useCallback(() => {
    const isCorrect = isCorrectSolution(currentGuess);
    if (isCorrect) {
      setIsDone(true);
      setIsResultsOpen(true);
    }
    console.log({ currentGuess, isCorrect });
  }, [currentGuess, isCorrectSolution]);

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
          <div className={styles.guessWithDashes}>
            {Array.from({ length: gameForToday.answer.length }).map(
              (_, index) => (
                <div key={index} className={styles.charContainer}>
                  <span className={styles.char}>
                    {currentGuess[index] || " "}
                  </span>
                  <span className={styles.dash}>_</span>
                </div>
              )
            )}
          </div>
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
