import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { ArrowRight } from "lucide-react";

export default function Hero() {
    return (
        <section className="py-20 md:py-32">
            <div className="container text-center">
                <div className="max-w-3xl mx-auto">
                    <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white">
                        Transform Your PDFs into Interactive Conversations
                    </h1>
                    <p className="mt-6 text-lg md:text-xl text-gray-300">
                        Welcome to <span className="font-bold text-purple-400">IntelliDocs AI</span>.
                        Upload your documents, ask questions, get instant summaries, and extract key information with the power of AI.
                        Stop searching, start understanding.
                    </p>
                    <div className="mt-8">
                        <Link href="/sign-up">
                            <Button size="lg" className="bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-500/20">
                                Get Started for Free
                                <ArrowRight className="ml-2 h-5 w-5" />
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
}
