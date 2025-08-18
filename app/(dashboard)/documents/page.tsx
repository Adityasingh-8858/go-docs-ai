import { auth } from "@clerk/nextjs/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { FileText, MessageSquare, Clock, Loader2, AlertTriangle } from "lucide-react";

export default async function DocumentsPage() {
    const { userId } = auth();
    if (!userId) return null; // Should be handled by layout protection

    const supabase = getSupabaseAdmin();
    const { data: documents, error } = await supabase
        .from("documents")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

    if (error) {
        // Basic error handling
        return <p className="text-red-500">Could not fetch documents.</p>;
    }

    if (documents.length === 0) {
        return (
            <div className="text-center">
                <h2 className="text-2xl font-semibold">No Documents Found</h2>
                <p className="mt-2 text-gray-400">You haven't uploaded any documents yet.</p>
                <Link href="/upload" className="mt-4 inline-block">
                    <Button>Upload Your First PDF</Button>
                </Link>
            </div>
        );
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case "PENDING":
            case "PROCESSING":
                return <Loader2 className="h-4 w-4 text-yellow-400 animate-spin" />;
            case "SUCCESS":
                return <MessageSquare className="h-4 w-4 text-green-400" />;
            case "FAILED":
                return <AlertTriangle className="h-4 w-4 text-red-400" />;
            default:
                return null;
        }
    };

    return (
        <div>
            <h1 className="text-3xl font-bold mb-8">Your Documents</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {documents.map((doc) => (
                    <Card key={doc.id} className="flex flex-col">
                        <CardHeader>
                            <CardTitle className="flex items-center">
                                <FileText className="mr-3 text-purple-400" />
                                <span className="truncate">{doc.file_name}</span>
                            </CardTitle>
                            <CardDescription className="flex items-center pt-2">
                                <Clock className="mr-2 h-4 w-4" />
                                {new Date(doc.created_at).toLocaleDateString()}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1">
                             <div className="flex items-center space-x-2 text-sm text-gray-400">
                                {getStatusIcon(doc.upload_status)}
                                <span>Status: {doc.upload_status}</span>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Link href={`/documents/${doc.id}`} className="w-full">
                                <Button
                                    className="w-full"
                                    disabled={doc.upload_status !== 'SUCCESS'}
                                >
                                    {doc.upload_status === 'SUCCESS' ? 'Chat Now' : 'Processing...'}
                                </Button>
                            </Link>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </div>
    );
}
