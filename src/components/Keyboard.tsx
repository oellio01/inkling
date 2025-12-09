import { IconBackspace } from "@tabler/icons-react";
import React from "react";
import { KeyboardKey } from "../components/KeyboardKey";
import classNames from "classnames";
import styles from "./Keyboard.module.scss";

export interface KeyboardProps {
  onPressLetter: (letter: string) => void;
  onPressBackspace: () => void;
  onPressEnter: (() => void) | undefined;
  className?: string;
}

export const Keyboard = React.memo(function KeyboardImpl({
  onPressLetter,
  onPressBackspace,
  onPressEnter,
  className,
}: KeyboardProps) {
  return (
    <div className={classNames(styles.keyboard, className)}>
      <div className={styles.line}>
        {["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"].map((char) => (
          <KeyboardKey
            key={char}
            containerClassName={styles.characterKey}
            text={char}
            onClick={() => onPressLetter(char)}
          />
        ))}
      </div>
      <div className={styles.line}>
        {["A", "S", "D", "F", "G", "H", "J", "K", "L"].map((char) => (
          <KeyboardKey
            key={char}
            containerClassName={styles.characterKey}
            text={char}
            onClick={() => onPressLetter(char)}
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
            onClick={() => onPressLetter(char)}
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
