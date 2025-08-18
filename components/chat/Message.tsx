import { cn } from "@/lib/utils";
import { Message as VercelMessage } from "ai";
import { Bot, User } from "lucide-react";

interface MessageProps {
    message: VercelMessage;
}

export default function Message({ message }: MessageProps) {
    const isUser = message.role === "user";

    return (
        <div className={cn("flex items-start space-x-4 py-4", { "justify-end": isUser })}>
            <div className={cn("flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center", {
                "bg-purple-600 text-white": !isUser,
                "bg-gray-600 text-white": isUser,
            })}>
                {isUser ? <User size={24} /> : <Bot size={24} />}
            </div>
            <div className={cn("p-3 rounded-lg max-w-lg", {
                "bg-gray-700 text-white": !isUser,
                "bg-blue-600 text-white": isUser,
            })}>
                <div className="prose prose-invert prose-p:my-0">
                    {message.content}
                </div>
            </div>
        </div>
    );
}
