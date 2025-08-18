import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { auth } from "@clerk/nextjs/server";
import { Bot } from "lucide-react";

export default async function Header() {
    const { userId } = auth();

    return (
        <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-14 max-w-screen-2xl items-center">
                <Link href="/" className="flex items-center font-bold">
                    <Bot className="h-6 w-6 mr-2 text-purple-400" />
                    <span>IntelliDocs AI</span>
                </Link>
                <div className="flex flex-1 items-center justify-end space-x-4">
                    <nav className="flex items-center space-x-2">
                        {userId ? (
                            <Link href="/dashboard">
                                <Button>Dashboard</Button>
                            </Link>
                        ) : (
                            <>
                                <Link href="/sign-in">
                                    <Button variant="ghost">Sign In</Button>
                                </Link>
                                <Link href="/sign-up">
                                    <Button>Sign Up</Button>
                                </Link>
                            </>
                        )}
                    </nav>
                </div>
            </div>
        </header>
    );
}
