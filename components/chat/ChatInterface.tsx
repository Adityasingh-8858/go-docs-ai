"use client";

import { useChat } from "ai/react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Send } from "lucide-react";
import Message from "./Message";
import { useEffect, useRef } from "react";

interface ChatInterfaceProps {
    fileId: string;
}

export default function ChatInterface({ fileId }: ChatInterfaceProps) {
    const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
        api: "/api/chat",
        body: {
            fileId,
        },
    });

    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    return (
        <div className="flex flex-col h-full">
            {/* Message List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-800/50 rounded-t-lg">
                {messages.length > 0 ? (
                    messages.map((m) => <Message key={m.id} message={m} />)
                ) : (
                    <div className="flex justify-center items-center h-full">
                        <p className="text-gray-400">
                            Ask a question to start chatting with your document.
                        </p>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Chat Input Form */}
            <div className="p-4 bg-gray-900 border-t border-gray-700 rounded-b-lg">
                <form onSubmit={handleSubmit} className="flex items-center space-x-2">
                    <Input
                        value={input}
                        onChange={handleInputChange}
                        placeholder="Ask anything about the document..."
                        className="flex-1"
                        disabled={isLoading}
                    />
                    <Button type="submit" disabled={isLoading}>
                        <Send className="h-5 w-5" />
                    </Button>
                </form>
            </div>
        </div>
    );
}
