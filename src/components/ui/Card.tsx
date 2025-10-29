import React from "react";

type CardProps = {
    children: React.ReactNode;
    className?: string;
    interactive?: boolean;
};

export default function Card({ children, className = "", interactive }: CardProps) {
    return (
        <div className={`card ${interactive ? "card-hover" : ""} ${className}`}>{children}</div>
    );
}

export function CardHeader({ children, className = "" }: { children: React.ReactNode; className?: string }) {
    return <div className={`p-4 border-b border-gray-100 ${className}`}>{children}</div>;
}

export function CardContent({ children, className = "" }: { children: React.ReactNode; className?: string }) {
    return <div className={`p-4 ${className}`}>{children}</div>;
}

export function CardFooter({ children, className = "" }: { children: React.ReactNode; className?: string }) {
    return <div className={`p-4 border-t border-gray-100 ${className}`}>{children}</div>;
}