import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Supports two APIs:
 *  - <Toast toast={{type, text}} onDismiss={fn} />            (older)
 *  - <Toast type="success" message="..." onClose={fn} />      (newer)
 */
export default function Toast(props) {
  const toast = props.toast || (props.message ? { type: props.type, text: props.message } : null);
  const dismiss = props.onDismiss || props.onClose;

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => dismiss && dismiss(), 4500);
    return () => clearTimeout(t);
  }, [toast, dismiss]);

  return (
    <AnimatePresence>
      {toast && <ToastContent toast={toast} dismiss={dismiss} />}
    </AnimatePresence>
  );
}

function ToastContent({ toast, dismiss }) {

  const type = toast.type || "info";
  const isSuccess = type === "success";
  const isWarning = type === "warning";
  const isError = type === "error";

  const palette = isSuccess
    ? { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-800", icon: "text-emerald-600", accent: "bg-emerald-500" }
    : isWarning
    ? { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-800", icon: "text-amber-600", accent: "bg-amber-500" }
    : isError
    ? { bg: "bg-rose-50", border: "border-rose-200", text: "text-rose-700", icon: "text-rose-600", accent: "bg-rose-500" }
    : { bg: "bg-sky-50", border: "border-sky-200", text: "text-sky-800", icon: "text-sky-600", accent: "bg-sky-500" };

  const iconPath = isSuccess
    ? "M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
    : isWarning
    ? "M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
    : isError
    ? "M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
    : "M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z";

  const label = isSuccess ? "Success" : isWarning ? "Warning" : isError ? "Error" : "Info";
  const text = toast.text || toast.message;

  return (
    <motion.div
      role="status"
      aria-live="polite"
      initial={{ opacity: 0, y: 32, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 320, damping: 28 }}
      className="fixed inset-x-4 bottom-20 z-[100] mx-auto max-w-md sm:inset-x-auto sm:bottom-6 sm:right-6 sm:left-auto sm:mx-0 sm:max-w-sm"
    >
      <div className={`relative overflow-hidden rounded-2xl border ${palette.border} ${palette.bg} shadow-soft-lg`}>
        <div className={`absolute inset-y-0 left-0 w-1 ${palette.accent}`} />
        <div className="flex items-start gap-3 py-3 pl-5 pr-3">
          <svg className={`mt-0.5 h-5 w-5 shrink-0 ${palette.icon}`} fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d={iconPath} clipRule="evenodd" />
          </svg>
          <div className={`min-w-0 flex-1 ${palette.text}`}>
            <p className="text-sm font-semibold">{label}</p>
            {text && <p className="mt-0.5 text-xs leading-relaxed opacity-90 break-words">{text}</p>}
          </div>
          <button
            type="button"
            onClick={dismiss}
            className={`-mr-1 ml-1 shrink-0 rounded-lg p-1.5 opacity-60 transition-opacity hover:opacity-100 ${palette.text}`}
            aria-label="Dismiss"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </motion.div>
  );
}
