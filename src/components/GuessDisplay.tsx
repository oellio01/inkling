import React from "react";
import styles from "../app/Game.module.scss";

interface GuessDisplayProps {
  isDone: boolean;
  spaceIndexes: number[];
  answer: string;
  gameAnswer: string;
  currentGuess: string;
  hintCount: number;
  getLetterStatus: (index: number) => string;
}

export const GuessDisplay: React.FC<GuessDisplayProps> = ({
  isDone,
  spaceIndexes,
  answer,
  gameAnswer,
  currentGuess,
  hintCount,
  getLetterStatus,
}) => {
  return (
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
                  const words = answer.split(" ");
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
                                  getLetterStatus(currentLetterIndex) ===
                                  "correct"
                                    ? styles.correctLetter
                                    : getLetterStatus(currentLetterIndex) ===
                                      "incorrect"
                                    ? styles.incorrectLetter
                                    : ""
                                }`}
                              >
                                {currentLetterIndex < hintCount
                                  ? gameAnswer[currentLetterIndex].toUpperCase()
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
                {Array.from({ length: answer.length }).map(
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
  );
};
