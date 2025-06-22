"use client";

// Game.jsx
import React, { useState, useCallback } from "react";
import Image from "next/image";
import { Header } from "../components/Header";
import { Keyboard } from "../components/Keyboard";
import { GAME } from "../../public/game_data";
import styles from "./Game.module.scss";

interface State {
  currentGuess: string;
}

export default function Game() {
  const [isDone, setIsDone] = useState(false);
  const solution = GAME.answer;

  const isCorrectSolution = useCallback(
    (guess: string) => {
      return guess.toLowerCase() === solution.toLowerCase();
    },
    [solution]
  );

  const [{ currentGuess }, setState] = useState<State>({
    currentGuess: "",
  });

  const onChangeCurrentGuess = useCallback(
    (updater: (oldGuess: string) => string) => {
      setState((existing) => ({
        ...existing,
        currentGuess: updater(existing.currentGuess),
      }));
    },
    []
  );

  const onPressLetter = useCallback(
    (letter: string) => {
      onChangeCurrentGuess((oldGuess) => oldGuess + letter);
    },
    [onChangeCurrentGuess]
  );

  const onPressBackspace = useCallback(() => {
    onChangeCurrentGuess((oldGuess) => oldGuess.slice(0, oldGuess.length - 1));
  }, [onChangeCurrentGuess]);

  const commitGuess = useCallback(() => {
    const isCorrect = isCorrectSolution(currentGuess);
    setIsDone(isCorrect);
    console.log({ currentGuess, isCorrect });
  }, [currentGuess, isCorrectSolution]);

  return (
    <div className={styles.game}>
      <div className={styles.header}>
        <Header
          timerInSeconds={0}
          exampleImage={GAME.image}
          exampleAnswer={GAME.answer}
        />
      </div>
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
      <div className={styles.keyboard}>
        <Keyboard
          onPressBackspace={
            currentGuess.length > 0 ? onPressBackspace : undefined
          }
          onPressCharacter={onPressLetter}
          onPressEnter={commitGuess}
        />
      </div>
    </div>
  );
}
