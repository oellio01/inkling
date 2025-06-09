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
      <div
        className="absolute top-0 left-0 right-0 bottom-0 bg-black/90 cursor-pointer"
        onClick={close}
      ></div>
      <div
        className="flex flex-col gap-6 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 border border-gray-500/50 bg-black/60 p-3 md:p-7"
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        <div className="flex flex-wrap items-center justify-center gap-1">
          <div className="text-center">{"Yesterday's solution:"}</div>
          <div className="px-1 py-1 bg-gray-500/20 font-mono tracking-widest">
            {yesterdaysAnswer.toUpperCase()}
          </div>
        </div>
      </div>
    </>
  );
}
