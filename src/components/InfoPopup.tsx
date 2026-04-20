import { useState } from "react";
import Image from "next/image";
import styles from "./InfoPopup.module.scss";
import { Popup } from "./ui/Popup";

export interface InfoPopupProps {
  close: () => void;
}

const IMAGES = ["/info_0.jpg", "/info_1.jpg", "/info_2.jpg", "/info_3.jpg"];

export const InfoPopup = ({ close }: InfoPopupProps) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const handleNextExample = () => {
    setCurrentImageIndex((prev) => (prev + 1) % IMAGES.length);
  };

  const isLastImage = currentImageIndex === IMAGES.length - 1;

  return (
    <Popup onClose={close} ariaLabel="Welcome to Inkling" size="md">
      <h1 className={styles.title}>Welcome to Inkling</h1>
      <p className={styles.description}>
        Inkling is a daily game where you have to guess the word depicted. Use
        the hint button if you get stuck.
      </p>
      <div className={styles.imageContainer}>
        <Image
          src={IMAGES[currentImageIndex]}
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
    </Popup>
  );
};
