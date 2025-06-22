"use client";

import { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import { Header } from "../components/Header";
import { Keyboard } from "../components/Keyboard";
import { GAME } from "../../public/game_data";
import styles from "./Game.module.scss";

export default function Game() {
  const [isDone, setIsDone] = useState(false);
  const [currentGuess, setCurrentGuess] = useState("");
  const [timer, setTimer] = useState(0);
  const solution = GAME.answer;

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
      return guess.toLowerCase() === solution.toLowerCase();
    },
    [solution]
  );

  const onPressLetter = useCallback((letter: string) => {
    setCurrentGuess((prev) => prev + letter);
  }, []);

  const onPressBackspace = useCallback(() => {
    setCurrentGuess((prev) => prev.slice(0, -1));
  }, []);

  const commitGuess = useCallback(() => {
    const isCorrect = isCorrectSolution(currentGuess);
    setIsDone(isCorrect);
    console.log({ currentGuess, isCorrect });
  }, [currentGuess, isCorrectSolution]);

  return (
    <div className={styles.game}>
      <Header
        timerInSeconds={timer}
        exampleImage={GAME.image}
        exampleAnswer={GAME.answer}
        className={styles.header}
      />
      <div className={styles.imageWrapper}>
        <Image
          src={GAME.image}
          alt="rebus"
          fill
          sizes="(max-width: 600px) 100vw, 600px"
          className={styles.image}
        />
      </div>
      <div className={styles.guess}>{isDone ? "Correct!" : currentGuess}</div>
      <Keyboard
        onPressBackspace={
          currentGuess.length > 0 ? onPressBackspace : undefined
        }
        onPressCharacter={onPressLetter}
        onPressEnter={commitGuess}
        className={styles.keyboard}
      />
    </div>
  );
}
