import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import "./confirm-dialog.css";

function ConfirmDialog({
  title,
  description,
  confirmLabel,
  placement = "center",
  variant = "danger",
  isConfirming = false,
  onCancel,
  onConfirm,
}) {
  useEffect(() => {
    function closeOnEscape(event) {
      if (event.key === "Escape" && !isConfirming) onCancel();
    }
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [isConfirming, onCancel]);

  return (
    <div
      className={`confirm-dialog-backdrop${placement === "top-right" ? " top-right" : ""}`}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isConfirming) onCancel();
      }}
    >
      <section className="confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="confirm-dialog-title" aria-describedby="confirm-dialog-description">
        <div className={`confirm-dialog-icon ${variant}`} aria-hidden="true">
          <AlertTriangle size={21} />
        </div>
        <h2 id="confirm-dialog-title">{title}</h2>
        <p id="confirm-dialog-description">{description}</p>
        <div className="confirm-dialog-actions">
          <button className="confirm-dialog-cancel" type="button" onClick={onCancel} disabled={isConfirming}>
            Cancel
          </button>
          <button className={`confirm-dialog-submit ${variant}`} type="button" onClick={onConfirm} disabled={isConfirming} autoFocus>
            {isConfirming ? "Working..." : confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}

export default ConfirmDialog;
