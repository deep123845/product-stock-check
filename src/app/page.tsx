"use client";
import FileUploadParser from "./components/FileUploadParser";
import { useState } from "react";

export default function Home() {

  const [parsedLines, setParsedLines] = useState<string[]>([]);

  const handleFileContentChange = (lines: string[]) => {
    setParsedLines(lines);
  }

  const processLines = (lines: string[]) => {
    const processedLines = [];

    processedLines.push(lines[0]); // Report Title
    processedLines.push(lines[1]); // Column Headers
    processedLines.push(lines[2]); // Separator

    for (let i = 4; i < lines.length; i++) {
      const prevParts = lines[i - 1].split("\t");
      const parts = lines[i].split("\t");
      const processedLine = prevParts.slice(-4).join("\t") + parts.slice(0, -4).join("\t"); //(Prodouct No, Supplier, Description, Stock) + History
      processedLines.push(processedLine);
    }

    return processedLines;
  }

  const processedLines = processLines(parsedLines);

  return (
    <div>
      <h1 className="text-3xl font-bold text-center mt-8">Product Stock Check</h1>
      <p className="text-center mt-4">Upload a text file to check product stock.</p>
      <FileUploadParser onFileContentChange={handleFileContentChange} />
      <div className="p-4 border rounded shadow mt-8">
        <h2 className="text-xl font-bold mb-2">Processed Lines:</h2>
        <div className="overflow-x-auto">
          <pre className="whitespace-pre" style={{ tabSize: 32 }}>{processedLines.join("\n")}</pre>
        </div>
      </div>
    </div>
  );
}
