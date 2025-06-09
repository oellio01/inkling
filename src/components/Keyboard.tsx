// Keyboard.jsx
import React from "react";
import "./Keyboard.module.css";

// three rows just as in Wordle
const KEY_LAYOUT = [
  "QWERTYUIOP".split(""),
  "ASDFGHJKL".split(""),
  ["Enter", ..."ZXCVBNM".split(""), "Backspace"],
];

type KeyboardProps = {
  onKeyPress: (key: string) => void;
};

export default function Keyboard({ onKeyPress }: KeyboardProps) {
  return (
    <div className="keyboard">
      {KEY_LAYOUT.map((row, i) => (
        <div className="keyboard-row" key={i}>
          {row.map((key) => {
            const classes = ["key", key.length > 1 ? "key-wide" : ""]
              .filter(Boolean)
              .join(" ");

            return (
              <button
                key={key}
                className={classes}
                onClick={() => onKeyPress(key)}
              >
                {key === "Backspace" ? "⌫" : key}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
