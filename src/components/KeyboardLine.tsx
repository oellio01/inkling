import classNames from "classnames";
import React from "react";
import styles from "./KeyboardLine.module.scss";

export interface KeyboardLineProps {
  className?: string;
  children: React.ReactNode;
}

export const KeyboardLine = React.memo(function KeyboardLine({
  className,
  children,
}: KeyboardLineProps) {
  return <div className={classNames(className, styles.line)}>{children}</div>;
});
