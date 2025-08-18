import { getSupabaseAdmin } from "./supabase";
import { pineconeIndex } from "./pinecone";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import pdf from "pdf-parse";
import { getSubscriptionForUser } from "./subscriptions";

const embeddings = new GoogleGenerativeAIEmbeddings({
    apiKey: process.env.GEMINI_API_KEY!,
    model: "embedding-001",
});

async function getPdfText(fileBuffer: Buffer) {
    const data = await pdf(fileBuffer);
    return {
        text: data.text,
        numPages: data.numpages,
    };
}

export async function processPDF(fileKey: string, documentId: string) {
    const supabase = getSupabaseAdmin();

    try {
        // 1. Download file from Supabase Storage
        const { data: fileData, error: downloadError } = await supabase.storage
            .from("documents")
            .download(fileKey);

        if (downloadError || !fileData) {
            throw new Error(`Failed to download file: ${fileKey}`, { cause: downloadError });
        }

        const fileBuffer = Buffer.from(await fileData.arrayBuffer());

        // 2. Extract text and page count from PDF
        const { text, numPages } = await getPdfText(fileBuffer);

        // 3. Check page count against user's subscription plan
        const { data: doc, error: docError } = await supabase.from('documents').select('user_id').eq('id', documentId).single();
        if (docError || !doc) {
            throw new Error(`Document not found for id: ${documentId}`, { cause: docError });
        }

        const subscription = await getSubscriptionForUser(doc.user_id);
        if (numPages > subscription.quota.PAGES_PER_PDF) {
            await supabase.from("documents").update({ upload_status: 'FAILED' }).eq('id', documentId);
            throw new Error(`Page limit of ${subscription.quota.PAGES_PER_PDF} exceeded. PDF has ${numPages} pages.`);
        }

        // 4. Update page count in the database
        await supabase
            .from("documents")
            .update({ page_count: numPages })
            .eq("id", documentId);

        // 5. Split text into chunks
        const textSplitter = new RecursiveCharacterTextSplitter({
            chunkSize: 1000,
            chunkOverlap: 200,
        });
        const chunks = await textSplitter.splitText(text);

        // 6. Create embeddings for each chunk
        const vectors = await embeddings.embedDocuments(chunks);

        // 7. Upsert vectors into Pinecone using a namespace for the document
        const vectorsToUpsert = vectors.map((vector, i) => ({
            id: `${documentId}_chunk_${i}`,
            values: vector,
            metadata: {
                documentId: documentId,
                text: chunks[i],
            },
        }));

        const index = pineconeIndex.namespace(documentId);
        const batchSize = 100; // Pinecone recommends upserting in batches
        for (let i = 0; i < vectorsToUpsert.length; i += batchSize) {
            const batch = vectorsToUpsert.slice(i, i + batchSize);
            await index.upsert(batch);
        }

        // 8. Update document status to SUCCESS
        await supabase
            .from("documents")
            .update({ upload_status: "SUCCESS" })
            .eq("id", documentId);

        console.log(`[SUCCESS] Processing complete for document ${documentId}`);

    } catch (error) {
        console.error(`[PROCESS_PDF_ERROR] for document ${documentId}:`, error);

        await supabase
            .from("documents")
            .update({ upload_status: "FAILED" })
            .eq("id", documentId);
    }
}
