import React, { useCallback, useEffect, useRef } from "react";
import classNames from "classnames";
import styles from "./Popup.module.scss";

export type PopupSize = "sm" | "md" | "lg" | "xl";

export interface PopupProps {
  onClose: () => void;
  ariaLabel: string;
  size?: PopupSize;
  variant?: "light" | "dark";
  /**
   * When set, a Back button is rendered instead of the close X. Clicking it
   * calls onBack rather than onClose.
   */
  onBack?: () => void;
  backLabel?: string;
  className?: string;
  children: React.ReactNode;
}

const SIZE_CLASS: Record<PopupSize, string> = {
  sm: styles.sizeSm,
  md: styles.sizeMd,
  lg: styles.sizeLg,
  xl: styles.sizeXl,
};

const FOCUSABLE_SELECTOR =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

/**
 * Shared modal primitive used by every popup in the app.
 *
 * Handles: backdrop click, Escape to close, focus trap, initial focus, and
 * restoring focus to whatever was focused before the popup opened.
 */
export const Popup = React.memo(function Popup({
  onClose,
  ariaLabel,
  size = "md",
  variant = "light",
  onBack,
  backLabel = "Back",
  className,
  children,
}: PopupProps) {
  const popupRef = useRef<HTMLDivElement>(null);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose]
  );

  // Escape to close + focus trap on Tab/Shift+Tab.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose();
        return;
      }
      if (event.key !== "Tab" || !popupRef.current) return;

      const focusable = popupRef.current.querySelectorAll<HTMLElement>(
        FOCUSABLE_SELECTOR
      );
      if (focusable.length === 0) {
        event.preventDefault();
        popupRef.current.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement as HTMLElement | null;

      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  // Move focus into the popup on mount and restore it on unmount.
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    popupRef.current?.focus();
    return () => {
      previouslyFocused?.focus?.();
    };
  }, []);

  return (
    <div
      className={classNames(
        styles.backdrop,
        variant === "dark" && styles.backdropDark
      )}
      onClick={handleBackdropClick}
    >
      <div
        ref={popupRef}
        className={classNames(styles.popup, SIZE_CLASS[size], className)}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        tabIndex={-1}
      >
        {onBack ? (
          <button
            type="button"
            className={styles.backButton}
            onClick={onBack}
          >
            {backLabel}
          </button>
        ) : (
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        )}
        {children}
      </div>
    </div>
  );
});
