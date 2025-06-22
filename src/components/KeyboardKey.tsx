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
  const shouldUseTouchstart =
    typeof document !== "undefined" &&
    "ontouchstart" in document.documentElement;

  return (
    <div
      className={classNames(containerClassName, styles.keyWrapper)}
      onClick={shouldUseTouchstart ? undefined : onClick}
      onTouchStart={shouldUseTouchstart ? onClick : undefined}
    >
      <div
        className={classNames(styles.key, className, styles.keyInner, {
          [styles.clickable]: !disabled,
        })}
      >
        {text}
      </div>
    </div>
  );
}
