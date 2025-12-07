import { useState } from "react";
import styles from "./InfoPopup.module.scss";
import Image from "next/image";

export interface InfoPopupProps {
  close: () => void;
}

export const InfoPopup = ({ close }: InfoPopupProps) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const images = ["/info_0.jpg", "/info_1.jpg", "/info_2.jpg", "/info_3.jpg"];

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      close();
    }
  };

  const handleNextExample = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const isLastImage = currentImageIndex === images.length - 1;

  return (
    <div className={styles.backdrop} onClick={handleBackdropClick}>
      <div className={styles.popup}>
        <button
          className={styles.closeButton}
          onClick={close}
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
          <button className={styles.playButton} onClick={close}>
            Got it! Let&apos;s Play
          </button>
        </div>
      </div>
    </div>
  );
};
