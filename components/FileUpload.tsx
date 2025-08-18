"use client";

import { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { CloudUpload, File, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function FileUpload() {
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const router = useRouter();

    const onDrop = async (acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        if (!file) return;

        setIsUploading(true);
        setUploadError(null);

        const formData = new FormData();
        formData.append('file', file);

        try {
            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            if (!res.ok) {
                const errorText = await res.text();
                throw new Error(errorText || 'Upload failed');
            }

            const newDocument = await res.json();
            // Redirect to the new document's chat page
            router.push(`/documents/${newDocument.id}`);

        } catch (error: any) {
            setUploadError(error.message);
        } finally {
            setIsUploading(false);
        }
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'application/pdf': ['.pdf'] },
        multiple: false,
    });

    return (
        <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors
            ${isDragActive ? 'border-purple-600 bg-purple-900/10' : 'border-gray-600 hover:border-purple-500'}`}
        >
            <input {...getInputProps()} />
            {isUploading ? (
                <div className="flex flex-col items-center">
                    <Loader2 className="h-12 w-12 text-purple-500 animate-spin mb-4" />
                    <p className="text-lg">Processing your PDF...</p>
                    <p className="text-sm text-gray-400">This may take a moment.</p>
                </div>
            ) : (
                <div className="flex flex-col items-center">
                    <CloudUpload className="h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-lg font-semibold">
                        {isDragActive ? 'Drop the file here!' : 'Click to upload or drag and drop'}
                    </p>
                    <p className="text-sm text-gray-500">PDF (up to plan limits)</p>
                </div>
            )}
            {uploadError && (
                <div className="mt-4 text-red-500 text-sm">
                    <p>Error: {uploadError}</p>
                </div>
            )}
        </div>
    );
}
