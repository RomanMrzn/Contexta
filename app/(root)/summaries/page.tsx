import { FileText, Wand2 } from "lucide-react";

export default function SummariesPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Multi-Document Summaries</h1>
          <p className="text-neutral-400 mt-2">Generate combined summaries from multiple documents at once.</p>
        </div>
        <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md font-medium flex items-center gap-2 transition-colors">
          <Wand2 className="w-4 h-4" />
          Generate New
        </button>
      </div>

      <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-8 text-center flex flex-col items-center justify-center space-y-4">
        <div className="w-16 h-16 bg-neutral-900 rounded-full flex items-center justify-center text-neutral-600">
          <FileText className="w-8 h-8" />
        </div>
        <div className="max-w-sm">
          <h3 className="text-lg font-medium text-white">No Summaries Yet</h3>
          <p className="text-neutral-500 mt-2">
            Select multiple documents from your library to generate comprehensive overviews and extract key concepts across files.
          </p>
        </div>
      </div>
    </div>
  );
}
