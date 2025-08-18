import Link from "next/link";
import { Bot } from "lucide-react";

export default function Footer() {
    return (
        <footer className="border-t border-gray-800">
            <div className="container py-8 flex flex-col md:flex-row items-center justify-between">
                <div className="flex items-center mb-4 md:mb-0">
                    <Bot className="h-6 w-6 mr-2 text-purple-400" />
                    <span className="font-bold">IntelliDocs AI</span>
                </div>
                <div className="text-sm text-gray-400">
                    &copy; {new Date().getFullYear()} IntelliDocs AI. All Rights Reserved.
                </div>
                <div className="flex space-x-4 mt-4 md:mt-0">
                    <Link href="/terms" className="text-sm text-gray-400 hover:text-white">Terms of Service</Link>
                    <Link href="/privacy" className="text-sm text-gray-400 hover:text-white">Privacy Policy</Link>
                </div>
            </div>
        </footer>
    );
}
