import { useEffect } from "react";
import { createPortal } from "react-dom";
import styles from "./InfoPopup.module.scss";
import Image from "next/image";

export interface InfoPopupProps {
  close: () => void;
  exampleImage: string;
  exampleAnswer: string;
}

export function InfoPopup({
  close,
  exampleImage,
  exampleAnswer,
}: InfoPopupProps) {
  useEffect(() => {
    const keyboardListener = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        close();
      }
    };

    document.addEventListener("keydown", keyboardListener);
    return () => {
      document.removeEventListener("keydown", keyboardListener);
    };
  }, [close]);

  const popupContent = (
    <>
      <div className={styles.overlay} onClick={close} />
      <div className={styles.popup}>
        <h2 className={styles.title}>How To Play</h2>
        <p className={styles.description}>Guess the word based on the image.</p>
        <p className={styles.subtitle}>Example:</p>
        <div className={styles.imageContainer}>
          <Image
            src={exampleImage}
            alt="Example Rebus"
            fill
            className={styles.image}
          />
        </div>
        <p className={styles.answer}>{exampleAnswer.toUpperCase()}</p>
      </div>
    </>
  );

  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(popupContent, document.body);
}
