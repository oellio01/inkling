import { useEffect, useRef } from "react";
import styles from "./InfoPopup.module.scss";
import Image from "next/image";

export interface InfoPopupProps {
  isOpen: boolean;
  close: () => void;
  exampleImage: string;
  exampleAnswer: string;
}

export function InfoPopup({
  isOpen,
  close,
  exampleImage,
  exampleAnswer,
}: InfoPopupProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog) {
      if (isOpen) {
        dialog.showModal();
      } else {
        dialog.close();
      }
    }
  }, [isOpen]);

  // When the dialog is closed by the browser (e.g. with the Escape key),
  // we need to call the `close` prop to sync the state.
  useEffect(() => {
    const dialog = dialogRef.current;
    dialog?.addEventListener("close", close);
    return () => {
      dialog?.removeEventListener("close", close);
    };
  }, [close]);

  return (
    <dialog ref={dialogRef} className={styles.popup}>
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
    </dialog>
  );
}
