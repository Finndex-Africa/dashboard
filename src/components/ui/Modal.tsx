"use client";
import React, { useEffect } from "react";

type ModalProps = {
    open: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
};

export default function Modal({ open, onClose, title, children }: ModalProps) {
    useEffect(() => {
        if (open) document.body.style.overflow = "hidden";
        return () => { document.body.style.overflow = ""; };
    }, [open]);

    if (!open) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40" onClick={onClose} />
            <div className="relative z-10 w-full max-w-lg card">
                {title && <div className="p-4 border-b border-gray-100 font-semibold">{title}</div>}
                <div className="p-4">{children}</div>
            </div>
        </div>
    );
}