import { IconBackspace } from "@tabler/icons-react";
import React, { useCallback } from "react";
import { KeyboardKey } from "../components/KeyboardKey";
import classNames from "classnames";
import styles from "./Keyboard.module.scss";
import { GameData } from "../../public/game_data";

export interface KeyboardProps {
  setCurrentGuess: React.Dispatch<React.SetStateAction<string>>;
  onPressEnter: (() => void) | undefined;
  hintCount: number;
  gameAnswer: string;
  game: GameData;
  className?: string;
}

export const Keyboard = React.memo(function KeyboardImpl({
  setCurrentGuess,
  onPressEnter,
  hintCount,
  gameAnswer,
  game,
  className,
}: KeyboardProps) {
  const onPressCharacter = useCallback(
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
    [setCurrentGuess, game, hintCount, gameAnswer]
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
  }, [hintCount, setCurrentGuess]);

  return (
    <div className={classNames(styles.keyboard, className)}>
      <div className={styles.line}>
        {["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"].map((char) => (
          <KeyboardKey
            key={char}
            containerClassName={styles.characterKey}
            text={char}
            onClick={() => onPressCharacter?.(char)}
          />
        ))}
      </div>
      <div className={styles.line}>
        {["A", "S", "D", "F", "G", "H", "J", "K", "L"].map((char) => (
          <KeyboardKey
            key={char}
            containerClassName={styles.characterKey}
            text={char}
            onClick={() => onPressCharacter?.(char)}
          />
        ))}
      </div>
      <div className={styles.line}>
        <KeyboardKey
          className={styles.keyWide}
          text="SUBMIT"
          onClick={onPressEnter}
        />
        {["Z", "X", "C", "V", "B", "N", "M"].map((char) => (
          <KeyboardKey
            key={char}
            containerClassName={styles.characterKey}
            text={char}
            onClick={() => onPressCharacter?.(char)}
          />
        ))}
        <KeyboardKey
          className={styles.key}
          text={<IconBackspace size={24} />}
          onClick={onPressBackspace}
        />
      </div>
    </div>
  );
});
