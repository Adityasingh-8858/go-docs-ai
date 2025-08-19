"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/Dialog";
import { Loader2, FileText } from "lucide-react";

export default function SummarizeButton({ fileId }: { fileId: string }) {
    const [summary, setSummary] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isOpen, setIsOpen] = useState(false);

    const handleSummarize = async () => {
        setIsLoading(true);
        setError(null);
        setSummary(null);

        try {
            const res = await fetch("/api/summarize", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ fileId }),
            });

            if (!res.ok) {
                throw new Error("Failed to get summary.");
            }

            const data = await res.json();
            setSummary(data.summary);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" onClick={() => !isOpen && handleSummarize()}>
                    <FileText className="mr-2 h-4 w-4" />
                    Summarize
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-3xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Document Summary</DialogTitle>
                    <DialogDescription>
                        An AI-generated summary of the key points in your document.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    {isLoading && (
                        <div className="flex flex-col items-center justify-center space-y-2">
                            <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
                            <p className="text-muted-foreground">Generating summary...</p>
                        </div>
                    )}
                    {error && <p className="text-red-500">{error}</p>}
                    {summary && (
                        <div className="prose prose-invert max-w-none whitespace-pre-wrap">
                           {summary}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
