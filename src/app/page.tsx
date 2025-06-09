"use client";

// Game.jsx
import React, { useState, useEffect, useCallback } from "react";
import { Header } from "../components/Header";
import { formatTimeInSeconds } from "../components/formatTimeInSeconds";
import { Keyboard } from "../components/Keyboard";
import { InfoPopup } from "../components/InfoPopup";

export default function Game() {
  const timeInSeconds = 0;
  const [guess, setGuess] = useState("");
  const [isShowingInfoPopup, setIsShowingInfoPopup] = useState(false);
  const { minutes, seconds } = formatTimeInSeconds(timeInSeconds);

  // call this whenever user types or clicks a key
  const onKeyPress = useCallback(
    (key: string) => {
      if (key === "Enter") {
        // Submit guess logic here
        console.log("Submitted guess:", guess);
        setGuess(""); // Clear after submit
      } else if (key === "Backspace") {
        setGuess((g) => g.slice(0, -1));
      } else if (/^[A-Z]$/.test(key)) {
        setGuess((g) => g + key);
      }
    },
    [guess]
  );

  // also listen to real keyboard
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "Enter") onKeyPress("Enter");
      else if (e.key === "Backspace") onKeyPress("Backspace");
      else if (/^[a-zA-Z]$/.test(e.key)) onKeyPress(e.key.toUpperCase());
    };
    window.addEventListener("keydown", down);
    return () => window.removeEventListener("keydown", down);
  }, [onKeyPress]);

  return (
    <>
      <div className="flex flex-col flex-1 relative">
        {isShowingInfoPopup && (
          <InfoPopup
            close={() => {
              setIsShowingInfoPopup(false);
            }}
            yesterdaysAnswer={"Hello!"}
          />
        )}
        <Header
          onClickInfo={() => {
            setIsShowingInfoPopup(true);
          }}
          timerInSeconds={0}
        />
      </div>
      <div className="game">
        <div className="guess">{guess}</div>
        <Keyboard onKeyPress={onKeyPress} />
      </div>
    </>
  );
}
