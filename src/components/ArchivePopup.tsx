import { useCallback, useMemo } from "react";
import React from "react";
import Image from "next/image";
import styles from "./ArchivePopup.module.scss";
import { GAMES } from "../../public/game_data";
import { useCompletedGames } from "../hooks/useCompletedGames";
import { IconCheck } from "@tabler/icons-react";

export interface ArchivePopupProps {
  close: () => void;
  currentGameIndex: number;
  maxGameIndex: number;
  onSelectGame: (index: number) => void;
}

export const ArchivePopup = React.memo(function ArchivePopup({
  close,
  currentGameIndex,
  maxGameIndex,
  onSelectGame,
}: ArchivePopupProps) {
  const { isCompleted, loading } = useCompletedGames();

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      close();
    }
  };

  const handleGameClick = useCallback(
    (gameIndex: number) => {
      close();
      onSelectGame(gameIndex);
    },
    [close, onSelectGame]
  );

  return (
    <div className={styles.backdrop} onClick={handleBackdropClick}>
      <div className={styles.popup}>
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
      </div>
    </div>
  );
});
