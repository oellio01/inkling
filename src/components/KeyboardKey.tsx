import classNames from "classnames";
import React from "react";
import styles from "./KeyboardKey.module.scss";

export interface KeyboardKeyProps {
  containerClassName?: string;
  className?: string;
  text: React.ReactNode;
  onClick: (() => void) | undefined;
}

export const KeyboardKey = React.memo(function KeyboardKey({
  containerClassName,
  className,
  text,
  onClick,
}: KeyboardKeyProps) {
  return (
    <div
      className={classNames(
        styles.key,
        containerClassName,
        className,
        styles.keyInner
      )}
      onPointerDown={onClick}
    >
      {text}
    </div>
  );
});
