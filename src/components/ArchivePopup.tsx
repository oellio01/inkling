import { useCallback, useMemo } from "react";
import React from "react";
import Image from "next/image";
import classNames from "classnames";
import { IconCheck } from "@tabler/icons-react";
import styles from "./ArchivePopup.module.scss";
import { GAMES } from "../data/games";
import { useCompletedGames } from "../hooks/useCompletedGames";
import { Popup } from "./ui/Popup";

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

  const handleGameClick = useCallback(
    (gameIndex: number) => {
      close();
      onSelectGame(gameIndex);
    },
    [close, onSelectGame]
  );

  const items = useMemo(
    () =>
      GAMES.slice(0, maxGameIndex)
        .reverse()
        .map((game, index) => {
          const gameIndexInArray = maxGameIndex - 1 - index;
          const isGameCompleted = !loading && isCompleted(game.id);
          return { game, gameIndexInArray, isGameCompleted };
        }),
    [maxGameIndex, loading, isCompleted]
  );

  return (
    <Popup
      onClose={close}
      ariaLabel="Game Archive"
      size="xl"
      variant="dark"
      className={styles.popupContent}
    >
      <h2 className={styles.title}>Game Archive</h2>
      <div className={styles.grid}>
        {items.map(({ game, gameIndexInArray, isGameCompleted }) => (
          <div
            key={game.id}
            className={classNames(styles.gameItem, {
              [styles.currentGame]: gameIndexInArray === currentGameIndex,
              [styles.completed]: isGameCompleted,
            })}
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
        ))}
      </div>
    </Popup>
  );
});
