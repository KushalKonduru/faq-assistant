import React, { useState } from 'react';
import { Bot, Copy, Check, BookOpen, AlertCircle, Sparkles } from 'lucide-react';

function formatInlineText(text) {
  // Strip distracting bracket citations and redundant source annotations
  const clean = text
    .replace(/\[(?:Document|Doc)\s*\d+(?:\s*,\s*(?:Document|Doc)?\s*\d+)*\]/gi, '')
    .replace(/\(?\s*(?:Source|Source\s*Document|Ref):\s*[^)\n]+\)?/gi, '');

  // Parse bold (**bold**) and italics (*italic*)
  const parts = clean.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return (
        <strong key={i} className="font-semibold text-slate-900">
          {part.slice(2, -2)}
        </strong>
      );
    }
    const subParts = part.split(/(\*.*?\*)/g);
    return subParts.map((sub, j) => {
      if (sub.startsWith('*') && sub.endsWith('*') && sub.length > 2) {
        return (
          <em key={`${i}-${j}`} className="italic text-slate-800">
            {sub.slice(1, -1)}
          </em>
        );
      }
      return sub;
    });
  });
}

function FormattedAnswer({ content }) {
  if (!content) return null;

  const lines = content.split('\n');
  const elements = [];
  let currentList = [];

  const flushList = () => {
    if (currentList.length > 0) {
      elements.push(
        <ul key={`list-${elements.length}`} className="space-y-2.5 my-3 pl-1">
          {currentList.map((item, idx) => (
            <li
              key={idx}
              className="flex items-start space-x-2.5 text-slate-700 text-sm leading-relaxed"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2 flex-shrink-0" />
              <div className="flex-1">{formatInlineText(item)}</div>
            </li>
          ))}
        </ul>
      );
      currentList = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i].trim();

    if (!rawLine) {
      flushList();
      continue;
    }

    // Bullet point lines (* or - or •)
    if (rawLine.startsWith('* ') || rawLine.startsWith('- ') || rawLine.startsWith('• ')) {
      const itemText = rawLine.replace(/^[*•-]\s+/, '').trim();
      currentList.push(itemText);
      continue;
    }

    // Numbered list lines (1. 2.)
    const numMatch = rawLine.match(/^(\d+)\.\s+(.*)/);
    if (numMatch) {
      flushList();
      elements.push(
        <div
          key={`num-${i}`}
          className="flex items-start space-x-3 my-2 text-sm text-slate-700 leading-relaxed"
        >
          <span className="w-5 h-5 rounded-full bg-blue-50 text-blue-700 font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5 border border-blue-200">
            {numMatch[1]}
          </span>
          <div className="flex-1">{formatInlineText(numMatch[2])}</div>
        </div>
      );
      continue;
    }

    // Headings (### or ##)
    if (rawLine.startsWith('### ') || rawLine.startsWith('## ') || rawLine.startsWith('# ')) {
      flushList();
      const headingText = rawLine.replace(/^#+\s+/, '').trim();
      elements.push(
        <h4 key={`h-${i}`} className="font-bold text-slate-900 text-sm mt-3 mb-1.5">
          {formatInlineText(headingText)}
        </h4>
      );
      continue;
    }

    // Standard paragraph
    flushList();
    elements.push(
      <p key={`p-${i}`} className="text-sm text-slate-700 leading-relaxed mb-3 last:mb-0">
        {formatInlineText(rawLine)}
      </p>
    );
  }

  flushList();

  return <div className="space-y-1">{elements}</div>;
}

export default function AnswerDisplay({ queryResult, isLoading, currentQuestion, error }) {
  const [isCopied, setIsCopied] = useState(false);

  const cleanAnswerText = queryResult?.answer
    ? queryResult.answer
        .replace(/\[(?:Document|Doc)\s*\d+(?:\s*,\s*(?:Document|Doc)?\s*\d+)*\]/gi, '')
        .replace(/\(?\s*(?:Source|Source\s*Document|Ref):\s*[^)\n]+\)?/gi, '')
        .trim()
    : '';

  const handleCopy = () => {
    if (!cleanAnswerText) return;
    navigator.clipboard.writeText(cleanAnswerText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200/80 animate-pulse">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-indigo-50" />
          <div className="h-4 w-44 bg-slate-100 rounded" />
        </div>
        <div className="space-y-3">
          <div className="h-3.5 bg-slate-100 rounded w-full" />
          <div className="h-3.5 bg-slate-100 rounded w-5/6" />
          <div className="h-3.5 bg-slate-100 rounded w-4/6" />
        </div>
        <div className="mt-5 pt-4 border-t border-slate-100 flex gap-2">
          <div className="h-6 w-28 bg-slate-100 rounded-lg" />
          <div className="h-6 w-20 bg-slate-100 rounded-lg" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-xs border border-rose-200 bg-rose-50/30">
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
      <div className="bg-white rounded-2xl p-8 shadow-xs border border-slate-200/80 text-center min-h-[260px] flex flex-col items-center justify-center">
        <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400 mb-3 shadow-2xs">
          <Bot className="w-7 h-7 text-slate-400" />
        </div>
        <h3 className="text-sm font-bold text-slate-800">No Query Submitted Yet</h3>
        <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 leading-relaxed">
          Ask any question above and the AI will analyze your indexed knowledge documents to formulate an accurate answer with citations.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200/80 transition-all">
      {/* Question Asked (Matching Screenshot) */}
      {currentQuestion && (
        <div className="mb-5 pb-4 border-b border-slate-100">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center space-x-1.5">
              <span className="w-1 h-3.5 bg-indigo-600 rounded-full" />
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                QUESTION ASKED
              </span>
            </div>
            <span className="text-xs text-slate-400 font-medium">Just now</span>
          </div>
          <h3 className="text-lg font-bold text-slate-900 tracking-tight">
            &ldquo;{currentQuestion}&rdquo;
          </h3>
        </div>
      )}

      {/* Answer Header Bar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider">
            AI SYNTHESIZED ANSWER
          </h4>
        </div>

        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center space-x-1 text-xs text-slate-500 hover:text-slate-800 px-2 py-1 rounded-lg hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200"
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

      {/* Answer Body with Rich Formatting */}
      <div className="text-slate-800 text-sm leading-relaxed">
        <FormattedAnswer content={queryResult.answer} />
      </div>

      {/* Citations & Sources */}
      {queryResult.sources && queryResult.sources.length > 0 && (
        <div className="mt-5 pt-4 border-t border-slate-100">
          <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-400 mb-2.5">
            <BookOpen className="w-3.5 h-3.5 text-blue-500" />
            <span>Document Sources</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {queryResult.sources.map((source, idx) => {
              const score = queryResult.similarity_scores?.[idx];
              const scorePercent = score ? `${(score * 100).toFixed(1)}%` : null;

              return (
                <div
                  key={idx}
                  className="flex items-center space-x-1.5 text-xs px-3 py-1 bg-indigo-50/70 text-indigo-900 border border-indigo-100 rounded-lg font-medium"
                >
                  <span className="truncate max-w-[240px]">{source}</span>
                  {scorePercent && (
                    <span className="bg-indigo-200/60 text-indigo-800 text-[10px] px-1.5 py-0.5 rounded font-bold">
                      {scorePercent} Match
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
