import { useCallback, useState } from "react";
import { AlertCircle, ArrowRightLeft, CalendarCheck, CheckCircle2, CircleX, Info, LogIn, LogOut, PartyPopper, Pencil, Phone, Plus, Trash2, X } from "lucide-react";
import { ToastContext } from "./toast-context";
import "./toast.css";

let nextToastId = 0;

const toastIcons = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
  auth: LogIn,
  logout: LogOut,
  created: Plus,
  updated: Pencil,
  deleted: Trash2,
  moved: ArrowRightLeft,
  applied: CalendarCheck,
  interview: Phone,
  offer: PartyPopper,
  declined: CircleX,
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const toast = useCallback((message, type = "success") => {
    const id = ++nextToastId;
    setToasts((current) => [...current, { id, message, type }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== id));
    }, 4500);
  }, []);

  function dismissToast(id) {
    setToasts((current) => current.filter((item) => item.id !== id));
  }

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="toast-region" aria-live="polite" aria-relevant="additions">
        {toasts.map(({ id, message, type }) => {
          const Icon = toastIcons[type] || Info;
          return (
            <div className={`toast toast-${type}`} key={id} role={type === "error" ? "alert" : "status"}>
              <Icon size={19} aria-hidden="true" />
              <span>{message}</span>
              <button type="button" onClick={() => dismissToast(id)} aria-label="Dismiss notification">
                <X size={17} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
