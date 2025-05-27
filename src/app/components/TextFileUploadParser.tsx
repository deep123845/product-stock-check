"use client";
import React, { useState } from "react";

interface FileUploadParserProps {
    onFileContentChange?: (parsedLines: string[]) => void;
}

const TextFileUploadParser: React.FC<FileUploadParserProps> = ({ onFileContentChange }) => {
    const [fileName, setFileName] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];

        if (file) {
            setFileName(file.name);
            setError(null);

            const reader = new FileReader();

            reader.onload = (e) => {
                if (e.target && typeof e.target.result === "string") {
                    const content = e.target.result;

                    if (onFileContentChange) {
                        onFileContentChange(parseContent(content));
                    }
                }
            };

            reader.onerror = () => {
                setError("Failed to read file.");

                if (onFileContentChange) {
                    onFileContentChange([]);
                }
            };

            reader.readAsText(file);
        } else {
            setFileName(null);
            setError("No file selected.");

            if (onFileContentChange) {
                onFileContentChange([]);
            }
        }
    };

    const parseContent = (content: string) => {
        return content.split("\n").filter(line => line.length > 0);
    };

    return (
        <div className="p-4 border rounded shadow mt-8">
            <h2 className="text-xl font-bold mb-2">Upload and Parse Text File:</h2>
            <input
                type="file"
                accept=".txt"
                onChange={handleFileChange}
                className="mb-4"
            />

            {error && <div className="text-red-500 mb-2">Error: {error}</div>}
            {fileName && <p className="mb-2">Selected file: <span className="font-semibold">{fileName}</span></p>}
        </div>
    );
};

export default TextFileUploadParser;