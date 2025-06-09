import classNames from "classnames";
import { KeyboardKey } from "./KeyboardKey";

export interface KeyboardCharacterKeyProps {
  containerClassName?: string;
  className?: string;
  character: string;
  onClick: (() => void) | undefined;
}

export function KeyboardCharacterKey({
  containerClassName,
  className,
  character,
  onClick,
}: KeyboardCharacterKeyProps) {
  return (
    <KeyboardKey
      containerClassName={classNames(containerClassName, "basis-9 md:basis-10")}
      className={className}
      text={character}
      onClick={onClick}
    />
  );
}
