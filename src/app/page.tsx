"use client";

// Game.jsx
import React, { useState, useEffect, useCallback } from "react";
import { Navbar, NavbarGroup, NavbarHeading } from "@blueprintjs/core";
import Keyboard from "../components/Keyboard";

export default function Game() {
  const [guess, setGuess] = useState("");

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
      <Navbar>
        <NavbarGroup>
          <NavbarHeading>Scratch</NavbarHeading>
        </NavbarGroup>
      </Navbar>
      <div className="game">
        <div className="guess">{guess}</div>
        <Keyboard onKeyPress={onKeyPress} />
      </div>
    </>
  );
}
