"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import s from "./toast.module.css";

type Tone = "ok" | "error";
const ToastContext = createContext<(message: string, tone?: Tone) => void>(() => {});

/** Short confirmations ("Licence added"), announced politely to screen readers. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<{ message: string; tone: Tone; key: number } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const show = useCallback((message: string, tone: Tone = "ok") => {
    if (timer.current) clearTimeout(timer.current);
    setToast({ message, tone, key: Date.now() });
    timer.current = setTimeout(() => setToast(null), 4200);
  }, []);
  useEffect(() => () => void (timer.current && clearTimeout(timer.current)), []);
  return (
    <ToastContext.Provider value={show}>
      {children}
      <div className={s.region} role="status" aria-live="polite">
        {toast ? (
          <div key={toast.key} className={s.toast} data-tone={toast.tone}>
            {toast.message}
          </div>
        ) : null}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}

/** Shows a toast once when a page loads with a flag in its URL, e.g. after a redirect from a form. */
export function FlashToast({ message }: { message: string | null }) {
  const show = useToast();
  useEffect(() => {
    if (message) show(message);
  }, [message, show]);
  return null;
}
