import FileUpload from "@/components/FileUpload";

export default function UploadPage() {
    return (
        <div>
            <h1 className="text-3xl font-bold mb-2">Upload a New Document</h1>
            <p className="text-gray-400 mb-8">
                Drag and drop your PDF file below or click to select a file.
            </p>
            <div className="max-w-2xl mx-auto">
                <FileUpload />
            </div>
        </div>
    );
}
