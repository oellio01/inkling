import styles from "./FarewellPopup.module.scss";
import { Popup } from "./ui/Popup";
import { GAMES } from "../data/games";

export interface FarewellPopupProps {
  close: () => void;
  onPlayArchive: () => void;
}

export const FarewellPopup = ({ close, onPlayArchive }: FarewellPopupProps) => {
  return (
    <Popup onClose={close} ariaLabel="Thank you for playing Inkling" size="md">
      <h1 className={styles.title}>Thank you for playing Inkling</h1>
      <p className={styles.description}>
        After {GAMES.length} daily puzzles, I&apos;ve decided to stop publishing
        new Inklings. Thank you so much to everyone who has played along. If
        you&apos;d like to get in touch, email me at{" "}
        <a className={styles.link} href="mailto:oellio01@gmail.com">
          oellio01@gmail.com
        </a>
        .
      </p>
      <p className={styles.description}>
        The good news: every puzzle ever made is still here. Jump into the
        archive and play through them all at your own pace, any time you like.
      </p>

      <div className={styles.buttonContainer}>
        <button className={styles.playButton} onClick={onPlayArchive}>
          Play from the archive
        </button>
      </div>
    </Popup>
  );
};
