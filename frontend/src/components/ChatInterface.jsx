import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  Sparkles,
  SendHorizontal,
  Loader2,
  Copy,
  Check,
  BookOpen,
  Trash2,
  PanelLeftClose,
  PanelLeftOpen,
  FileText,
  AlertCircle,
  HelpCircle,
  RefreshCw,
} from 'lucide-react';

function formatInlineText(text) {
  // Strip distracting bracket citations and redundant source annotations
  const clean = text
    .replace(/\[(?:Document|Doc)\s*\d+(?:\s*,\s*(?:Document|Doc)?\s*\d+)*\]/gi, '')
    .replace(/\(?\s*(?:Source|Source\s*Document|Ref):\s*[^)\n]+\)?/gi, '');

  // Split by bold (**bold**), inline code (`code`), and italics (*italic*)
  const parts = clean.split(/(`[^`]+`|\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      return (
        <code
          key={i}
          className="px-1.5 py-0.5 rounded bg-slate-100 text-indigo-700 font-mono text-xs border border-slate-200"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
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
        <ul key={`list-${elements.length}`} className="space-y-2 my-2.5 pl-1">
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
        <h4 key={`h-${i}`} className="font-bold text-slate-900 text-sm mt-3 mb-1">
          {formatInlineText(headingText)}
        </h4>
      );
      continue;
    }

    // Standard paragraph
    flushList();
    elements.push(
      <p key={`p-${i}`} className="text-sm text-slate-700 leading-relaxed mb-2.5 last:mb-0">
        {formatInlineText(rawLine)}
      </p>
    );
  }

  flushList();

  return <div className="space-y-1">{elements}</div>;
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!text) return;
    const cleanText = text
      .replace(/\[(?:Document|Doc)\s*\d+(?:\s*,\s*(?:Document|Doc)?\s*\d+)*\]/gi, '')
      .replace(/\(?\s*(?:Source|Source\s*Document|Ref):\s*[^)\n]+\)?/gi, '')
      .trim();
    navigator.clipboard.writeText(cleanText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="flex items-center space-x-1 text-xs text-slate-400 hover:text-slate-700 px-2 py-1 rounded-lg hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200"
      title="Copy answer"
    >
      {copied ? (
        <>
          <Check className="w-3.5 h-3.5 text-emerald-600" />
          <span className="text-emerald-600 text-[11px] font-medium">Copied</span>
        </>
      ) : (
        <>
          <Copy className="w-3.5 h-3.5" />
          <span className="text-[11px]">Copy</span>
        </>
      )}
    </button>
  );
}

export default function ChatInterface({
  messages = [],
  isLoading = false,
  hasDocuments = false,
  documentsCount = 0,
  generatedPrompts = [],
  isGeneratingPrompts = false,
  onRefreshPrompts,
  onSendMessage,
  onClearChat,
  onToggleSidebar,
  isSidebarOpen = true,
}) {
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom of chat when new message arrives or loading state changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!inputText.trim() || isLoading || !hasDocuments) return;
    const query = inputText.trim();
    setInputText('');
    onSendMessage(query);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handlePromptClick = (prompt) => {
    setInputText('');
    onSendMessage(prompt);
  };

  const formatTime = (dateObj) => {
    if (!dateObj) return 'Just now';
    try {
      const d = new Date(dateObj);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return 'Just now';
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50/70 overflow-hidden relative min-w-0">
      {/* Top Header Bar */}
      <header className="h-16 border-b border-slate-200/80 bg-white px-4 sm:px-6 flex items-center justify-between z-10 flex-shrink-0">
        <div className="flex items-center space-x-3.5 min-w-0">
          {/* Sidebar Collapse/Expand Toggle Button */}
          <button
            type="button"
            onClick={onToggleSidebar}
            className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl border border-slate-200 shadow-2xs transition-colors flex-shrink-0"
            title={isSidebarOpen ? 'Collapse left sidebar' : 'Expand left sidebar'}
            aria-label="Toggle sidebar"
          >
            {isSidebarOpen ? (
              <PanelLeftClose className="w-4 h-4 text-slate-600" />
            ) : (
              <PanelLeftOpen className="w-4 h-4 text-indigo-600" />
            )}
          </button>

          <div className="min-w-0">
            <div className="flex items-center space-x-2.5">
              <h1 className="text-base font-bold text-slate-900 tracking-tight whitespace-nowrap">
                Document Q&amp;A Chat
              </h1>
              <span
                className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border flex-shrink-0 ${
                  hasDocuments
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200/70'
                    : 'bg-amber-50 text-amber-700 border-amber-200/70'
                }`}
              >
                {hasDocuments
                  ? `${documentsCount} ${documentsCount === 1 ? 'doc' : 'docs'} indexed`
                  : 'No docs indexed'}
              </span>
            </div>
            <p className="text-xs text-slate-400 truncate hidden sm:block">
              Ask questions grounded directly in your knowledge base
            </p>
          </div>
        </div>

        {/* Clear Chat Button */}
        {messages.length > 0 && (
          <button
            type="button"
            onClick={onClearChat}
            disabled={isLoading}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-xl border border-slate-200 hover:border-rose-200 transition-all disabled:opacity-50 flex-shrink-0"
            title="Clear conversation"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Clear Chat</span>
          </button>
        )}
      </header>

      {/* Main Chat Stream (Scrollable, Centered) */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Empty State: Welcoming Hero & Starter Suggestions */}
          {messages.length === 0 && (
            <div className="py-10 text-center flex flex-col items-center justify-center">
              {/* Glowing Bot Avatar */}
              <div className="relative mb-5">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25">
                  <Bot className="w-8 h-8" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-lg bg-emerald-500 border-2 border-white flex items-center justify-center text-white shadow-2xs">
                  <Sparkles className="w-3 h-3" />
                </div>
              </div>

              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight mb-2">
                What would you like to know?
              </h2>
              <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed mb-8">
                {hasDocuments
                  ? 'Ask any question about your uploaded documents. The AI will retrieve the most relevant passages and cite its sources.'
                  : 'Upload PDF, TXT, or Markdown documents in the left sidebar to enable semantic search and AI Q&A.'}
              </p>

              {/* Suggestions Grid */}
              {hasDocuments && (
                <div className="w-full max-w-2xl text-left">
                  <div className="flex items-center justify-between mb-3 px-1">
                    <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>Suggested Starter Questions</span>
                    </div>
                    {onRefreshPrompts && (
                      <button
                        type="button"
                        onClick={onRefreshPrompts}
                        disabled={isGeneratingPrompts}
                        className="text-[11px] text-indigo-600 hover:text-indigo-800 font-medium inline-flex items-center space-x-1 transition-colors disabled:opacity-50"
                        title="Regenerate questions from document chunks"
                      >
                        <RefreshCw className={`w-3 h-3 ${isGeneratingPrompts ? 'animate-spin text-indigo-600' : ''}`} />
                        <span>Regenerate</span>
                      </button>
                    )}
                  </div>

                  {isGeneratingPrompts ? (
                    <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 flex items-center space-x-3 text-indigo-700 text-xs font-medium">
                      <Loader2 className="w-4 h-4 animate-spin text-indigo-600 flex-shrink-0" />
                      <span>Analyzing document chunks with Gemini to formulate questions...</span>
                    </div>
                  ) : generatedPrompts && generatedPrompts.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {generatedPrompts.slice(0, 6).map((prompt, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handlePromptClick(prompt)}
                          disabled={isLoading}
                          className="group p-3.5 rounded-2xl bg-white hover:bg-indigo-50/50 border border-slate-200/90 hover:border-indigo-200 text-left transition-all shadow-2xs hover:shadow-xs flex items-start space-x-2.5"
                        >
                          <HelpCircle className="w-4 h-4 text-indigo-500 mt-0.5 flex-shrink-0 group-hover:scale-110 transition-transform" />
                          <span className="text-xs font-medium text-slate-700 group-hover:text-indigo-950 leading-relaxed line-clamp-2">
                            {prompt}
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : onRefreshPrompts ? (
                    <div className="p-4 rounded-2xl bg-white border border-slate-200 text-center">
                      <button
                        type="button"
                        onClick={onRefreshPrompts}
                        className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 inline-flex items-center space-x-1.5"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        <span>Generate questions from document chunks</span>
                      </button>
                    </div>
                  ) : null}
                </div>
              )}

              {!hasDocuments && (
                <div className="p-4 rounded-2xl bg-white border border-dashed border-slate-300 max-w-md text-xs text-slate-500 flex items-center space-x-3">
                  <FileText className="w-5 h-5 text-indigo-500 flex-shrink-0" />
                  <span>
                    Get started by uploading your first document in the left sidebar drop zone.
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Conversation Messages */}
          {messages.map((msg) => {
            const isUser = msg.role === 'user';

            if (isUser) {
              return (
                <div key={msg.id} className="flex justify-end">
                  <div className="max-w-2xl bg-indigo-600 text-white rounded-2xl rounded-tr-xs px-5 py-3.5 shadow-xs">
                    <div className="flex items-center justify-between gap-4 mb-1 text-[11px] text-indigo-200">
                      <span className="font-semibold">You</span>
                      <span>{formatTime(msg.timestamp)}</span>
                    </div>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              );
            }

            // Assistant Message
            return (
              <div key={msg.id} className="flex items-start space-x-3.5 max-w-3xl">
                {/* AI Avatar */}
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 flex items-center justify-center text-white flex-shrink-0 shadow-xs mt-0.5">
                  <Sparkles className="w-4 h-4" />
                </div>

                {/* Answer Card */}
                <div className="flex-1 min-w-0 bg-white border border-slate-200/90 rounded-2xl rounded-tl-xs p-5 shadow-xs">
                  {/* Header */}
                  <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-slate-800 tracking-wide">
                        AI Assistant
                      </span>
                      <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
                        RAG
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-[11px] text-slate-400">
                        {formatTime(msg.timestamp)}
                      </span>
                      {!msg.isError && <CopyButton text={msg.content} />}
                    </div>
                  </div>

                  {/* Body */}
                  {msg.isError ? (
                    <div className="flex items-start space-x-2.5 text-rose-700 bg-rose-50/70 p-3 rounded-xl border border-rose-100 text-xs">
                      <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                      <p className="leading-relaxed">{msg.content}</p>
                    </div>
                  ) : (
                    <div className="text-slate-800 text-sm leading-relaxed">
                      <FormattedAnswer content={msg.content} />
                    </div>
                  )}

                  {/* Document Sources & Citations */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-slate-100">
                      <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-400 mb-2">
                        <BookOpen className="w-3.5 h-3.5 text-blue-500" />
                        <span>Sources Cited</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {msg.sources.map((source, idx) => {
                          const score = msg.similarity_scores?.[idx];
                          const scorePercent = score ? `${(score * 100).toFixed(1)}%` : null;

                          return (
                            <div
                              key={idx}
                              className="flex items-center space-x-1.5 text-xs px-2.5 py-1 bg-indigo-50/70 text-indigo-900 border border-indigo-100 rounded-lg font-medium"
                            >
                              <span className="truncate max-w-[200px]">{source}</span>
                              {scorePercent && (
                                <span className="bg-indigo-200/60 text-indigo-800 text-[10px] px-1.5 py-0.5 rounded font-bold">
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
              </div>
            );
          })}

          {/* Loading Indicator when Querying */}
          {isLoading && (
            <div className="flex items-start space-x-3.5 max-w-3xl animate-pulse">
              <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-white border border-slate-200/90 rounded-2xl rounded-tl-xs px-5 py-4 shadow-xs flex items-center space-x-3">
                <Loader2 className="w-4 h-4 text-indigo-600 animate-spin" />
                <span className="text-xs font-medium text-slate-600">
                  Retrieving matching passages & synthesizing answer with Gemini...
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Pinned Bottom Input Bar (Chatbot Style) */}
      <div className="border-t border-slate-200/80 bg-white/90 backdrop-blur-md p-4 sm:px-6 flex-shrink-0 z-10">
        <div className="max-w-3xl mx-auto space-y-2">
          {/* Quick suggestions pills when conversation is active */}
          {hasDocuments && messages.length > 0 && generatedPrompts && generatedPrompts.length > 0 && (
            <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex-shrink-0 mr-1 flex items-center space-x-1">
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span>Suggestions:</span>
              </span>
              {generatedPrompts.slice(0, 5).map((prompt, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handlePromptClick(prompt)}
                  disabled={isLoading}
                  className="flex-shrink-0 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-700 text-xs border border-transparent hover:border-indigo-200 transition-all font-medium disabled:opacity-50"
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}

          {/* Input Box */}
          <form onSubmit={handleSubmit} className="relative flex items-center">
            <div className="relative flex-1 flex items-center bg-white border border-slate-200/90 rounded-2xl p-1.5 pl-4 shadow-xs focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/10 transition-all">
              <input
                ref={inputRef}
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  hasDocuments
                    ? 'Ask a question about your documents... (Press Enter)'
                    : 'Upload a document in the sidebar to start asking questions...'
                }
                disabled={!hasDocuments || isLoading}
                className="w-full text-sm text-slate-800 placeholder:text-slate-400 outline-none bg-transparent pr-2 disabled:cursor-not-allowed"
              />

              <button
                type="submit"
                disabled={!inputText.trim() || isLoading || !hasDocuments}
                className="w-10 h-10 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white flex items-center justify-center flex-shrink-0 shadow-sm shadow-indigo-600/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                aria-label="Send query"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <SendHorizontal className="w-4 h-4" />
                )}
              </button>
            </div>
          </form>

          {/* Micro Disclaimer */}
          <p className="text-[11px] text-center text-slate-400">
            Answers are grounded in your indexed Supabase documents &bull; Powered by Google Gemini RAG
          </p>
        </div>
      </div>
    </div>
  );
}
