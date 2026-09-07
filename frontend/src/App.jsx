import React, { useState, useEffect, useCallback } from 'react';
import { Bot, Sparkles, ArrowLeft, RefreshCw, PanelLeftClose, PanelLeftOpen, ShieldCheck } from 'lucide-react';
import DocumentUpload from './components/DocumentUpload';
import DocumentList from './components/DocumentList';
import ChatInterface from './components/ChatInterface';
import LandingPage from './components/LandingPage';
import { checkHealth, queryDocuments, getDocuments, deleteDocument, clearSessionDocuments, generatePrompts } from './services/api';
import { getSessionId, resetSession } from './utils/session';

function getInitialView() {
  if (typeof window === 'undefined') return false;
  const path = window.location.pathname;
  const hash = window.location.hash;
  return path === '/chat' || hash === '#chat';
}

export default function App() {
  const [showApp, setShowApp] = useState(getInitialView);
  const [documents, setDocuments] = useState([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);
  const [deletingTitle, setDeletingTitle] = useState(null);
  const [generatedPrompts, setGeneratedPrompts] = useState([]);
  const [isGeneratingPrompts, setIsGeneratingPrompts] = useState(false);
  const [messages, setMessages] = useState([]);
  const [isQuerying, setIsQuerying] = useState(false);
  const [isBackendOnline, setIsBackendOnline] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Synchronize browser history and handle Back/Forward buttons
  useEffect(() => {
    const isInitialChat = getInitialView();
    if (!window.history.state) {
      window.history.replaceState(
        { view: isInitialChat ? 'chat' : 'landing' },
        '',
        isInitialChat ? '/chat' : window.location.pathname
      );
    }

    const handlePopState = (event) => {
      const isChat =
        event.state?.view === 'chat' ||
        window.location.pathname === '/chat' ||
        window.location.hash === '#chat';
      setShowApp(isChat);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

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

  // Reset private browser session (wipes active session workspace and Supabase chunks)
  const handleResetSession = async () => {
    if (
      window.confirm(
        'Start a new private session? This will wipe your uploaded documents and reset your workspace.'
      )
    ) {
      try {
        await clearSessionDocuments();
      } catch (err) {
        console.warn('Could not wipe remote session docs:', err);
      }
      resetSession();
      setDocuments([]);
      setGeneratedPrompts([]);
      setMessages([]);
      loadDocuments(false);
    }
  };

  // Refresh / Regenerate starter questions from document chunks
  const handleRefreshPrompts = async () => {
    if (documents.length === 0 || isGeneratingPrompts) return;
    try {
      setIsGeneratingPrompts(true);
      const targetDoc = documents[0];
      const pData = await generatePrompts(targetDoc.title || targetDoc.fileName);
      if (pData?.prompts?.length > 0) {
        setGeneratedPrompts(pData.prompts);
      }
    } catch (err) {
      console.warn('Could not refresh starter questions from chunks:', err);
    } finally {
      setIsGeneratingPrompts(false);
    }
  };

  // Chat message submission handler
  const handleSendMessage = async (question) => {
    const userMsg = {
      id: Date.now(),
      role: 'user',
      content: question,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsQuerying(true);

    try {
      const data = await queryDocuments(question);
      const botMsg = {
        id: Date.now() + 1,
        role: 'assistant',
        content: data.answer,
        sources: data.sources || [],
        similarity_scores: data.similarity_scores || [],
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      console.error('Query execution failed:', err);
      const errorMsg = {
        id: Date.now() + 1,
        role: 'assistant',
        isError: true,
        content:
          err.response?.data?.error ||
          err.message ||
          'Failed to generate an answer. Please verify the backend is running and try again.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsQuerying(false);
    }
  };

  const handleClearChat = () => {
    setMessages([]);
  };

  // Navigate to Chat workspace with browser history synchronization
  const handleLaunchApp = () => {
    if (!showApp) {
      window.history.pushState({ view: 'chat' }, '', '/chat');
      setShowApp(true);
    }
  };

  // Navigate back to Landing page overview with browser history synchronization
  const handleReturnToLanding = () => {
    if (window.history.state?.view === 'chat') {
      window.history.back();
      setShowApp(false);
    } else {
      window.history.pushState({ view: 'landing' }, '', '/');
      setShowApp(false);
    }
  };

  // If user is on landing page view, render LandingPage
  if (!showApp) {
    return <LandingPage onLaunchApp={handleLaunchApp} />;
  }

  // Common sidebar content
  const sidebarContent = (
    <div className="flex flex-col h-full bg-white w-full overflow-hidden">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-slate-200/80 flex-shrink-0 space-y-3">
        {/* Top Actions: Back to Overview + Refresh + Collapse Sidebar */}
        <div className="flex items-center justify-between">
          <button
            onClick={handleReturnToLanding}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 rounded-xl border border-slate-200 shadow-2xs transition-all"
            title="Return to Overview"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Overview</span>
          </button>

          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => loadDocuments()}
              disabled={isLoadingDocs}
              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors disabled:opacity-50"
              title="Refresh Knowledge Base"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingDocs ? 'animate-spin text-indigo-600' : ''}`} />
            </button>

            <button
              onClick={() => setIsSidebarOpen(false)}
              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
              title="Collapse sidebar"
            >
              <PanelLeftClose className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Brand Bar */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-xs">
              <Sparkles className="w-4.5 h-4.5" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <h1 className="text-sm font-bold text-slate-900 tracking-tight">ContextSense</h1>
                <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                  RAG
                </span>
              </div>
              <p className="text-[10px] text-slate-400">Gemini + Supabase</p>
            </div>
          </div>

          {/* Backend Status Dot */}
          <div
            className="flex items-center space-x-1.5 text-[11px] font-medium px-2 py-0.5 rounded-full border bg-emerald-50/80 text-emerald-800 border-emerald-200/70"
            title="Backend Status"
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isBackendOnline === true
                  ? 'bg-emerald-500 animate-pulse'
                  : isBackendOnline === false
                  ? 'bg-rose-500'
                  : 'bg-amber-400 animate-ping'
              }`}
            />
            <span className="text-[10px]">
              {isBackendOnline === true ? 'Online' : isBackendOnline === false ? 'Offline' : 'Connecting'}
            </span>
          </div>
        </div>
      </div>

      {/* Sidebar Scrollable Body: Upload + Knowledge Base */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Section 1: Upload Documents */}
        <DocumentUpload
          onUploadSuccess={handleUploadSuccess}
          setGeneratedPrompts={setGeneratedPrompts}
          setIsGeneratingPrompts={setIsGeneratingPrompts}
          isGeneratingPrompts={isGeneratingPrompts}
        />

        {/* Section 2: Knowledge Base Document List */}
        <DocumentList
          documents={documents}
          onDeleteDocument={handleDeleteDocument}
          isLoading={isLoadingDocs}
          deletingTitle={deletingTitle}
        />
      </div>

      {/* Sidebar Footer with Private Vault status & New Session button */}
      <div className="p-3 border-t border-slate-200/80 bg-slate-50/60 flex items-center justify-between flex-shrink-0 text-[11px]">
        <div className="flex items-center space-x-1.5 text-slate-600" title="All documents and searches are isolated to your browser session">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span className="font-semibold text-[11px]">Private Vault</span>
        </div>
        <button
          onClick={handleResetSession}
          className="text-[10px] font-medium text-slate-500 hover:text-indigo-600 hover:underline px-1.5 py-0.5 rounded border border-slate-200 bg-white hover:border-indigo-200 transition-colors"
          title="Start a new private session (clears active session)"
        >
          New Session
        </button>
      </div>
    </div>
  );

  return (
    <div className="h-screen w-full flex overflow-hidden font-sans text-slate-900 bg-white antialiased">
      {/* Left Sidebar (In-flow flex column: zero overlap guaranteed) */}
      {isSidebarOpen && (
        <aside className="w-80 md:w-84 xl:w-96 flex-shrink-0 h-screen border-r border-slate-200/90 flex flex-col bg-white overflow-hidden z-10 transition-all">
          {sidebarContent}
        </aside>
      )}

      {/* Main Center Area: Chatbot Q&A Workspace */}
      <main className="flex-1 h-screen flex flex-col min-w-0 bg-slate-50/70 overflow-hidden">
        <ChatInterface
          messages={messages}
          isLoading={isQuerying}
          hasDocuments={documents.length > 0}
          documentsCount={documents.length}
          generatedPrompts={generatedPrompts}
          isGeneratingPrompts={isGeneratingPrompts}
          onRefreshPrompts={handleRefreshPrompts}
          onSendMessage={handleSendMessage}
          onClearChat={handleClearChat}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          isSidebarOpen={isSidebarOpen}
        />
      </main>
    </div>
  );
}
