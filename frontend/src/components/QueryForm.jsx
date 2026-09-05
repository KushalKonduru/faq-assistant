import React, { useState } from 'react';
import { Search, Sparkles, Loader2, ArrowRight } from 'lucide-react';

export default function QueryForm({ onSubmitQuery, isLoading, hasDocuments }) {
  const [question, setQuestion] = useState('');

  const suggestions = [
    "What is the return policy?",
    "How do I contact customer support?",
    "What is the warranty coverage?",
    "Summarize the key guidelines"
  ];

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
            placeholder="Type your question about the uploaded documents (e.g. 'What is the return window?')"
            className="w-full text-base sm:text-sm p-3.5 pr-12 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none transition-all placeholder:text-slate-400 resize-none"
          />

          <button
            type="submit"
            disabled={!question.trim() || isLoading}
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

        {/* Suggestion pills */}
        <div className="pt-2">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Suggested Prompts:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {suggestions.map((s, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSuggestionClick(s)}
                disabled={isLoading}
                className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900 active:bg-slate-300 transition-colors disabled:opacity-50"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </form>
    </div>
  );
}
