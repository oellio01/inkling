import { useCallback, useEffect, useState } from "react";

export function useIsPageVisible() {
  const [visibilityState, setVisibilityState] =
    useState<DocumentVisibilityState>();

  const updateVisibilityState = useCallback(() => {
    setVisibilityState(document.visibilityState);
  }, []);

  useEffect(updateVisibilityState, [updateVisibilityState]);

  useEffect(() => {
    document.addEventListener("visibilitychange", updateVisibilityState);
    return () => {
      document.removeEventListener("visibilitychange", updateVisibilityState);
    };
  }, [updateVisibilityState]);

  return visibilityState != null ? visibilityState === "visible" : undefined;
}
