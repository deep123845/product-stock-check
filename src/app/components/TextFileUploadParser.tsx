"use client";
import React, { useState } from "react";
import { ProductHistory } from "@/app/lib/types";

interface TextFileUploadParserProps {
    onFileContentChange?: (productHistory: ProductHistory[], months: { [id: number]: string }) => void;
}

const TextFileUploadParser: React.FC<TextFileUploadParserProps> = ({ onFileContentChange }) => {
    const [fileName, setFileName] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const isMonth = (str: string): boolean => {
        const regex = /^\d{2}-\d{4}$/;
        return regex.test(str);
    }

    const getMonths = (parsedLines: string[]) => {
        const monthsSet = new Set<string>();

        // Extract all unique months from the processed lines
        for (let i = 0; i < parsedLines.length; i++) {
            const parts = parsedLines[i].split("\t");
            for (let j = 0; j < parts.length; j++) {
                if (isMonth(parts[j])) {
                    monthsSet.add(parts[j]);
                }
            }
        }

        // Sort months in ascending order
        const sortedMonths = Array.from(monthsSet).sort((a, b) => {
            const [monthA, yearA] = a.split("-").map(Number);
            const [monthB, yearB] = b.split("-").map(Number);

            if (yearA === yearB) {
                return monthA - monthB;
            }
            return yearA - yearB;
        });

        // Create dictionary with index as key and month as value
        const monthsDict: { [id: number]: string } = {};
        sortedMonths.forEach((month, index) => {
            monthsDict[index] = month;
        });

        return monthsDict;
    }

    const parseHistory = (lines: string[], months: { [id: number]: string }) => {
        const history: ProductHistory[] = [];

        for (let i = 0; i < lines.length; i++) {
            const parts = lines[i].split("\t");
            const productNo = parts[0];
            const supplier = parts[1];
            const description = parts[2];
            const stock = parseInt(parts[3]);
            const sales: { [id: number]: number } = {};
            const activeMonths = [];

            // Populate months for sales
            for (let j = 4; j < parts.length; j++) {
                if (isMonth(parts[j])) {
                    // Find the month index by looking through the months dictionary values
                    const monthEntry = Object.entries(months).find(entry => entry[1] === parts[j]);
                    if (monthEntry) {
                        const monthIndex = parseInt(monthEntry[0]);
                        sales[monthIndex] = 0;
                        activeMonths.push(monthIndex);
                    }
                }
            }

            // Find Sales Data
            const salesIndex = parts.findIndex((part) => part === "Sold Qty") + 1;

            // Populate sales data for active months
            for (let j = 0; j < activeMonths.length; j++) {
                sales[activeMonths[j]] = parseInt(parts[salesIndex + j]);
            }

            history.push({ productNo, supplier, description, stock, sales });
        }

        return history;
    }

    const processLines = (lines: string[]) => {
        const processedLines = [];

        for (let i = 4; i < lines.length; i++) {
            const prevParts = lines[i - 1].split("\t");
            const parts = lines[i].split("\t");

            //(Prodouct No, Supplier, Description, Stock) + History
            const processedLine = prevParts.slice(-4).join("\t") + parts.slice(0, -4).join("\t");
            processedLines.push(processedLine);
        }

        return processedLines;
    }

    const parseContent = (content: string) => {
        return content.split("\n").filter(line => line.length > 0);
    };

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
                        const parsedLines = parseContent(content);
                        const months = getMonths(parsedLines);
                        const productHistory = parseHistory(processLines(parsedLines), months);
                        onFileContentChange(productHistory, months);
                    }
                }
            };

            reader.onerror = () => {
                setError("Failed to read file.");

                if (onFileContentChange) {
                    onFileContentChange([], {});
                }
            };

            reader.readAsText(file);
        } else {
            setFileName(null);
            setError("No file selected.");

            if (onFileContentChange) {
                onFileContentChange([], {});
            }
        }
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