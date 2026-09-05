import React, { useState } from 'react';
import { Bot, Copy, Check, BookOpen, AlertCircle, Sparkles } from 'lucide-react';

export default function AnswerDisplay({ queryResult, isLoading, currentQuestion, error }) {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = () => {
    if (!queryResult?.answer) return;
    navigator.clipboard.writeText(queryResult.answer);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 mt-6 animate-pulse">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-blue-100/70" />
          <div className="h-4 w-40 bg-slate-200 rounded" />
        </div>
        <div className="space-y-2.5">
          <div className="h-3.5 bg-slate-100 rounded w-full" />
          <div className="h-3.5 bg-slate-100 rounded w-5/6" />
          <div className="h-3.5 bg-slate-100 rounded w-4/6" />
        </div>
        <div className="mt-4 pt-4 border-t border-slate-100 flex gap-2">
          <div className="h-6 w-24 bg-slate-100 rounded-full" />
          <div className="h-6 w-20 bg-slate-100 rounded-full" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-rose-200 mt-6 bg-rose-50/20">
        <div className="flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-rose-600 mt-0.5 flex-shrink-0" />
          <div>
            <h3 className="text-sm font-semibold text-rose-900">Query Failed</h3>
            <p className="text-xs text-rose-700 mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!queryResult) {
    return (
      <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200 mt-6 text-center">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400 mb-3">
          <Bot className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-semibold text-slate-800">No Query Submitted Yet</h3>
        <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
          Ask any question above and the AI will analyze the indexed vector embeddings to formulate an accurate answer with citations.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 mt-6 transition-all">
      {/* Question Recap */}
      {currentQuestion && (
        <div className="mb-4 pb-3 border-b border-slate-100">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Question Asked
          </span>
          <p className="text-sm font-medium text-slate-800 italic">
            &ldquo;{currentQuestion}&rdquo;
          </p>
        </div>
      )}

      {/* Answer Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-semibold text-slate-900">AI Synthesized Answer</h3>
        </div>

        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center space-x-1 text-xs text-slate-500 hover:text-slate-800 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          title="Copy answer to clipboard"
        >
          {isCopied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-emerald-600 text-[11px] font-medium">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span className="text-[11px]">Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Answer Body */}
      <div className="prose prose-sm max-w-none text-slate-700 leading-relaxed whitespace-pre-line bg-slate-50/50 p-4 rounded-xl border border-slate-100">
        {queryResult.answer}
      </div>

      {/* Citations & Sources */}
      {queryResult.sources && queryResult.sources.length > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-100">
          <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-500 mb-2">
            <BookOpen className="w-3.5 h-3.5 text-blue-500" />
            <span>Document Citations &amp; Relevance</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {queryResult.sources.map((source, idx) => {
              const score = queryResult.similarity_scores?.[idx];
              const scorePercent = score ? `${(score * 100).toFixed(1)}%` : null;

              return (
                <div
                  key={idx}
                  className="flex items-center space-x-1.5 text-xs px-2.5 py-1 bg-blue-50 text-blue-800 border border-blue-100 rounded-lg font-medium"
                >
                  <span className="truncate max-w-[180px]">{source}</span>
                  {scorePercent && (
                    <span className="bg-blue-200/70 text-blue-900 text-[10px] px-1.5 py-0.5 rounded font-bold">
                      {scorePercent}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
