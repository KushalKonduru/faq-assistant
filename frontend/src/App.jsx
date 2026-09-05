import React, { useState, useEffect } from 'react';
import { Bot, Sparkles, Activity, ShieldCheck } from 'lucide-react';
import DocumentUpload from './components/DocumentUpload';
import DocumentList from './components/DocumentList';
import QueryForm from './components/QueryForm';
import AnswerDisplay from './components/AnswerDisplay';
import { checkHealth, queryDocuments } from './services/api';

export default function App() {
  const [documents, setDocuments] = useState([
    {
      fileName: 'acme_faq_guide.txt',
      fileType: 'text/plain',
      totalCharacters: 495,
      chunksCreated: 1,
    }
  ]);
  const [queryResult, setQueryResult] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [isQuerying, setIsQuerying] = useState(false);
  const [queryError, setQueryError] = useState(null);
  const [isBackendOnline, setIsBackendOnline] = useState(null);

  // Check backend health on mount
  useEffect(() => {
    const verifyBackend = async () => {
      try {
        await checkHealth();
        setIsBackendOnline(true);
      } catch (err) {
        console.warn('Backend currently offline or unreachable:', err.message);
        setIsBackendOnline(false);
      }
    };
    verifyBackend();
    const interval = setInterval(verifyBackend, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleUploadSuccess = (newDoc) => {
    setDocuments((prev) => [newDoc, ...prev]);
  };

  const handleQuerySubmit = async (question) => {
    setCurrentQuestion(question);
    setIsQuerying(true);
    setQueryError(null);

    try {
      const data = await queryDocuments(question);
      setQueryResult(data);
    } catch (err) {
      console.error('Query execution failed:', err);
      const msg =
        err.response?.data?.error || err.message || 'Failed to generate answer for your question';
      setQueryError(msg);
    } finally {
      setIsQuerying(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      {/* Top Navigation Bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-sm">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-base font-bold text-slate-900 tracking-tight">
                  AI FAQ Assistant
                </h1>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  RAG
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                Retrieval-Augmented Generation with Supabase &amp; Gemini
              </p>
            </div>
          </div>

          {/* Backend Status Indicator */}
          <div className="flex items-center space-x-2 text-xs font-medium bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-full">
            <span
              className={`w-2 h-2 rounded-full ${
                isBackendOnline === true
                  ? 'bg-emerald-500 animate-pulse'
                  : isBackendOnline === false
                  ? 'bg-rose-500'
                  : 'bg-amber-400 animate-ping'
              }`}
            />
            <span className="text-slate-600">
              {isBackendOnline === true
                ? 'Backend Online'
                : isBackendOnline === false
                ? 'Backend Offline'
                : 'Connecting...'}
            </span>
          </div>
        </div>
      </header>

      {/* Main Two-Column Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Upload & Ingestion (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <DocumentUpload onUploadSuccess={handleUploadSuccess} />
            <DocumentList documents={documents} />
          </div>

          {/* Right Column: Q&A Interaction & Answer Display (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <QueryForm
              onSubmitQuery={handleQuerySubmit}
              isLoading={isQuerying}
              hasDocuments={documents.length > 0}
            />

            <AnswerDisplay
              queryResult={queryResult}
              isLoading={isQuerying}
              currentQuestion={currentQuestion}
              error={queryError}
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>&copy; {new Date().getFullYear()} AI FAQ Assistant &bull; Powered by Google Gemini &amp; Supabase pgvector</p>
          <div className="flex items-center space-x-3 text-[11px] text-slate-400">
            <span>Local Transformers</span>
            <span>&bull;</span>
            <span>Zero-Cost Embeddings</span>
            <span>&bull;</span>
            <span>Instant Semantic Search</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
