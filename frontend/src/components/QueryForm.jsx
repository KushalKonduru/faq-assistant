import React, { useState } from 'react';
import { Search, Sparkles, Loader2, ArrowRight } from 'lucide-react';

export default function QueryForm({
  onSubmitQuery,
  isLoading,
  hasDocuments,
  generatedPrompts = [],
  isGeneratingPrompts = false,
}) {
  const [question, setQuestion] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!question.trim() || isLoading) return;
    onSubmitQuery(question.trim());
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleSuggestionClick = (text) => {
    setQuestion(text);
    onSubmitQuery(text);
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
      <div className="flex items-center space-x-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Ask Document Questions</h2>
          <p className="text-xs text-slate-500">Retrieval-Augmented Generation answers backed by citations</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="relative">
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={3}
            placeholder={
              hasDocuments
                ? "Type your question about the uploaded documents (e.g. 'What are the main guidelines?')"
                : "Upload a document to start asking questions..."
            }
            disabled={!hasDocuments}
            className="w-full text-base sm:text-sm p-3.5 pr-12 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none transition-all placeholder:text-slate-400 resize-none disabled:bg-slate-50 disabled:cursor-not-allowed"
          />

          <button
            type="submit"
            disabled={!question.trim() || isLoading || !hasDocuments}
            className="absolute right-3 bottom-4 p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
            aria-label="Submit Question"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ArrowRight className="w-4 h-4" />
            )}
          </button>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-400 px-1">
          <span>Press <kbd className="px-1.5 py-0.5 rounded border border-slate-200 bg-slate-50 font-mono text-[11px] text-slate-600">Enter</kbd> to submit</span>
          <span>Powered by Gemini & pgvector</span>
        </div>

        {/* Loading state for generated prompts */}
        {isGeneratingPrompts && (
          <div className="pt-2">
            <div className="flex items-center space-x-2 text-xs text-indigo-600 bg-indigo-50/70 border border-indigo-100 rounded-xl px-3.5 py-2.5">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-600 flex-shrink-0" />
              <span className="font-medium">Analyzing document with Gemini to generate smart questions...</span>
            </div>
          </div>
        )}

        {/* Dynamic Suggested Prompts from Document */}
        {hasDocuments && !isGeneratingPrompts && generatedPrompts && generatedPrompts.length > 0 && (
          <div className="pt-2">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>SUGGESTED QUESTIONS FROM YOUR DOCUMENT:</span>
            </p>
            <div className="flex flex-wrap gap-1.5">
              {generatedPrompts.map((s, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSuggestionClick(s)}
                  disabled={isLoading}
                  className="text-xs px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 border border-transparent active:bg-indigo-100 transition-all font-medium disabled:opacity-50 text-left"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
