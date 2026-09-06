import React, { useState } from 'react';
import { HelpCircle, Sparkles, Loader2, SendHorizontal } from 'lucide-react';

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
    if (!question.trim() || isLoading || !hasDocuments) return;
    onSubmitQuery(question.trim());
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleSuggestionClick = (text) => {
    setQuestion(text);
    onSubmitQuery(text);
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200/80">
      {/* Header */}
      <div className="flex items-center space-x-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
          <HelpCircle className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight">Ask Document Questions</h2>
          <p className="text-xs text-slate-400">Retrieve factual answers with document citations</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Sleek Single-Line Query Input Bar */}
        <div className="relative flex items-center bg-white border border-slate-200/90 rounded-2xl p-1.5 pl-4 shadow-2xs focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/10 transition-all">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              hasDocuments
                ? 'What is this document about?'
                : 'Upload a document above to start asking questions...'
            }
            disabled={!hasDocuments}
            className="w-full text-sm text-slate-800 placeholder:text-slate-400 outline-none bg-transparent pr-2 disabled:cursor-not-allowed"
          />

          <button
            type="submit"
            disabled={!question.trim() || isLoading || !hasDocuments}
            className="w-10 h-10 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white flex items-center justify-center flex-shrink-0 shadow-sm shadow-indigo-600/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            aria-label="Send question"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <SendHorizontal className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Loading state for generated prompts */}
        {isGeneratingPrompts && (
          <div className="pt-1">
            <div className="flex items-center space-x-2 text-xs text-indigo-600 bg-indigo-50/70 border border-indigo-100 rounded-xl px-3.5 py-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600 flex-shrink-0" />
              <span className="font-medium">Analyzing document with Gemini to generate smart questions...</span>
            </div>
          </div>
        )}

        {/* Dynamic Suggested Prompts from Document */}
        {hasDocuments && !isGeneratingPrompts && generatedPrompts && generatedPrompts.length > 0 && (
          <div className="pt-2">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
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
                  className="text-xs px-3 py-1.5 rounded-xl bg-slate-100/80 text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 border border-transparent active:bg-indigo-100 transition-all font-medium disabled:opacity-50 text-left"
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
