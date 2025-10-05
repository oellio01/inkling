import { useEffect, useRef, useCallback, useMemo } from "react";
import React from "react";
import Image from "next/image";
import styles from "./ArchivePopup.module.scss";
import { GAMES } from "../../public/game_data";
import { useCompletedGames } from "../hooks/useCompletedGames";
import { IconCheck } from "@tabler/icons-react";

export interface ArchivePopupProps {
  isOpen: boolean;
  close: () => void;
  currentGameIndex: number;
  maxGameIndex: number;
  onSelectGame: (index: number) => void;
}

export const ArchivePopup = React.memo(function ArchivePopup({
  isOpen,
  close,
  currentGameIndex,
  maxGameIndex,
  onSelectGame,
}: ArchivePopupProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const { isCompleted, loading, refreshArchive } = useCompletedGames();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog) {
      if (isOpen) {
        dialog.showModal();
        refreshArchive();
      } else {
        dialog.close();
      }
    }
  }, [isOpen, refreshArchive]);

  useEffect(() => {
    const dialog = dialogRef.current;
    dialog?.addEventListener("close", close);
    return () => {
      dialog?.removeEventListener("close", close);
    };
  }, [close]);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLDialogElement>) => {
      if (e.target === dialogRef.current) close();
    },
    [close]
  );

  const handleGameClick = useCallback(
    (gameIndex: number) => {
      close();
      onSelectGame(gameIndex);
    },
    [close, onSelectGame]
  );

  return (
    <dialog
      ref={dialogRef}
      className={styles.popup}
      onClick={handleBackdropClick}
    >
      <h2 className={styles.title}>Game Archive</h2>
      <div className={styles.grid}>
        {useMemo(
          () =>
            GAMES.slice(0, maxGameIndex)
              .reverse()
              .map((game, index) => {
                const gameIndexInArray = maxGameIndex - 1 - index;
                const isGameCompleted = !loading && isCompleted(game.id);

                return (
                  <div
                    key={game.id}
                    className={`${styles.gameItem} ${
                      gameIndexInArray === currentGameIndex
                        ? styles.currentGame
                        : ""
                    } ${isGameCompleted ? styles.completed : ""}`}
                    onClick={() => handleGameClick(gameIndexInArray)}
                  >
                    <div className={styles.imageContainer}>
                      <Image
                        src={game.image}
                        alt={`Inkling ${game.id}`}
                        fill
                        className={styles.image}
                        sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                      />
                      {isGameCompleted && (
                        <div className={styles.completionBadge}>
                          <IconCheck size={16} />
                        </div>
                      )}
                    </div>
                    <div className={styles.gameNumber}>#{game.id}</div>
                  </div>
                );
              }),
          [
            maxGameIndex,
            currentGameIndex,
            loading,
            isCompleted,
            handleGameClick,
          ]
        )}
      </div>
    </dialog>
  );
});
