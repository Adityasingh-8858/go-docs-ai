import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { pineconeIndex } from "@/lib/pinecone";
import { ChatGroq } from "@langchain/groq";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { trace } from "@/lib/sentry";
import * as Sentry from '@sentry/nextjs';

const model = new ChatGroq({
    apiKey: process.env.GROQ_API_KEY!,
    model: "llama3-70b-8192", // Using a powerful model for high-quality summarization
});

const summarizationPrompt = PromptTemplate.fromTemplate(`
You are an expert at summarizing long documents. Your name is DocuBot.
Create a concise, easy-to-read summary of the following text. The summary should capture the key points, main arguments, and any important conclusions.
Structure the summary with a title, a few bullet points for the main ideas, and a concluding sentence.

Text to summarize:
---
{context}
---

Summary:
`);

const summarizationChain = summarizationPrompt.pipe(model).pipe(new StringOutputParser());

export async function POST(req: NextRequest) {
    return trace('api.summarize', async (span) => {
        try {
            const { userId } = auth();
            if (!userId) {
                return new NextResponse("Unauthorized", { status: 401 });
            }
            span?.setAttribute('userId', userId);

            const { fileId } = await req.json();
            if (!fileId) {
                return new NextResponse("File ID is required", { status: 400 });
            }
            span?.setAttribute('fileId', fileId);

            // 1. Fetch all text chunks from Pinecone
            const allText = await trace('pinecone.fetchAllText', async (childSpan) => {
                const index = pineconeIndex.namespace(fileId);
                // Note: listPaginated can be slow. For very large documents, a different strategy may be needed.
                const listResponse = await index.listPaginated();
                const vectorIds = listResponse.vectors?.map(v => v.id) || [];
                childSpan?.setAttribute('pinecone.vectorCount', vectorIds.length);

                if (vectorIds.length === 0) {
                    return null; // Return null to indicate no content
                }

                const fetchResult = await index.fetch(vectorIds);
                return Object.values(fetchResult.vectors)
                    .map(v => v.metadata && (v.metadata as { text: string }).text)
                    .filter(Boolean)
                    .join("\n\n");
            });

            if (allText === null) {
                return new NextResponse("No content found for this document.", { status: 404 });
            }
            if (!allText) {
                // This case might indicate an issue with the fetched vectors not having text
                throw new Error("Could not retrieve text for this document despite finding vectors.");
            }

            // 2. Generate the summary
            const summary = await trace('groq.summarize', () =>
                summarizationChain.invoke({ context: allText })
            );

            // 3. Return the summary
            return NextResponse.json({ summary });

        } catch (error) {
            Sentry.captureException(error);
            console.error("[SUMMARIZE_API_ERROR]", {
                message: (error as Error).message,
                stack: (error as Error).stack,
            });
            return new NextResponse("Internal Server Error", { status: 500 });
        }
    });
}
