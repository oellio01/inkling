import { useEffect, useRef, useState, useCallback } from "react";
import React from "react";
import styles from "./InfoPopup.module.scss";
import Image from "next/image";

export interface InfoPopupProps {
  isOpen: boolean;
  close: () => void;
}

export const InfoPopup = React.memo(function InfoPopup({
  isOpen,
  close,
}: InfoPopupProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const images = ["/info_0.jpg", "/info_1.jpg", "/info_2.jpg", "/info_3.jpg"];

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog) {
      if (isOpen) {
        dialog.showModal();
        // Reset to first image when opening
        setCurrentImageIndex(0);
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

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDialogElement>) => {
      if (e.target === dialogRef.current) {
        close();
      }
    },
    [close]
  );

  const handleNextExample = useCallback(() => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  }, [images.length]);

  const handlePlay = useCallback(() => {
    close();
  }, [close]);

  const isLastImage = currentImageIndex === images.length - 1;

  return (
    <dialog ref={dialogRef} className={styles.popup} onClick={handleClick}>
      <button
        className={styles.closeButton}
        onClick={(e) => {
          e.stopPropagation();
          close();
        }}
        aria-label="Close"
      >
        ×
      </button>
      <div className={styles.imageContainer}>
        <Image
          src={images[currentImageIndex]}
          alt={`Example Inkling ${currentImageIndex + 1}`}
          fill
          sizes="(max-width: 400px) 90vw, 400px"
        />
      </div>

      <div className={styles.buttonContainer}>
        {!isLastImage && (
          <button className={styles.nextButton} onClick={handleNextExample}>
            See another example
          </button>
        )}
        <button className={styles.playButton} onClick={handlePlay}>
          Got it! Let&apos;s Play
        </button>
      </div>
    </dialog>
  );
});
