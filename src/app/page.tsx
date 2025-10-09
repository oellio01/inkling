"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
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
  const [hintCount, setHintCount] = useState(0);
  const [guessCount, setGuessCount] = useState(0);
  const [isSuggestOpen, setIsSuggestOpen] = useState(false);
  const [isTodaysStatsOpen, setIsTodaysStatsOpen] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [cameFromResults, setCameFromResults] = useState(false);
  const [showLetterFeedback, setShowLetterFeedback] = useState(false);
  const gameAnswer = game?.answer.replace(" ", "");
  const isPaused = isDone || isSuggestOpen || isTodaysStatsOpen || isInfoOpen;
  const normalizeText = useCallback((text: string) => {
    return text.replace(/ /g, "").toLowerCase();
  }, []);
  const { timeInSeconds: timer, startTimer, pauseTimer, resetTimer, addTime } = usePersistentTimer(gameIndex, isPaused);
  const spaceIndexes = useMemo(() => {
    const indexes: number[] = [];
    for (let i = 0; i < game.answer.length; i++) {
      if (game.answer[i] === " ") {
        indexes.push(i);
      }
    }
    return indexes;
  }, [game.answer]);
  const maxSelectableGameIndex = Math.min(
    getTodaysGameIndex() + 1,
    GAMES.length
  );

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
        normalizeText(guess),
        normalizeText(game.answer)
      );
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
      setShowLetterFeedback(true);
      setTimeout(() => {
        setShowLetterFeedback(false);
      }, 1000);
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
      );
      setHintCount(newHintCount);
    }
  }, [game, hintCount, gameAnswer, addTime]);

  useEffect(() => {
    if (isDone) {
      return;
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isSuggestOpen || isResultsOpen) {
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

  const handleSelectGame = useCallback(
    (newIndex: number) => {
      setGameIndex(newIndex);
      setIsDone(false);
      setIsResultsOpen(false);
      setCurrentGuess("");
      resetTimer();
      setHintCount(0);
      setGuessCount(0);
      setShowLetterFeedback(false);
    },
    [resetTimer]
  );

  const handleShowStats = useCallback(() => {
    setIsTodaysStatsOpen(true);
    setCameFromResults(false);
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
        onShowStats={handleShowStats}
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
            <div className={styles.guessWithDashes}>
              {spaceIndexes.length > 0 ? (
                // Two-word answer - stack vertically
                <span className={styles.guessWithDashesContentStacked}>
                  {(() => {
                    const words = game.answer.split(" ");
                    let letterIndex = 0;

                    return words.map((word, wordIndex) => (
                      <div key={`word-${wordIndex}`} className={styles.wordRow}>
                        {Array.from({ length: word.length }).map(
                          (_, charIndex) => {
                            const currentLetterIndex = letterIndex++;
                            return (
                              <div
                                key={`char-${wordIndex}-${charIndex}`}
                                className={styles.charContainer}
                              >
                                <span 
                                  className={`${styles.char} ${
                                    getLetterStatus(currentLetterIndex) === "correct"
                                      ? styles.correctLetter
                                      : getLetterStatus(currentLetterIndex) === "incorrect"
                                      ? styles.incorrectLetter
                                      : ""
                                  }`}
                                >
                                  {currentLetterIndex < hintCount
                                    ? gameAnswer[
                                        currentLetterIndex
                                      ].toUpperCase()
                                    : currentGuess[currentLetterIndex] || " "}
                                </span>
                                <span className={styles.dash}>_</span>
                              </div>
                            );
                          }
                        )}
                      </div>
                    ));
                  })()}
                </span>
              ) : (
                // Single word answer - horizontal layout
                <span className={styles.guessWithDashesContent}>
                  {Array.from({ length: game.answer.length }).map(
                    (_, originalIndex) => {
                      return (
                        <div
                          key={`char-${originalIndex}`}
                          className={styles.charContainer}
                        >
                          <span 
                            className={`${styles.char} ${
                              getLetterStatus(originalIndex) === "correct"
                                ? styles.correctLetter
                                : getLetterStatus(originalIndex) === "incorrect"
                                ? styles.incorrectLetter
                                : ""
                            }`}
                          >
                            {originalIndex < hintCount
                              ? gameAnswer[originalIndex].toUpperCase()
                              : currentGuess[originalIndex] || " "}
                          </span>
                          <span className={styles.dash}>_</span>
                        </div>
                      );
                    }
                  )}
                </span>
              )}
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
