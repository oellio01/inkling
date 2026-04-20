import { useCallback, useEffect, useRef, useState } from "react";
import supabase from "../app/supabaseClient";
import { formatTimeInSeconds } from "./formatTimeInSeconds";

const COPY_FEEDBACK_DURATION_MS = 2000;

export interface ShareResultInput {
  gameId: number;
  timeInSeconds: number;
  guessCount: number;
  hintCount: number;
  userId: string | null | undefined;
}

function buildShareText({
  gameId,
  timeInSeconds,
  guessCount,
  hintCount,
}: Omit<ShareResultInput, "userId">): string {
  const { minutes, seconds } = formatTimeInSeconds(timeInSeconds);
  return `Inkling #${gameId} - ${minutes}:${seconds} - ${guessCount} guesses - ${hintCount} hints\n${window.location.href}`;
}

/**
 * Encapsulates the "share your result" flow used by both the results popup
 * and the stats page: copy a formatted summary to the clipboard, record a
 * `share_events` row, and remember which gameId was most recently shared so
 * callers can render a transient "Copied!" confirmation via `hasCopiedFor`.
 *
 * Callers check `hasCopiedFor(gameId)` rather than a boolean, which means
 * navigating to a different game naturally hides the feedback without
 * needing an explicit reset.
 */
export function useShareResult() {
  const [copiedGameId, setCopiedGameId] = useState<number | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const share = useCallback((input: ShareResultInput) => {
    const shareText = buildShareText(input);
    void navigator.clipboard.writeText(shareText);

    setCopiedGameId(input.gameId);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(
      () => setCopiedGameId(null),
      COPY_FEEDBACK_DURATION_MS
    );

    supabase
      .from("share_events")
      .insert([
        {
          game_id: input.gameId,
          user_id: input.userId ?? null,
          share_method: "copy",
        },
      ])
      .then(({ error }) => {
        if (error) console.log("Share event insert error:", error.message);
      });
  }, []);

  const hasCopiedFor = useCallback(
    (gameId: number) => copiedGameId === gameId,
    [copiedGameId]
  );

  return { hasCopiedFor, share };
}
