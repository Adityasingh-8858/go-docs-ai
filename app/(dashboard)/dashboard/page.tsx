import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { checkUploadLimits } from "@/lib/subscriptions";
import { currentUser } from "@clerk/nextjs/server";
import { FilePlus2 } from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
    const user = await currentUser();
    const { hasReachedLimit, currentCount, limit } = await checkUploadLimits();

    return (
        <div>
            <h1 className="text-3xl font-bold mb-2">Welcome, {user?.firstName}!</h1>
            <p className="text-gray-400 mb-8">Here's a summary of your account.</p>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader>
                        <CardTitle>Documents Uploaded</CardTitle>
                        <CardDescription>Your current usage and limit.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-4xl font-bold">
                            {currentCount} / {limit === Infinity ? "∞" : limit}
                        </div>
                        {hasReachedLimit && (
                            <p className="text-sm text-red-500 mt-2">
                                You have reached your limit. Please upgrade for more uploads.
                            </p>
                        )}
                    </CardContent>
                </Card>

                <Card className="flex flex-col items-center justify-center bg-purple-900/20">
                    <CardHeader className="items-center">
                        <CardTitle>Upload a New Document</CardTitle>
                        <CardDescription>Get started by uploading your first PDF.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Link href="/upload">
                            <Button>
                                <FilePlus2 className="mr-2 h-5 w-5" />
                                Upload PDF
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
