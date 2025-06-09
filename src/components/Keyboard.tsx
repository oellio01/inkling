import { IconBackspace } from "@tabler/icons-react";
import React from "react";
import { KeyboardCharacterKey } from "../components/KeyboardCharacterKey";
import { KeyboardKey } from "../components/KeyboardKey";
import { KeyboardLine } from "../components/KeyboardLine";
import classNames from "classnames";

export interface KeyboardProps {
  onPressCharacter: ((char: string) => void) | undefined;
  onPressBackspace: (() => void) | undefined;
  onPressEnter: (() => void) | undefined;
  letterToColor?: Record<string, "yellow" | "green" | "faded-black">;
}

const DEFAULT_TEXT_COLOR = "text-gray-300";

export const Keyboard = React.memo(function KeyboardImpl({
  onPressBackspace,
  onPressCharacter,
  onPressEnter,
  letterToColor,
}: KeyboardProps) {
  const renderCharacter = (character: string) => {
    const color = letterToColor?.[character];
    const customBackgroundColor = getBackgroundColor(color);
    return (
      <KeyboardCharacterKey
        className={classNames(customBackgroundColor, {
          [DEFAULT_TEXT_COLOR]: color == null,
        })}
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
    <div className="flex flex-col min-w-0">
      <KeyboardLine>
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
      <KeyboardLine
        // max-width 95% so the middle line is always a little less wide then the top/bottom rows
        className="max-w-[95%] mx-auto w-full"
      >
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
      <KeyboardLine>
        <KeyboardKey
          containerClassName={classNames(DEFAULT_TEXT_COLOR, "basis-24")}
          className={getBackgroundColor(undefined)}
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
          containerClassName={classNames(DEFAULT_TEXT_COLOR, "basis-14")}
          className={getBackgroundColor(undefined)}
          text={<IconBackspace size={32} />}
          onClick={onPressBackspace}
        />
      </KeyboardLine>
    </div>
  );
});

function getBackgroundColor(color: string | undefined) {
  switch (color) {
    case "green":
      return "bg-char-green/5 text-char-green border border-[2px] border-char-green/50";
    case "yellow":
      return "bg-char-yellow/5 text-char-yellow border border-[2px] border-char-yellow/50";
    case "faded-black":
      return "bg-[#0f0f0f] text-gray-500 border border-[2px] border-gray-900";
    default:
      return "bg-[#1a1a1a] border border-[2px] border-[#292929]";
  }
}
