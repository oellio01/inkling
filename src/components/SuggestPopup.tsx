import { useState } from "react";
import styles from "./SuggestPopup.module.scss";
import supabase from "../app/supabaseClient";
import { useUser } from "../providers/UserProvider";

interface SuggestPopupProps {
  close: () => void;
}

export const SuggestPopup = ({ close }: SuggestPopupProps) => {
  const [suggestedWord, setSuggestedWord] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useUser();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase
      .from("game_suggestion")
      .insert([
        { suggested_word: suggestedWord, description, user_id: user?.id },
      ]);

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
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      close();
    }
  };

  return (
    <div className={styles.backdrop} onClick={handleBackdropClick}>
      <div className={styles.popup}>
        <form onSubmit={handleSubmit}>
          <h2 className={styles.title}>Suggest an Inkling!</h2>
          <input
            type="text"
            value={suggestedWord}
            onChange={(e) => setSuggestedWord(e.target.value)}
            placeholder="Suggested word (e.g. CENTURY)"
            required
            minLength={2}
            maxLength={50}
            className={styles.input}
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="How should it be drawn..."
            required
            minLength={3}
            maxLength={500}
            className={styles.textarea}
          />
          <button type="submit" className={styles.submit} disabled={loading}>
            {loading ? "Submitting..." : "Submit"}
          </button>
          {success && (
            <div className={styles.success}>Thank you for your suggestion!</div>
          )}
          {error && <div className={styles.error}>{error}</div>}
        </form>
      </div>
    </div>
  );
};
