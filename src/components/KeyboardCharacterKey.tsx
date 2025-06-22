import classNames from "classnames";
import { KeyboardKey } from "./KeyboardKey";
import styles from "./KeyboardCharacterKey.module.scss";

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
      containerClassName={classNames(containerClassName, styles.characterKey)}
      className={className}
      text={character}
      onClick={onClick}
    />
  );
}
