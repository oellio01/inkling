import { useState, useEffect, useRef, useCallback } from "react";
import React from "react";
import styles from "./SuggestPopup.module.scss";
import supabase from "../app/supabaseClient";
import { useUser } from "../providers/UserProvider";

export const SuggestPopup = React.memo(function SuggestPopup({
  isOpen,
  close,
}: {
  isOpen: boolean;
  close: () => void;
}) {
  const [suggestedWord, setSuggestedWord] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const { user } = useUser();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog) {
      if (isOpen) {
        dialog.showModal();
      } else {
        dialog.close();
      }
    }
  }, [isOpen]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    dialog.addEventListener("close", close);
    return () => {
      dialog.removeEventListener("close", close);
    };
  }, [close]);

  const handleDialogClick = useCallback(
    (e: React.MouseEvent<HTMLDialogElement>) => {
      if (e.target === dialogRef.current) {
        close();
      }
    },
    [close]
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setLoading(true);
      setError(null);
      // Insert into Supabase
      const { error } = await supabase
        .from("game_suggestion")
        .insert([
          { suggested_word: suggestedWord, description, user_id: user?.id },
        ])
        .select();
      setLoading(false);
      if (error) {
        setError(error.message);
        return;
      }
      setSuccess(true);
      setSuggestedWord("");
      setDescription("");
      setTimeout(() => {
        setSuccess(false);
        close();
      }, 1500);
    },
    [suggestedWord, description, user?.id, close]
  );

  return (
    <dialog
      ref={dialogRef}
      className={styles.popup}
      onClick={handleDialogClick}
    >
      <form onSubmit={handleSubmit} method="dialog">
        <h2 className={styles.title}>Suggest an Inkling!</h2>
        <input
          type="text"
          value={suggestedWord}
          onChange={(e) => setSuggestedWord(e.target.value)}
          placeholder="Suggested word (e.g. CENTURY)"
          required
          minLength={2}
          maxLength={50}
          disabled={loading || success}
          className={styles.input}
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="How should it be drawn..."
          required
          minLength={3}
          maxLength={500}
          disabled={loading || success}
          className={styles.textarea}
        />
        <button
          type="submit"
          className={styles.submit}
          disabled={
            loading || suggestedWord.length < 2 || description.length < 3
          }
        >
          {loading ? "Submitting..." : "Submit"}
        </button>
        {success && (
          <div className={styles.success}>Thank you for your suggestion!</div>
        )}
        {error && <div className={styles.error}>{error}</div>}
      </form>
    </dialog>
  );
});
