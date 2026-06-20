import styles from "./FilterModal.module.css";
import { useState, useEffect } from "react";

interface FilterModalProps {
  open: boolean;
  onClose: () => void;
  onApply: (value: string) => void;
  defaultValue?: string;
}

export default function FilterModal({
  open,
  onClose,
  onApply,
  defaultValue = "",
}: FilterModalProps) {

  const [text, setText] = useState(defaultValue);


  // Restore last applied value when opening
  useEffect(() => {
    if (open) {
      setText(defaultValue);
    }
  }, [open, defaultValue]);


  if (!open) {
    return null;
  }


  const handleApply = () => {
    onApply(text.trim());
    onClose();
  };


  const handleClear = () => {
    setText("");
  };


  const handleClose = () => {
    // Cancel changes and restore previous value
    setText(defaultValue);

    onClose();
  };


  return (
    <div className={styles.overlay}>

      <div className={styles.modal}>

        <h3>🔎 Filter</h3>


        <textarea
          className={styles.textarea}
          value={text}
          onChange={(e) =>
            setText(e.target.value)
          }
          rows={6}
          placeholder="Enter filter text..."
        />


        <div className={styles.actions}>


          <button
            className={styles.button}
            onClick={handleApply}
          >
            ✅ Apply
          </button>


          <button
            className={styles.button}
            onClick={handleClear}
          >
            🧹 Clear
          </button>


          <button
            className={styles.button}
            onClick={handleClose}
          >
            ❌ Close
          </button>


        </div>


      </div>

    </div>
  );
}