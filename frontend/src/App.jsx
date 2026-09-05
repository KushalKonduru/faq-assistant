import React, { useState, useEffect, useCallback } from 'react';
import { Bot, Sparkles, Activity, ShieldCheck, ArrowLeft, RefreshCw } from 'lucide-react';
import DocumentUpload from './components/DocumentUpload';
import DocumentList from './components/DocumentList';
import QueryForm from './components/QueryForm';
import AnswerDisplay from './components/AnswerDisplay';
import LandingPage from './components/LandingPage';
import { checkHealth, queryDocuments, getDocuments, deleteDocument, generatePrompts } from './services/api';

export default function App() {
  const [showApp, setShowApp] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);
  const [deletingTitle, setDeletingTitle] = useState(null);
  const [generatedPrompts, setGeneratedPrompts] = useState([]);
  const [isGeneratingPrompts, setIsGeneratingPrompts] = useState(false);
  const [queryResult, setQueryResult] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [isQuerying, setIsQuerying] = useState(false);
  const [queryError, setQueryError] = useState(null);
  const [isBackendOnline, setIsBackendOnline] = useState(null);

  // Fetch unique documents and chunk stats from Supabase
  const loadDocuments = useCallback(async (autoFetchPrompts = false) => {
    try {
      setIsLoadingDocs(true);
      const data = await getDocuments();
      const docs = data.documents || [];
      setDocuments(docs);

      // Auto-populate prompts for the first document if none loaded yet
      if (autoFetchPrompts && docs.length > 0) {
        try {
          setIsGeneratingPrompts(true);
          const promptData = await generatePrompts(docs[0].title);
          if (promptData?.prompts?.length > 0) {
            setGeneratedPrompts(promptData.prompts);
          }
        } catch (pErr) {
          console.warn('Could not auto-generate initial prompts:', pErr);
        } finally {
          setIsGeneratingPrompts(false);
        }
      } else if (docs.length === 0) {
        setGeneratedPrompts([]);
      }
    } catch (err) {
      console.warn('Could not fetch documents from backend:', err.message);
    } finally {
      setIsLoadingDocs(false);
    }
  }, []);

  // Check backend health and load documents on mount
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
    loadDocuments(true);

    const interval = setInterval(verifyBackend, 15000);
    return () => clearInterval(interval);
  }, [loadDocuments]);

  // When a new document is successfully uploaded, refresh the list from DB
  const handleUploadSuccess = () => {
    loadDocuments();
  };

  // Delete a document and its chunks from Supabase
  const handleDeleteDocument = async (title) => {
    try {
      setDeletingTitle(title);
      await deleteDocument(title);

      // If document was deleted, clear or refresh prompts
      const remainingDocs = documents.filter((d) => (d.title || d.fileName) !== title);
      if (remainingDocs.length === 0) {
        setGeneratedPrompts([]);
      } else {
        try {
          setIsGeneratingPrompts(true);
          const pData = await generatePrompts(remainingDocs[0].title);
          if (pData?.prompts?.length > 0) {
            setGeneratedPrompts(pData.prompts);
          }
        } catch {
          setGeneratedPrompts([]);
        } finally {
          setIsGeneratingPrompts(false);
        }
      }

      await loadDocuments();
    } catch (err) {
      console.error('Document deletion failed:', err);
      const msg = err.response?.data?.error || err.message || 'Failed to delete document';
      alert(`Error deleting document: ${msg}`);
    } finally {
      setDeletingTitle(null);
    }
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

  // If user is on landing page view, render LandingPage
  if (!showApp) {
    return <LandingPage onLaunchApp={() => setShowApp(true)} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      {/* Top Navigation Bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {/* Back to Home Button */}
            <button
              onClick={() => setShowApp(false)}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors mr-1"
              title="Return to Landing Page"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Back to Overview</span>
            </button>

            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-sm">
              <Bot className="w-4 h-4" />
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

          <div className="flex items-center space-x-3">
            {/* Refresh Documents Button */}
            <button
              onClick={loadDocuments}
              disabled={isLoadingDocs}
              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors disabled:opacity-50"
              title="Refresh Knowledge Base"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingDocs ? 'animate-spin text-indigo-600' : ''}`} />
            </button>

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
        </div>
      </header>

      {/* Main Two-Column Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Upload & Ingestion (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <DocumentUpload
              onUploadSuccess={handleUploadSuccess}
              setGeneratedPrompts={setGeneratedPrompts}
              setIsGeneratingPrompts={setIsGeneratingPrompts}
              isGeneratingPrompts={isGeneratingPrompts}
            />
            <DocumentList
              documents={documents}
              onDeleteDocument={handleDeleteDocument}
              isLoading={isLoadingDocs}
              deletingTitle={deletingTitle}
            />
          </div>

          {/* Right Column: Q&A Interaction & Answer Display (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <QueryForm
              onSubmitQuery={handleQuerySubmit}
              isLoading={isQuerying}
              hasDocuments={documents.length > 0}
              generatedPrompts={generatedPrompts}
              isGeneratingPrompts={isGeneratingPrompts}
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
