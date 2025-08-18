import { Button } from "@/components/ui/Button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen text-center p-8">
      <div className="max-w-3xl">
        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-white">
          Transform Your PDFs into Interactive Conversations
        </h1>
        <p className="mt-6 text-lg md:text-xl text-gray-300">
          Welcome to <span className="font-bold text-purple-400">IntelliDocs AI</span>.
          Upload your documents, ask questions, get instant summaries, and extract key information with the power of AI.
          Stop searching, start understanding.
        </p>
        <div className="mt-8">
          <Link href="/dashboard">
            <Button size="lg" className="bg-purple-600 hover:bg-purple-700 text-white">
              Get Started
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </div>
      <footer className="absolute bottom-4 text-gray-500 text-sm">
        <p>&copy; {new Date().getFullYear()} IntelliDocs AI. All Rights Reserved.</p>
      </footer>
    </main>
  );
}
