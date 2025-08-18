import ChatInterface from "@/components/chat/ChatInterface";
import { auth } from "@clerk/nextjs/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { notFound } from "next/navigation";
import { FileText } from "lucide-react";

interface PageProps {
    params: {
        fileId: string;
    }
}

export default async function DocumentChatPage({ params }: PageProps) {
    const { fileId } = params;
    const { userId } = auth();
    if (!userId) return notFound();

    const supabase = getSupabaseAdmin();
    const { data: document, error } = await supabase
        .from("documents")
        .select("id, file_name, user_id")
        .eq("id", fileId)
        .single();

    // Check if document exists and belongs to the user
    if (error || !document || document.user_id !== userId) {
        notFound();
    }

    return (
        <div className="flex flex-col h-[calc(100vh-8rem)]">
            <div className="mb-4">
                <h1 className="text-3xl font-bold flex items-center">
                    <FileText className="mr-3 text-purple-400" />
                    Chat with <span className="truncate ml-2">{document.file_name}</span>
                </h1>
                <p className="text-gray-400">Ask questions and get answers directly from your document.</p>
            </div>

            {/* The ChatInterface component will fill the remaining height */}
            <div className="flex-1">
                <ChatInterface fileId={document.id} />
            </div>
        </div>
    );
}
