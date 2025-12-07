"use client";

import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import Image from "next/image";
import { Header, HeaderRef } from "../components/Header";
import { Keyboard } from "../components/Keyboard";
import { GuessDisplay } from "../components/GuessDisplay";
import { getTodaysGameIndex } from "../hooks/game-logic";
import { GAMES } from "../../public/game_data";
import styles from "./Game.module.scss";
import { useUser } from "../providers/UserProvider";
import supabase from "./supabaseClient";

interface TimerState {
  gameIndex: number;
  timeInSeconds: number;
  lastUpdated: number;
  isActive: boolean;
}

const STORAGE_KEY = "inkling_timer_state";

export default function Game() {
  const [gameIndex, setGameIndex] = useState(getTodaysGameIndex);
  const game = GAMES[gameIndex];
  const { user } = useUser();
  const [isDone, setIsDone] = useState(false);
  const [currentGuess, setCurrentGuess] = useState("");
  const currentGuessRef = useRef(currentGuess);
  const [hintCount, setHintCount] = useState(0);
  const guessCountRef = useRef(0);
  const [isPausedByPopup, setIsPausedByPopup] = useState(false);
  const [showLetterFeedback, setShowLetterFeedback] = useState(false);
  const headerRef = useRef<HeaderRef>(null);
  const gameAnswer = game?.answer.replace(" ", "");
  const isPaused = isDone || isPausedByPopup;
  const normalizeText = useCallback((text: string) => {
    return text.replace(/ /g, "").toLowerCase();
  }, []);

  // Timer state and logic (updates every second when active!)
  const [timeInSeconds, setTimeInSeconds] = useState(0);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const timeRef = useRef(0);

  // Update the ref when the time changes
  useEffect(() => {
    timeRef.current = timeInSeconds;
  }, [timeInSeconds]);

  // Load timer state from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const state: TimerState = JSON.parse(stored);

        if (state.gameIndex === gameIndex) {
          setTimeInSeconds(state.timeInSeconds);
          setIsTimerActive(state.isActive);
        } else {
          // Clear old state if it's a different game
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch (error) {
      console.error("Error loading timer state:", error);
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [gameIndex]);

  // Save timer state to localStorage
  const saveTimerState = useCallback(
    (time: number, active: boolean) => {
      try {
        const state: TimerState = {
          gameIndex,
          timeInSeconds: time,
          lastUpdated: Date.now(),
          isActive: active,
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch (error) {
        console.error("Error saving timer state:", error);
      }
    },
    [gameIndex]
  );

  // THIS EFFECT CAUSES RE-RENDERS EVERY SECOND when the timer is active!
  useEffect(() => {
    if (!isTimerActive || isPaused) {
      return;
    }

    const interval = setInterval(() => {
      setTimeInSeconds((prev) => {
        const newTime = prev + 1;
        saveTimerState(newTime, true);
        return newTime;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isTimerActive, isPaused, saveTimerState]);

  // Start the timer
  const startTimer = useCallback(() => {
    setIsTimerActive(true);
    saveTimerState(timeInSeconds, true);
  }, [timeInSeconds, saveTimerState]);

  // Pause the timer
  const pauseTimer = useCallback(() => {
    setIsTimerActive(false);
    saveTimerState(timeInSeconds, false);
  }, [timeInSeconds, saveTimerState]);

  // Reset the timer for a new game
  const resetTimer = useCallback(() => {
    setTimeInSeconds(0);
    setIsTimerActive(false);
    saveTimerState(0, false);
  }, [saveTimerState]);

  // Add time (for hints)
  const addTime = useCallback(
    (seconds: number) => {
      setTimeInSeconds((prev) => {
        const newTime = prev + seconds;
        saveTimerState(newTime, isTimerActive);
        return newTime;
      });
    },
    [isTimerActive, saveTimerState]
  );

  const spaceIndexes = useMemo(() => {
    const indexes: number[] = [];
    for (let i = 0; i < game.answer.length; i++) {
      if (game.answer[i] === " ") {
        indexes.push(i);
      }
    }
    return indexes;
  }, [game.answer]);

  useEffect(() => {
    currentGuessRef.current = currentGuess;
  }, [currentGuess]);

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
          headerRef.current?.openInfo();
        }
      } catch (error) {
        console.error("Error checking user results:", error);
      }
    };
    checkUserResults();
  }, [user]);

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
      console.log(normalizeText(guess), normalizeText(game.answer));
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
    guessCountRef.current++;
    if (isCorrectSolution(currentGuessRef.current)) {
      setIsDone(true);

      // Show results popup via Header
      headerRef.current?.showResults(
        game.id,
        timeRef.current,
        guessCountRef.current,
        hintCount
      );

      const { error } = await supabase.from("game_results").insert([
        {
          game_id: game.id,
          user_id: user ? user.id : null,
          time_seconds: timeRef.current,
          guesses: guessCountRef.current,
          hints: hintCount,
        },
      ]);

      if (error) {
        console.log("Game result insert error:", error.message);
      }
    } else {
      setShowLetterFeedback(true);
      setTimeout(() => {
        setShowLetterFeedback(false);
      }, 1000);
    }
  }, [isCorrectSolution, game.id, user, timeRef, guessCountRef, hintCount]);

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
      guessCountRef.current = 0;
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
        spaceIndexes={spaceIndexes}
        answer={game.answer}
        gameAnswer={gameAnswer}
        currentGuess={currentGuess}
        hintCount={hintCount}
        getLetterStatus={getLetterStatus}
      />
      <Keyboard
        onPressBackspace={onPressBackspace}
        onPressCharacter={onPressLetter}
        onPressEnter={commitGuess}
        className={styles.keyboard}
      />
    </div>
  );
}
