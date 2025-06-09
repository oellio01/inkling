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
      className={classNames(
        containerClassName,
        styles.key,
        "flex min-w-0 tracking-wide"
      )}
      onClick={shouldUseTouchstart ? undefined : onClick}
      onTouchStart={shouldUseTouchstart ? onClick : undefined}
    >
      <div
        className={classNames(
          className,
          "flex flex-1 justify-center items-center font-mono font-bold select-none rounded min-w-0 overflow-hidden",
          "text-lg h-12 md:text-xl md:h-14",
          {
            "cursor-pointer hover:opacity-80 active:opacity-70": !disabled,
          }
        )}
      >
        {text}
      </div>
    </div>
  );
}
