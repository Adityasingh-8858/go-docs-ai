import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { MessageSquare, FileText, BarChart } from "lucide-react";

const features = [
    {
        icon: <MessageSquare className="h-10 w-10 text-purple-400" />,
        title: "AI-Powered Chat",
        description: "Ask questions in natural language and get instant, context-aware answers sourced directly from your documents.",
    },
    {
        icon: <FileText className="h-10 w-10 text-purple-400" />,
        title: "Instant Summarization",
        description: "Generate concise summaries of entire documents or specific sections to grasp key points in seconds.",
    },
    {
        icon: <BarChart className="h-10 w-10 text-purple-400" />,
        title: "Data Extraction",
        description: "Automatically identify and extract tables, key-value pairs, and other structured data into usable formats.",
    },
];

export default function Features() {
    return (
        <section className="py-20 bg-gray-900/50">
            <div className="container">
                <div className="text-center max-w-2xl mx-auto">
                    <h2 className="text-3xl md:text-4xl font-bold">Everything You Need to Master Your Documents</h2>
                    <p className="mt-4 text-lg text-gray-400">
                        Our powerful AI features are designed to save you time and unlock the knowledge hidden in your PDFs.
                    </p>
                </div>
                <div className="mt-12 grid gap-8 md:grid-cols-3">
                    {features.map((feature) => (
                        <Card key={feature.title} className="text-center border-gray-800 hover:border-purple-600 transition-all hover:bg-gray-900">
                            <CardHeader>
                                <div className="flex justify-center mb-4">{feature.icon}</div>
                                <CardTitle>{feature.title}</CardTitle>
                                <CardDescription className="pt-2">{feature.description}</CardDescription>
                            </CardHeader>
                        </Card>
                    ))}
                </div>
            </div>
        </section>
    );
}
