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
 * `share_events` row, and expose a transient `hasCopied` flag so callers can
 * show a "Copied!" confirmation.
 */
export function useShareResult() {
  const [hasCopied, setHasCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const share = useCallback((input: ShareResultInput) => {
    const shareText = buildShareText(input);
    void navigator.clipboard.writeText(shareText);

    setHasCopied(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(
      () => setHasCopied(false),
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

  const resetCopied = useCallback(() => setHasCopied(false), []);

  return { hasCopied, share, resetCopied };
}
