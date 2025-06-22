import classNames from "classnames";
import styles from "./KeyboardKey.module.scss";

export interface KeyboardKeyProps {
  containerClassName?: string;
  className?: string;
  text: React.ReactNode;
  onClick: (() => void) | undefined;
}

export function KeyboardKey({
  containerClassName,
  className,
  text,
  onClick,
}: KeyboardKeyProps) {
  const disabled = onClick == null;

  return (
    <div
      className={classNames(
        styles.key,
        containerClassName,
        className,
        styles.keyInner,
        {
          [styles.clickable]: !disabled,
        }
      )}
      onClick={onClick}
    >
      {text}
    </div>
  );
}
