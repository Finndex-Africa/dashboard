"use client";
import React, { useState, useRef } from "react";

type Message = { id: string; from: "me" | "other"; text: string; at: string };

export default function MessageThread({ initial = [] as Message[] }: { initial?: Message[] }) {
    const [messages, setMessages] = useState<Message[]>(initial);
    const [text, setText] = useState("");
    const idCounter = useRef(0);

    const send = () => {
        if (!text.trim()) return;
        const timestamp = new Date().toISOString();
        setMessages((m) => [...m, { id: `msg-${++idCounter.current}`, from: "me", text, at: timestamp }]);
        setText("");
    };

    return (
        <div className="card p-4 flex flex-col h-96">
            <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                {messages.map((m) => (
                    <div key={m.id} className={`max-w-[75%] ${m.from === "me" ? "ml-auto" : ""}`}>
                        <div className={`rounded-lg px-3 py-2 text-sm ${m.from === "me" ? "bg-blue-600 text-white" : "bg-gray-100"}`}>{m.text}</div>
                    </div>
                ))}
            </div>
            <div className="mt-3 flex gap-2">
                <input className="input" value={text} onChange={(e) => setText(e.target.value)} placeholder="Write a message" />
                <button className="btn btn-primary" onClick={send}>Send</button>
            </div>
        </div>
    );
}