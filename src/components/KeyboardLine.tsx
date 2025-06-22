import classNames from "classnames";
import styles from "./KeyboardLine.module.scss";

export interface KeyboardLineProps {
  className?: string;
  children: React.ReactNode;
}

export function KeyboardLine({ className, children }: KeyboardLineProps) {
  return <div className={classNames(className, styles.line)}>{children}</div>;
}
