import { FileText, Trash2, Upload } from "lucide-react";

export default function DocumentsPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Document Library</h1>
          <p className="text-neutral-400 mt-2">Manage your uploaded files and knowledge base.</p>
        </div>
        <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md font-medium flex items-center gap-2 transition-colors">
          <Upload className="w-4 h-4" />
          Upload New
        </button>
      </div>

      <div className="bg-neutral-950 border border-neutral-800 rounded-xl overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-neutral-900 border-b border-neutral-800 text-neutral-400">
            <tr>
              <th className="px-6 py-4 font-medium">Document Name</th>
              <th className="px-6 py-4 font-medium">Date Uploaded</th>
              <th className="px-6 py-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800">
            {/* Empty State */}
            <tr>
              <td colSpan={3} className="px-6 py-12 text-center text-neutral-500">
                No documents in your library yet.
              </td>
            </tr>
            {/* Example Row (Commented out)
            <tr className="hover:bg-neutral-900/50 transition-colors">
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-neutral-800 rounded-md text-neutral-300">
                    <FileText className="w-4 h-4" />
                  </div>
                  <span className="font-medium text-neutral-200">example_document.pdf</span>
                </div>
              </td>
              <td className="px-6 py-4 text-neutral-400">Oct 24, 2026</td>
              <td className="px-6 py-4 text-right">
                <button className="text-red-400 hover:text-red-300 p-2 rounded-md hover:bg-red-400/10 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </td>
            </tr>
            */}
          </tbody>
        </table>
      </div>
    </div>
  );
}
