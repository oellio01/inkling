"use client";

// Game.jsx
import React, { useState, useCallback } from "react";
import Image from "next/image";
import { Header } from "../components/Header";
import { Keyboard } from "../components/Keyboard";
import { InfoPopup } from "../components/InfoPopup";
import { GAME } from "../../public/game_data";
import styles from "./Game.module.scss";

interface State {
  currentGuess: string;
}

export default function Game() {
  const [isShowingInfoPopup, setIsShowingInfoPopup] = useState(false);
  const [isDone, setIsDone] = useState(false);

  const solution = "Century";

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
      setState((existing: { currentGuess: string }) => ({
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
        {isShowingInfoPopup && (
          <InfoPopup
            close={() => {
              setIsShowingInfoPopup(false);
            }}
            yesterdaysAnswer={"Hello!"}
          />
        )}
        <Header
          onClickInfo={() => {
            setIsShowingInfoPopup(true);
          }}
          timerInSeconds={0}
        />
      </div>
      <Image
        src={GAME.image}
        alt="rebus"
        className={styles.image}
        width={300}
        height={450}
      />
      <div className={styles.keyboard}>
        <div className={styles.guess}>{isDone ? "Correct!" : currentGuess}</div>
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
