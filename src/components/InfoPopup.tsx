import { useEffect } from "react";

export interface InfoPopupProps {
  close: () => void;
  yesterdaysAnswer: string;
}

export function InfoPopup({ close, yesterdaysAnswer }: InfoPopupProps) {
  useEffect(() => {
    const keyboardListener = (event: KeyboardEvent) => {
      const key = event.key;
      if (key === "Escape") {
        close();
      }
    };

    document.addEventListener("keydown", keyboardListener);
    return () => {
      document.removeEventListener("keydown", keyboardListener);
    };
  }, [close]);

  return (
    <>
      <div>{yesterdaysAnswer.toUpperCase()}</div>
    </>
  );
}
