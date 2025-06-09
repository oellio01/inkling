import classNames from "classnames";
import styles from "./KeyboardKey.module.scss";

export interface KeyboardKeyProps {
  containerClassName?: string;
  className?: string;
  text: React.JSX.Element | string;
  onClick: (() => void) | undefined;
}

export function KeyboardKey({
  containerClassName,
  text,
  onClick,
}: KeyboardKeyProps) {
  const shouldUseTouchstart =
    typeof document !== "undefined" &&
    "ontouchstart" in document.documentElement;

  return (
    <div
      className={classNames(
        containerClassName,
        styles.key,
        "flex min-w-0 tracking-wide"
      )}
      onClick={shouldUseTouchstart ? undefined : onClick}
      onTouchStart={shouldUseTouchstart ? onClick : undefined}
    >
      <div>{text}</div>
    </div>
  );
}
