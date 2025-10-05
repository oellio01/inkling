import { IconBackspace } from "@tabler/icons-react";
import React, { useCallback, useMemo } from "react";
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
  const renderCharacter = useCallback(
    (character: string) => {
      return (
        <KeyboardKey
          containerClassName={styles.characterKey}
          text={character}
          onClick={
            onPressCharacter
              ? () => {
                  onPressCharacter(character);
                }
              : undefined
          }
        />
      );
    },
    [onPressCharacter]
  );

  // Memoize keyboard rows to prevent unnecessary re-renders
  const topRow = useMemo(
    () => (
      <KeyboardLine className={styles.keyboardRow}>
        {renderCharacter("Q")}
        {renderCharacter("W")}
        {renderCharacter("E")}
        {renderCharacter("R")}
        {renderCharacter("T")}
        {renderCharacter("Y")}
        {renderCharacter("U")}
        {renderCharacter("I")}
        {renderCharacter("O")}
        {renderCharacter("P")}
      </KeyboardLine>
    ),
    [renderCharacter]
  );

  const middleRow = useMemo(
    () => (
      <KeyboardLine className={styles.keyboardRow}>
        {renderCharacter("A")}
        {renderCharacter("S")}
        {renderCharacter("D")}
        {renderCharacter("F")}
        {renderCharacter("G")}
        {renderCharacter("H")}
        {renderCharacter("J")}
        {renderCharacter("K")}
        {renderCharacter("L")}
      </KeyboardLine>
    ),
    [renderCharacter]
  );

  const bottomRow = useMemo(
    () => (
      <KeyboardLine className={styles.keyboardRow}>
        <KeyboardKey
          className={styles.keyWide}
          text="SUBMIT"
          onClick={onPressEnter}
        />
        {renderCharacter("Z")}
        {renderCharacter("X")}
        {renderCharacter("C")}
        {renderCharacter("V")}
        {renderCharacter("B")}
        {renderCharacter("N")}
        {renderCharacter("M")}
        <KeyboardKey
          className={styles.key}
          text={<IconBackspace size={24} />}
          onClick={onPressBackspace}
        />
      </KeyboardLine>
    ),
    [renderCharacter, onPressEnter, onPressBackspace]
  );

  return (
    <div className={classNames(styles.keyboard, className)}>
      {topRow}
      {middleRow}
      {bottomRow}
    </div>
  );
});
