import classNames from "classnames";

export interface KeyboardLineProps {
  className?: string;
  children: React.JSX.Element | React.JSX.Element[];
}

export function KeyboardLine({ className, children }: KeyboardLineProps) {
  return (
    <div className={classNames(className, "flex justify-center min-w-0")}>
      {children}
    </div>
  );
}
