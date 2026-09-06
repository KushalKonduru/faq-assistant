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
      });
    } catch {
      return null;
    }
  };

  const handleDelete = (title) => {
    if (!onDeleteDocument) return;
    const confirmed = window.confirm(
      `Delete "${title}"?\n\nThis will remove all associated vector chunks from Supabase.`
    );
    if (confirmed) {
      onDeleteDocument(title);
    }
  };

  return (
    <div className="bg-slate-50/70 rounded-2xl p-4 border border-slate-200/90 shadow-2xs flex-1 flex flex-col min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 flex-shrink-0">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
            <Database className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 tracking-tight">Knowledge Base</h2>
          </div>
        </div>

        <div className="flex items-center space-x-1.5">
          {totalChunks > 0 && (
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/60">
              {totalChunks} chunks
            </span>
          )}
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-200/70 text-slate-700">
            {documents.length} {documents.length === 1 ? 'doc' : 'docs'}
          </span>
        </div>
      </div>

      {/* Loading state */}
      {isLoading ? (
        <div className="rounded-xl border border-slate-200/70 bg-white p-6 text-center flex flex-col items-center justify-center flex-1 min-h-[140px]">
          <Loader2 className="w-6 h-6 text-indigo-600 animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-500 font-medium">Loading documents...</p>
        </div>
      ) : documents.length === 0 ? (
        /* Empty state */
        <div className="rounded-xl border border-slate-200/70 bg-white p-5 text-center flex flex-col items-center justify-center flex-1 min-h-[140px]">
          <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 mx-auto mb-2">
            <Database className="w-5 h-5 text-slate-400" />
          </div>
          <h3 className="text-xs font-bold text-slate-800">No Documents Yet</h3>
          <p className="text-[11px] text-slate-400 max-w-[200px] mx-auto mt-0.5 leading-relaxed">
            Drop a file above to index your knowledge base.
          </p>
        </div>
      ) : (
        /* Document items list */
        <div className="space-y-2 overflow-y-auto flex-1 max-h-[340px] pr-0.5">
          {documents.map((doc, idx) => {
            const title = doc.title || doc.fileName || `Document ${idx + 1}`;
            const chunkCount = doc.chunks_count ?? doc.chunksCreated ?? 1;
            const dateDisplay = formatDate(doc.created_at);
            const isThisDeleting = deletingTitle === title;

            return (
              <div
                key={idx}
                className="group flex items-center justify-between p-2.5 rounded-xl border border-slate-200/80 bg-white hover:border-indigo-200 hover:shadow-2xs transition-all"
              >
                {/* Left: Icon & Details */}
                <div className="flex items-center space-x-2.5 min-w-0 flex-1 mr-2">
                  <div
                    className={`w-8 h-8 rounded-lg border flex items-center justify-center flex-shrink-0 ${getFileBadgeColor(
                      title
                    )}`}
                  >
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p
                      className="text-xs font-semibold text-slate-800 truncate"
                      title={title}
                    >
                      {title}
                    </p>
                    <div className="flex items-center space-x-1.5 text-[10px] text-slate-400 mt-0.5">
                      <span className="flex items-center space-x-0.5">
                        <Layers className="w-2.5 h-2.5 text-purple-500" />
                        <span>{chunkCount} {chunkCount === 1 ? 'chunk' : 'chunks'}</span>
                      </span>
                      {dateDisplay && (
                        <>
                          <span>&bull;</span>
                          <span className="flex items-center space-x-0.5">
                            <Calendar className="w-2.5 h-2.5 text-slate-400" />
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
                    className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-50"
                  >
                    {isThisDeleting ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-500" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
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
