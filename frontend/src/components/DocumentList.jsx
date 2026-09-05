import React from 'react';
import { FileText, Database, Layers } from 'lucide-react';

export default function DocumentList({ documents }) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 mt-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Knowledge Base</h2>
            <p className="text-xs text-slate-500">Indexed documents in vector database</p>
          </div>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
          {documents.length} {documents.length === 1 ? 'doc' : 'docs'}
        </span>
      </div>

      {documents.length === 0 ? (
        <div className="text-center py-6 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
          <p className="text-xs text-slate-400">No documents indexed in this session yet.</p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Upload a PDF, TXT, or MD file above to begin querying.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
          {documents.map((doc, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center space-x-3 truncate">
                <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-500 flex-shrink-0">
                  <FileText className="w-4 h-4 text-blue-500" />
                </div>
                <div className="truncate">
                  <p className="text-sm font-medium text-slate-800 truncate">{doc.fileName}</p>
                  <p className="text-xs text-slate-400">
                    {doc.totalCharacters?.toLocaleString() || 'N/A'} chars &bull; {doc.fileType || 'Text'}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-1.5 text-xs text-slate-600 bg-white border border-slate-200 px-2.5 py-1 rounded-lg flex-shrink-0">
                <Layers className="w-3.5 h-3.5 text-purple-500" />
                <span className="font-semibold">{doc.chunksCreated}</span>
                <span className="text-slate-400 text-[11px]">chunks</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
