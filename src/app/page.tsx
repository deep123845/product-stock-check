"use client";
import TextFileUploadParser from "./components/TextFileUploadParser";
import { useState } from "react";
import ProductHistoryDisplay from "./components/ProductHistoryDisplay";
import CatalogueFileUploadParser from "./components/CatalogueFileUploadParser";
import { ProductHistory, ProductInfo } from "./lib/types";

export default function Home() {

  const [productHistory, setproductHistory] = useState<ProductHistory[]>([]);
  const [months, setMonths] = useState<{ [id: number]: string }>({});
  const [catalogueProducts, setCatalogueProducts] = useState<ProductInfo[]>([]);

  const handleFileContentChange = (lines: ProductHistory[], months: { [id: number]: string }) => {
    setMonths(months);
    setproductHistory(lines);
  }

  const handleCatalogueFileContentChange = (lines: ProductInfo[]) => {
    setCatalogueProducts(lines);
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-center mt-8">Product Stock Check</h1>
      <p className="text-center mt-4">Upload a text file to check product stock.</p>
      <CatalogueFileUploadParser onFileContentChange={handleCatalogueFileContentChange} />
      <TextFileUploadParser onFileContentChange={handleFileContentChange} />
      <ProductHistoryDisplay productHistory={productHistory} months={months} productInfo={catalogueProducts} />
    </div>
  );
}
