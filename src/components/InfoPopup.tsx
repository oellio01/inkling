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
      <div className={styles.imageContainer}>
        <Image
          src={"/info.png"}
          alt="Example Inkling"
          fill
          sizes="(max-width: 400px) 90vw, 400px"
        />
      </div>
      <button className={styles.playButton} onClick={close}>
        Got it! Let&apos;s Play
      </button>
    </dialog>
  );
}
