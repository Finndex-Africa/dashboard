"use client";
import React, { createContext, useContext, useState, useRef } from "react";

type Toast = { id: string; title: string; description?: string; variant?: "success" | "error" | "info" };
type ToastContextType = { toasts: Toast[]; push: (t: Omit<Toast, "id">) => void; remove: (id: string) => void };

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error("useToast must be used within ToastProvider");
    return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);
    const idCounter = useRef(0);

    const push: ToastContextType["push"] = (t) => {
        const id = `toast-${++idCounter.current}`;
        setToasts((prev) => [...prev, { id, ...t }]);
        setTimeout(() => remove(id), 4000);
    };
    const remove = (id: string) => setToasts((prev) => prev.filter((t) => t.id !== id));
    return (
        <ToastContext.Provider value={{ toasts, push, remove }}>
            {children}
            <div className="fixed bottom-4 right-4 space-y-2 z-50">
                {toasts.map((t) => (
                    <div key={t.id} className={`card px-4 py-3 min-w-[240px] ${t.variant === "success" ? "border-green-200" : t.variant === "error" ? "border-red-200" : ""
                        }`}>
                        <div className="text-sm font-semibold">{t.title}</div>
                        {t.description && <div className="text-xs text-gray-600 mt-1">{t.description}</div>}
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}