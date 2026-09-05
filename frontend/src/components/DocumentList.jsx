import React from 'react';
import { FileText, Database, Layers, Trash2, Loader2, Calendar } from 'lucide-react';

export default function DocumentList({
  documents = [],
  onDeleteDocument,
  isLoading = false,
  deletingTitle = null,
}) {
  const totalChunks = documents.reduce(
    (sum, doc) => sum + (doc.chunks_count || doc.chunksCreated || 0),
    0
  );

  const getFileBadgeColor = (title) => {
    const ext = title?.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'pdf':
        return 'text-rose-600 bg-rose-50 border-rose-200';
      case 'md':
        return 'text-purple-600 bg-purple-50 border-purple-200';
      default:
        return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return null;
    }
  };

  const handleDelete = (title) => {
    if (!onDeleteDocument) return;
    const confirmed = window.confirm(
      `Are you sure you want to delete "${title}"?\n\nThis will permanently remove all associated vector chunks from Supabase.`
    );
    if (confirmed) {
      onDeleteDocument(title);
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 mt-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Knowledge Base</h2>
            <p className="text-xs text-slate-500">Live indexed documents in Supabase</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {totalChunks > 0 && (
            <span className="hidden sm:inline-flex text-[11px] font-medium px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
              {totalChunks} total chunks
            </span>
          )}
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
            {documents.length} {documents.length === 1 ? 'doc' : 'docs'}
          </span>
        </div>
      </div>

      {/* Loading state */}
      {isLoading ? (
        <div className="text-center py-8 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
          <Loader2 className="w-6 h-6 text-indigo-600 animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-500">Loading indexed documents from database...</p>
        </div>
      ) : documents.length === 0 ? (
        /* Empty state */
        <div className="text-center py-8 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
          <Database className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-xs font-medium text-slate-600">Knowledge Base is Empty</p>
          <p className="text-[11px] text-slate-400 mt-1 max-w-xs mx-auto">
            Upload a PDF, TXT, or Markdown document above to automatically index it for semantic RAG queries.
          </p>
        </div>
      ) : (
        /* Document items */
        <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
          {documents.map((doc, idx) => {
            const title = doc.title || doc.fileName || `Document ${idx + 1}`;
            const chunkCount = doc.chunks_count ?? doc.chunksCreated ?? 1;
            const dateDisplay = formatDate(doc.created_at);
            const isThisDeleting = deletingTitle === title;

            return (
              <div
                key={idx}
                className="group flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-slate-50 hover:border-slate-200 transition-all"
              >
                {/* Left: Icon & Details */}
                <div className="flex items-center space-x-3 min-w-0 flex-1 mr-3">
                  <div
                    className={`w-9 h-9 rounded-lg border flex items-center justify-center flex-shrink-0 ${getFileBadgeColor(
                      title
                    )}`}
                  >
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p
                      className="text-sm font-medium text-slate-800 truncate"
                      title={title}
                    >
                      {title}
                    </p>
                    <div className="flex items-center space-x-2 text-[11px] text-slate-400 mt-0.5">
                      <span className="flex items-center space-x-1">
                        <Layers className="w-3 h-3 text-purple-500" />
                        <span>{chunkCount} {chunkCount === 1 ? 'chunk' : 'chunks'}</span>
                      </span>
                      {dateDisplay && (
                        <>
                          <span>&bull;</span>
                          <span className="flex items-center space-x-1">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            <span>{dateDisplay}</span>
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center space-x-1 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => handleDelete(title)}
                    disabled={isThisDeleting}
                    title={`Delete "${title}"`}
                    aria-label={`Delete ${title}`}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 transition-colors disabled:opacity-50"
                  >
                    {isThisDeleting ? (
                      <Loader2 className="w-4 h-4 animate-spin text-rose-500" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
