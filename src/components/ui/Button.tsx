"use client";
import React from "react";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: "primary" | "secondary" | "ghost";
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    fullWidth?: boolean;
};

export default function Button({
    variant = "primary",
    className = "",
    leftIcon,
    rightIcon,
    fullWidth,
    children,
    ...props
}: ButtonProps) {
    const base = "btn";
    const variants: Record<string, string> = {
        primary: "btn-primary",
        secondary: "btn-secondary",
        ghost: "bg-transparent text-gray-700 hover:bg-gray-100",
    };

    return (
        <button
            className={`${base} ${variants[variant]} ${fullWidth ? "w-full" : ""} ${className}`}
            {...props}
        >
            {leftIcon && <span className="mr-2">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="ml-2">{rightIcon}</span>}
        </button>
    );
}