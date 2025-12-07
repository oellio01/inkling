import { IconBackspace } from "@tabler/icons-react";
import React from "react";
import { KeyboardKey } from "../components/KeyboardKey";
import { KeyboardLine } from "../components/KeyboardLine";
import classNames from "classnames";
import styles from "./Keyboard.module.scss";

export interface KeyboardProps {
  onPressCharacter: ((char: string) => void) | undefined;
  onPressBackspace: (() => void) | undefined;
  onPressEnter: (() => void) | undefined;
  className?: string;
}

export const Keyboard = React.memo(function KeyboardImpl({
  onPressBackspace,
  onPressCharacter,
  onPressEnter,
  className,
}: KeyboardProps) {
  return (
    <div className={classNames(styles.keyboard, className)}>
      <KeyboardLine className={styles.keyboardRow}>
        {["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"].map((char) => (
          <KeyboardKey
            key={char}
            containerClassName={styles.characterKey}
            text={char}
            onClick={() => onPressCharacter?.(char)}
          />
        ))}
      </KeyboardLine>
      <KeyboardLine className={styles.keyboardRow}>
        {["A", "S", "D", "F", "G", "H", "J", "K", "L"].map((char) => (
          <KeyboardKey
            key={char}
            containerClassName={styles.characterKey}
            text={char}
            onClick={() => onPressCharacter?.(char)}
          />
        ))}
      </KeyboardLine>
      <KeyboardLine className={styles.keyboardRow}>
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
      </KeyboardLine>
    </div>
  );
});
