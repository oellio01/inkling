import { useEffect, useRef } from "react";
import styles from "./InfoPopup.module.scss";
import Image from "next/image";

export interface InfoPopupProps {
  isOpen: boolean;
  close: () => void;
}

export function InfoPopup({ isOpen, close }: InfoPopupProps) {
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

  useEffect(() => {
    const dialog = dialogRef.current;
    dialog?.addEventListener("close", close);
    return () => {
      dialog?.removeEventListener("close", close);
    };
  }, [close]);

  const handleClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target === dialogRef.current) {
      close();
    }
  };

  return (
    <dialog ref={dialogRef} className={styles.popup} onClick={handleClick}>
      <h2 className={styles.title}>How To Play</h2>
      <p className={styles.description}>Guess the word based on the image.</p>
      <div className={styles.imageContainer}>
        <Image
          src={"/games/1.jpg"}
          alt="Example Inkling"
          fill
          className={styles.image}
          sizes="(max-width: 350px) 90vw, 350px"
        />
      </div>
      <p className={styles.answer}>Answer: CENTURY</p>
      <p className={styles.answer}>Explanation: Cent + Cherry</p>
      <p className={styles.hintText}>
        Click the eye to reveal the next letter of the answer. Each hint adds{" "}
        <b>30 seconds</b> to your time.
      </p>
    </dialog>
  );
}
