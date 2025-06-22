import { useState } from "react";
import { formatTimeInSeconds } from "./formatTimeInSeconds";
import styles from "./Header.module.scss";
import { InfoPopup } from "./InfoPopup";

export function Header({
  timerInSeconds,
  exampleImage,
  exampleAnswer,
}: {
  timerInSeconds: number;
  exampleImage: string;
  exampleAnswer: string;
}) {
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const { minutes, seconds } = formatTimeInSeconds(timerInSeconds);

  return (
    <>
      <div className={styles.headerContainer}>
        <div className={styles.left}></div>
        <div className={styles.center}>
          <div className={styles.timer}>
            <div>{minutes}</div>
            <div>:</div>
            <div>{seconds}</div>
          </div>
        </div>
        <div className={styles.right}>
          <button
            className={styles.infoButton}
            onClick={() => setIsInfoOpen(true)}
          >
            i
          </button>
        </div>
      </div>
      {isInfoOpen && (
        <InfoPopup
          close={() => setIsInfoOpen(false)}
          exampleImage={exampleImage}
          exampleAnswer={exampleAnswer}
        />
      )}
    </>
  );
}
