import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { Message, StreamingTextResponse } from "ai";
import { pineconeIndex } from "@/lib/pinecone";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { ChatGroq } from "@langchain/groq";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { RunnableSequence } from "@langchain/core/runnables";

export const runtime = "edge"; // Use edge runtime for speed

const embeddings = new GoogleGenerativeAIEmbeddings({
    apiKey: process.env.GEMINI_API_KEY!,
    model: "embedding-001",
});

const model = new ChatGroq({
    apiKey: process.env.GROQ_API_KEY!,
    model: "llama3-8b-8192",
});

const promptTemplate = PromptTemplate.fromTemplate(`
You are a helpful AI assistant for the IntelliDocs AI platform. Your name is DocuBot.
Answer the user's question based ONLY on the following context.
If the context doesn't contain the answer, state that you couldn't find the information in the document.
Do not make up information. Be concise and professional.

Context:
{context}

Question:
{question}

Answer:
`);

export async function POST(req: NextRequest) {
    try {
        const { userId } = auth();
        if (!userId) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await req.json();
        const { messages, fileId } = body as { messages: Message[]; fileId: string };

        if (!fileId) {
            return new NextResponse("File ID is required", { status: 400 });
        }

        const lastUserMessage = messages[messages.length - 1];
        const question = lastUserMessage.content;

        // 1. Get vector embeddings for the user's question
        const questionEmbedding = await embeddings.embedQuery(question);

        // 2. Query Pinecone for relevant context
        const queryResult = await pineconeIndex.query({
            vector: questionEmbedding,
            topK: 5,
            filter: { documentId: { $eq: fileId } }
        });

        const context = queryResult.matches.map(match => match.metadata?.text).join("\n\n");

        // 3. Create the chain
        const chain = RunnableSequence.from([
            {
                context: () => Promise.resolve(context),
                question: (input: { question: string }) => input.question,
            },
            promptTemplate,
            model,
            new StringOutputParser(),
        ]);

        // 4. Stream the response
        const stream = await chain.stream({
            question: question,
        });

        return new StreamingTextResponse(stream);

    } catch (error) {
        console.error("[CHAT_API_ERROR]", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
