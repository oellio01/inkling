import { IconBackspace } from "@tabler/icons-react";
import React from "react";
import { KeyboardCharacterKey } from "../components/KeyboardCharacterKey";
import { KeyboardKey } from "../components/KeyboardKey";
import { KeyboardLine } from "../components/KeyboardLine";
import classNames from "classnames";
import styles from "./Keyboard.module.scss";

export interface KeyboardProps {
  onPressCharacter: ((char: string) => void) | undefined;
  onPressBackspace: (() => void) | undefined;
  onPressEnter: (() => void) | undefined;
}

const DEFAULT_TEXT_COLOR = "text-gray-300";

export const Keyboard = React.memo(function KeyboardImpl({
  onPressBackspace,
  onPressCharacter,
  onPressEnter,
}: KeyboardProps) {
  const renderCharacter = (character: string) => {
    return (
      <KeyboardCharacterKey
        character={character}
        onClick={
          onPressCharacter
            ? () => {
                onPressCharacter(character);
              }
            : undefined
        }
      />
    );
  };

  return (
    <div className={styles.keyboard}>
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
      <KeyboardLine className={styles.keyboardRow}>
        <KeyboardKey
          containerClassName={classNames(DEFAULT_TEXT_COLOR, styles.keyWide)}
          text="ENTER"
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
          containerClassName={classNames(DEFAULT_TEXT_COLOR, styles.keyWide)}
          text={<IconBackspace size={32} />}
          onClick={onPressBackspace}
        />
      </KeyboardLine>
    </div>
  );
});
