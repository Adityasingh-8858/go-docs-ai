import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { checkUploadLimits } from "@/lib/subscriptions";
import { processPDF } from "@/lib/pdf-processor";
import { trace } from "@/lib/sentry";
import * as Sentry from '@sentry/nextjs';

export async function POST(req: NextRequest) {
    return trace('api.upload', async (span) => {
        try {
            const { userId } = auth();
            if (!userId) {
                return new NextResponse("Unauthorized", { status: 401 });
            }
            span?.setAttribute('userId', userId);

            // 1. Check upload limits
            const { hasReachedLimit, limit } = await trace('checkUploadLimits', () => checkUploadLimits());
            if (hasReachedLimit) {
                return new NextResponse(`You have reached your upload limit of ${limit} PDFs.`, { status: 403 });
            }

            // 2. Get the file from the request
            const formData = await req.formData();
            const file = formData.get("file") as File;
            if (!file) return new NextResponse("No file provided", { status: 400 });
            if (file.type !== "application/pdf") return new NextResponse("Only PDFs are allowed.", { status: 400 });
            span?.setAttributes({ 'file.name': file.name, 'file.size': file.size, 'file.type': file.type });

            const supabase = getSupabaseAdmin();

            // 3. Create a document record in the database
            const docRecord = await trace('db.createDocumentRecord', async () => {
                const { data, error } = await supabase
                    .from("documents")
                    .insert({
                        user_id: userId,
                        file_name: file.name,
                        file_key: "placeholder",
                        upload_status: "PENDING",
                    })
                    .select()
                    .single();
                if (error) throw error;
                return data;
            });
            span?.setAttribute('documentId', docRecord.id);

            // 4. Upload file to Supabase Storage
            const fileKey = `${userId}/${docRecord.id}/${file.name}`;
            await trace('supabase.upload', async () => {
                const { error } = await supabase.storage.from("documents").upload(fileKey, file);
                if (error) {
                    await supabase.from("documents").update({ upload_status: "FAILED" }).eq("id", docRecord.id);
                    throw new Error(`Failed to upload file to storage: ${error.message}`);
                }
            });

            // 5. Update the file_key and status in our database
            await trace('db.updateFileKey', () =>
                supabase.from("documents").update({ file_key: fileKey, upload_status: "PROCESSING" }).eq("id", docRecord.id)
            );

            // 6. Asynchronously process the PDF without awaiting it.
            // This is a fire-and-forget operation from the perspective of the API response.
            // The `processPDF` function is now responsible for its own error handling and status updates.
            processPDF(fileKey, docRecord.id).catch(err => {
                // We capture the exception here as a fallback, although `processPDF` also does.
                // This ensures we catch any errors that might happen *before* `processPDF`'s own try-catch block.
                Sentry.captureException(err, {
                    extra: {
                        message: `[FATAL] Background PDF processing failed for document ${docRecord.id}`,
                        documentId: docRecord.id,
                        fileKey: fileKey,
                    }
                });
            });

            // 7. Return the document record to the client
            return NextResponse.json(docRecord, { status: 201 });

        } catch (error) {
            Sentry.captureException(error);
            console.error("[UPLOAD_API_ERROR]", {
                message: (error as Error).message,
                stack: (error as Error).stack,
            });
            return new NextResponse("Internal Server Error", { status: 500 });
        }
    });
}
