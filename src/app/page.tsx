"use client";
import TextFileUploadParser from "./components/TextFileUploadParser";
import { useState } from "react";
import ProductHistoryDisplay, { ProductHistory } from "./components/ProductHistoryDisplay";

export default function Home() {

  const [parsedLines, setParsedLines] = useState<string[]>([]);

  const handleFileContentChange = (lines: string[]) => {
    setParsedLines(lines);
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

  const processedLines = processLines(parsedLines);

  const isMonth = (str: string): boolean => {
    const regex = /^\d{2}-\d{4}$/;
    return regex.test(str);
  }

  const getMonths = () => {
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

  const months = getMonths();

  const parseHistory = (lines: string[]) => {
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

  const productHistory = parseHistory(processedLines);
  console.log("Product History:", productHistory);

  return (
    <div>
      <h1 className="text-3xl font-bold text-center mt-8">Product Stock Check</h1>
      <p className="text-center mt-4">Upload a text file to check product stock.</p>
      <TextFileUploadParser onFileContentChange={handleFileContentChange} />
      <ProductHistoryDisplay productHistory={productHistory} months={months} />
    </div>
  );
}
