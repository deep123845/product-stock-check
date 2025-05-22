import FileUploadParser from "./components/FileUploadParser";

export default function Home() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-center mt-8">Product Stock Check</h1>
      <p className="text-center mt-4">Upload a text file to check product stock.</p>
      <FileUploadParser />
    </div>
  );
}
