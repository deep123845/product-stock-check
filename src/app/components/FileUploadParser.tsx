import React, { useState } from 'react';

const FileUploadParser: React.FC = () => {
    const [fileContent, setFileContent] = useState<string | null>(null);
    const [fileName, setFileName] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];

        if (file) {
            setFileName(file.name);
            setError(null);

            const reader = new FileReader();

            reader.onload = (e) => {
                if (e.target && typeof e.target.result === 'string') {
                    setFileContent(e.target.result);
                }
            };

            reader.onerror = () => {
                setError("Failed to read file.");
            };

            reader.readAsText(file);
        } else {
            setFileContent(null);
            setFileName(null);
            setError("No file selected.");
        }
    };

    const parseContent = (content: string) => {
        return content.split('\n').map(line => line.trim()).filter(line => line.length > 0);
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

            {fileContent && (
                <div>
                    <h3 className="text-lg font-semibold mb-2">Parsed Content:</h3>
                    <ul>
                        {parseContent(fileContent).map((line, index) => (
                            <li key={index}>{line}</li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default FileUploadParser;