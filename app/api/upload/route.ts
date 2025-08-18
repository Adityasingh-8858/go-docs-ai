import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { checkUploadLimits } from "@/lib/subscriptions";
import { processPDF } from "@/lib/pdf-processor";

export async function POST(req: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // 1. Check if user has reached their upload limit
    const { hasReachedLimit, limit } = await checkUploadLimits();
    if (hasReachedLimit) {
      return new NextResponse(
        `You have reached your upload limit of ${limit} PDFs. Please upgrade your plan.`,
        { status: 403 }
      );
    }

    // 2. Get the file from the request
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return new NextResponse("No file provided", { status: 400 });
    }

    if (file.type !== "application/pdf") {
      return new NextResponse("Invalid file type. Only PDFs are allowed.", {
        status: 400,
      });
    }

    const supabase = getSupabaseAdmin();

    // 3. Create a record in our database
    // We do this first to get a unique ID for the document
    const { data: docRecord, error: docError } = await supabase
      .from("documents")
      .insert({
        user_id: userId,
        file_name: file.name,
        file_key: "placeholder", // will be updated after upload
        page_count: 0, // will be updated after processing
        upload_status: "PENDING",
      })
      .select()
      .single();

    if (docError || !docRecord) {
      console.error("Failed to create document record:", docError);
      return new NextResponse("Failed to create document record.", {
        status: 500,
      });
    }

    // 4. Upload the file to Supabase Storage
    const fileKey = `${userId}/${docRecord.id}/${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from("documents") // your bucket name
      .upload(fileKey, file);

    if (uploadError) {
      console.error("Failed to upload file to storage:", uploadError);
      // If upload fails, update status to FAILED
      await supabase
        .from("documents")
        .update({ upload_status: "FAILED" })
        .eq("id", docRecord.id);
      return new NextResponse("Failed to upload file.", { status: 500 });
    }

    // 5. Update the file_key in our database record
    await supabase
      .from("documents")
      .update({ file_key: fileKey, upload_status: "PROCESSING" })
      .eq("id", docRecord.id);

    // 6. Asynchronously process the PDF.
    // IMPORTANT: In a production environment, this is not a robust solution.
    // Serverless functions (like on Vercel or Heroku) have execution time limits.
    // A very large PDF could cause this function to time out before processing is complete.
    // A more robust architecture would use a dedicated queue service (e.g., Supabase PGQ, RabbitMQ, AWS SQS)
    // to enqueue a job, and a separate, long-running worker service to process the queue.
    // This ensures reliability and scalability.
    processPDF(fileKey, docRecord.id).catch((e) => {
        console.error(`[FATAL] PDF processing failed for document ${docRecord.id}:`, {
            message: (e as Error).message,
            stack: (e as Error).stack,
        });
        // In a real app, you might want to notify the user or have a retry mechanism.
    });

    // 7. Return the document record to the client
    return NextResponse.json(docRecord, { status: 201 });

  } catch (error) {
    console.error("[UPLOAD_API_ERROR]", {
        message: (error as Error).message,
        stack: (error as Error).stack,
    });
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
