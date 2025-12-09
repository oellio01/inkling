"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Image from "next/image";
import { Header, HeaderRef } from "../components/Header";
import { Keyboard } from "../components/Keyboard";
import { GuessDisplay } from "../components/GuessDisplay";
import { getTodaysGameIndex } from "../hooks/game-logic";
import { useGameTimer } from "../hooks/useGameTimer";
import { GAMES } from "../../public/game_data";
import styles from "./Game.module.scss";
import { useUser } from "../providers/UserProvider";
import supabase from "./supabaseClient";

export default function Game() {
  const [gameIndex, setGameIndex] = useState(getTodaysGameIndex);
  const game = GAMES[gameIndex];
  const { user } = useUser();
  const [isDone, setIsDone] = useState(false);
  const [currentGuess, setCurrentGuess] = useState("");
  const [hintCount, setHintCount] = useState(0);
  const [, setGuessCount] = useState(0);
  const [isPausedByPopup, setIsPausedByPopup] = useState(false);
  const [showLetterFeedback, setShowLetterFeedback] = useState(false);
  const headerRef = useRef<HeaderRef>(null);
  const gameAnswer = game?.answer.replace(" ", "");
  const isPaused = isDone || isPausedByPopup;
  const normalizeText = useCallback((text: string) => {
    return text.replace(/ /g, "").toLowerCase();
  }, []);

  // Timer logic
  const { timeInSeconds, timeRef, resetTimer, addTime } = useGameTimer(
    gameIndex,
    isPaused
  );

  const isCorrectSolution = useCallback(
    (guess: string) => {
      if (!game) {
        return false;
      }
      return normalizeText(guess) === normalizeText(game.answer);
    },
    [game, normalizeText]
  );

  const getLetterStatus = useCallback(
    (letterIndex: number) => {
      if (!game || !showLetterFeedback) return "normal";

      const answer = normalizeText(game.answer);
      const guessLetters = normalizeText(currentGuess);

      if (letterIndex >= guessLetters.length) return "normal";

      const guessLetter = guessLetters[letterIndex];
      const answerLetter = answer[letterIndex];

      return guessLetter === answerLetter ? "correct" : "incorrect";
    },
    [game, showLetterFeedback, currentGuess, normalizeText]
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
    if (isCorrectSolution(currentGuess)) {
      setGuessCount((prevCount) => {
        const newCount = prevCount + 1;

        // Show results popup via Header
        headerRef.current?.showResults(
          game.id,
          timeRef.current,
          newCount,
          hintCount
        );

        // Insert game result
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

        return newCount;
      });

      setIsDone(true);
    } else {
      setGuessCount((prev) => prev + 1);
      setShowLetterFeedback(true);
      setTimeout(() => {
        setShowLetterFeedback(false);
      }, 1000);
    }
  }, [isCorrectSolution, currentGuess, game.id, user, timeRef, hintCount]);

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
    if (isDone) {
      return;
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isPaused) {
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

  const handlePausedChange = useCallback((isPaused: boolean) => {
    setIsPausedByPopup(isPaused);
  }, []);

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
        ref={headerRef}
        timerInSeconds={timeInSeconds}
        className={styles.header}
        gameIndex={game.id}
        gameAnswerLength={gameAnswer.length}
        onSelectGame={handleSelectGame}
        onHint={onHint}
        hintDisabled={hintCount >= gameAnswer.length}
        onPausedChange={handlePausedChange}
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
    </div>
  );
}
