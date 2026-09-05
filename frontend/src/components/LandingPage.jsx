import React from 'react';
import {
  Bot,
  Sparkles,
  ArrowRight,
  UploadCloud,
  Scissors,
  Cpu,
  Database,
  Search,
  CheckCircle2,
  ShieldCheck,
  Zap,
  Github,
  Layers,
  FileText,
  FileCheck,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';

export default function LandingPage({ onLaunchApp }) {
  const steps = [
    {
      step: '01',
      title: 'Document Ingestion',
      icon: UploadCloud,
      color: 'from-blue-500 to-cyan-500',
      description:
        'Upload your PDF, TXT, or Markdown documents. Files are securely parsed and normalized in memory.',
      badge: 'PDF / TXT / MD',
    },
    {
      step: '02',
      title: 'Intelligent Chunking',
      icon: Scissors,
      color: 'from-cyan-500 to-teal-500',
      description:
        '500-character segments with a 50-character sliding overlap prevent broken context across sentence boundaries.',
      badge: '500c / 50 overlap',
    },
    {
      step: '03',
      title: 'Zero-Cost Local Embeddings',
      icon: Cpu,
      color: 'from-teal-500 to-emerald-500',
      description:
        'HuggingFace Xenova all-MiniLM-L6-v2 runs locally on server CPU. Generates 384d vectors with $0.00 API bill.',
      badge: 'Local ONNX Runtime',
    },
    {
      step: '04',
      title: 'pgvector Storage',
      icon: Database,
      color: 'from-emerald-500 to-indigo-500',
      description:
        'Vectors are zero-padded to 1536d and stored in Supabase PostgreSQL with exact Cosine Similarity matching.',
      badge: 'Supabase pgvector',
    },
    {
      step: '05',
      title: 'Sub-second Semantic Retrieval',
      icon: Search,
      color: 'from-indigo-500 to-purple-500',
      description:
        'User questions are converted into query embeddings and matched via RPC cosine similarity in milliseconds.',
      badge: 'Cosine Similarity',
    },
    {
      step: '06',
      title: 'Gemini 3.6 Flash Synthesis',
      icon: Sparkles,
      color: 'from-purple-500 to-rose-500',
      description:
        'Google Gemini synthesizes precise, hallucination-free answers strictly grounded in retrieved document chunks.',
      badge: 'Strict Grounding & Citations',
    },
  ];

  const features = [
    {
      icon: Zap,
      title: 'Zero Embedding API Cost',
      description:
        'Powered by local ONNX Xenova Transformers. Embed thousands of document chunks without paying a cent to OpenAI or third-party vector providers.',
    },
    {
      icon: ShieldCheck,
      title: '100% Grounded Answers',
      description:
        'Say goodbye to hallucinations. Gemini is instructed to answer strictly from retrieved knowledge base excerpts, with clear document source attribution.',
    },
    {
      icon: Database,
      title: 'Supabase Vector Database',
      description:
        'Leverages PostgreSQL pgvector for reliable storage, metadata indexing, and exact vector similarity search without specialized vector DB lock-in.',
    },
    {
      icon: FileCheck,
      title: 'Document Management CRUD',
      description:
        'Full visibility into your knowledge base. Inspect indexed documents, chunk counters, timestamps, and delete stale files with a single click.',
    },
    {
      icon: Layers,
      title: 'Multi-Format Support',
      description:
        'Seamlessly process Adobe PDF reports, raw TXT files, and GitHub-style Markdown documentation with automated text extraction.',
    },
    {
      icon: Bot,
      title: 'Real-time Health Monitoring',
      description:
        'Built-in server heartbeat verification and dynamic similarity threshold adjustment for production-grade reliability.',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 selection:bg-indigo-500 selection:text-white">
      {/* Navigation Bar */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-slate-900/80 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-base tracking-tight text-white">
                  FAQ Assistant
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  RAG AI
                </span>
              </div>
            </div>
          </div>

          <nav className="hidden md:flex items-center space-x-8 text-sm font-medium text-slate-300">
            <a href="#how-it-works" className="hover:text-white transition-colors">
              How It Works
            </a>
            <a href="#features" className="hover:text-white transition-colors">
              Features
            </a>
            <a href="#architecture" className="hover:text-white transition-colors">
              Architecture
            </a>
          </nav>

          <div className="flex items-center space-x-3">
            <a
              href="https://github.com/KushalKonduru/faq-assistant"
              target="_blank"
              rel="noreferrer"
              className="hidden sm:inline-flex items-center space-x-1.5 text-xs font-medium text-slate-400 hover:text-white transition-colors px-3 py-2 rounded-lg hover:bg-slate-800"
            >
              <Github className="w-4 h-4" />
              <span>GitHub</span>
            </a>
            <button
              onClick={onLaunchApp}
              className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-md shadow-indigo-600/30 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <span>Launch Assistant</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-24 lg:pt-28 lg:pb-32">
        {/* Glow background effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-blue-600/20 via-indigo-600/20 to-purple-600/20 blur-[120px] pointer-events-none rounded-full" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Eyebrow badge */}
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-slate-800/80 border border-slate-700 text-xs font-medium text-slate-300 mb-8 backdrop-blur-sm shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
            <span>Enterprise Retrieval-Augmented Generation</span>
            <span className="text-slate-500">&bull;</span>
            <span className="text-emerald-400 font-semibold">100% Free Tier</span>
          </div>

          {/* Main Title */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-tight sm:leading-tight lg:leading-tight">
            Instant Answers From Your Documents With{' '}
            <span className="bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
              Semantic AI
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mt-6 text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto font-normal leading-relaxed">
            Upload company FAQs, technical manuals, or guidelines. Ask questions in natural language
            and receive cited, hallucination-free answers powered by Google Gemini and Supabase
            pgvector.
          </p>

          {/* CTA Buttons */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={onLaunchApp}
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2.5 px-7 py-3.5 rounded-xl text-base font-semibold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-600/25 transition-all transform hover:-translate-y-0.5"
            >
              <span>Launch FAQ Assistant</span>
              <ArrowRight className="w-5 h-5" />
            </button>
            <a
              href="#how-it-works"
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-6 py-3.5 rounded-xl text-base font-semibold bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 transition-colors"
            >
              <span>Explore Pipeline</span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </a>
          </div>

          {/* Interactive Mock Preview Card */}
          <div className="mt-16 max-w-4xl mx-auto rounded-2xl p-1 bg-gradient-to-b from-slate-700 via-slate-800 to-slate-900 shadow-2xl shadow-indigo-950/50">
            <div className="rounded-[15px] bg-slate-950 p-6 sm:p-8 text-left border border-slate-800">
              {/* Header simulation */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                  <span className="ml-2 text-xs font-mono text-slate-500">
                    knowledge-base-query.rag
                  </span>
                </div>
                <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2.5 py-0.5 rounded-full">
                  Vector Match: 94.6% Cosine Similarity
                </span>
              </div>

              {/* Simulated Query */}
              <div className="mt-6 space-y-4">
                <div className="bg-slate-900/90 rounded-xl p-4 border border-slate-800">
                  <p className="text-xs font-semibold uppercase tracking-wider text-indigo-400 mb-1">
                    User Question
                  </p>
                  <p className="text-sm sm:text-base text-slate-200 font-medium">
                    "What is our policy on remote work equipment reimbursement?"
                  </p>
                </div>

                {/* Simulated Gemini Response */}
                <div className="bg-gradient-to-b from-indigo-950/30 to-slate-900/60 rounded-xl p-5 border border-indigo-500/20">
                  <div className="flex items-center space-x-2 mb-2">
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                    <span className="text-xs font-semibold text-indigo-300">
                      Gemini 3.6 Flash &bull; Synthesized Answer
                    </span>
                  </div>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    According to the company policy guidelines, full-time remote team members are
                    entitled to a <strong>$500 one-time home office setup stipend</strong> upon
                    hire, plus an ongoing <strong>$50 monthly allowance</strong> for internet and
                    utilities. Receipts must be submitted through the expenses portal within 30 days
                    of purchase.
                  </p>

                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center space-x-2 text-slate-400">
                      <span className="font-semibold text-slate-300">Source Evidence:</span>
                      <span className="bg-slate-800 text-slate-300 px-2.5 py-1 rounded-md border border-slate-700 flex items-center space-x-1.5">
                        <FileText className="w-3.5 h-3.5 text-blue-400" />
                        <span>acme_faq_guide.txt</span>
                      </span>
                    </div>
                    <span className="text-[11px] text-emerald-400 font-mono">
                      Grounding: 100% &bull; Latency: 1.2s
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 bg-slate-950 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold tracking-widest uppercase text-indigo-400">
              End-to-End Architecture
            </span>
            <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              How the RAG Pipeline Works
            </h2>
            <p className="mt-4 text-base text-slate-400">
              From raw uploaded documents to grounded, cited intelligence in 6 optimized steps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {steps.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className="relative group rounded-2xl bg-slate-900 border border-slate-800 p-6 hover:border-indigo-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-indigo-950/30"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${item.color} flex items-center justify-center text-white shadow-md`}
                    >
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-2xl font-black text-slate-700 group-hover:text-indigo-400 transition-colors">
                      {item.step}
                    </span>
                  </div>

                  <span className="inline-block text-[11px] font-mono font-medium px-2 py-0.5 rounded bg-slate-800 text-indigo-300 border border-slate-700 mb-2">
                    {item.badge}
                  </span>

                  <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{item.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-slate-900 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold tracking-widest uppercase text-blue-400">
              Key Capabilities
            </span>
            <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Built for Speed, Accuracy &amp; Zero Cost
            </h2>
            <p className="mt-4 text-base text-slate-400">
              Modern engineering decisions designed to eliminate external subscription overhead.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <div
                  key={idx}
                  className="rounded-2xl bg-slate-950/60 border border-slate-800 p-6 hover:bg-slate-950 transition-colors"
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-white mb-2">{feat.title}</h3>
                  <p className="text-sm text-slate-400 leading-relaxed">{feat.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Architecture & Cost Transparency */}
      <section id="architecture" className="py-20 bg-slate-950 border-t border-slate-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl bg-gradient-to-r from-blue-900/30 via-indigo-900/30 to-purple-900/30 border border-indigo-500/30 p-8 sm:p-12">
            <div className="max-w-3xl">
              <span className="text-xs font-bold tracking-wider uppercase text-indigo-400">
                Cost &amp; Privacy Comparison
              </span>
              <h2 className="mt-2 text-2xl sm:text-3xl font-extrabold text-white">
                Why Local Transformers Beat Cloud Embedding APIs
              </h2>
              <p className="mt-4 text-sm sm:text-base text-slate-300 leading-relaxed">
                Traditional RAG architectures call proprietary cloud embedding APIs (such as OpenAI
                Ada/3-small) on every single chunk upload and search query, incurring cumulative
                costs and transmitting private documents over external networks.
              </p>
            </div>

            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-rose-400 mb-2">
                  Traditional Cloud RAG
                </h4>
                <ul className="space-y-2 text-xs text-slate-400">
                  <li className="flex items-center space-x-2">
                    <span className="text-rose-400 font-bold">✕</span>
                    <span>$0.02 - $0.13 per 1M embedding tokens</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span className="text-rose-400 font-bold">✕</span>
                    <span>Document data transmitted to 3rd-party vector APIs</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <span className="text-rose-400 font-bold">✕</span>
                    <span>Subject to proprietary API rate limits</span>
                  </li>
                </ul>
              </div>

              <div className="rounded-xl bg-indigo-950/40 border border-indigo-500/30 p-5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 mb-2">
                  Our Free-Tier Architecture
                </h4>
                <ul className="space-y-2 text-xs text-slate-200">
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>$0.00 cost via local Xenova MiniLM model</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Embedded locally on server before storage</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Supabase pgvector + Google Gemini Free Tier</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-slate-900 text-center relative overflow-hidden border-t border-slate-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Ready to Query Your Documents?
          </h2>
          <p className="mt-4 text-base text-slate-400 max-w-xl mx-auto">
            Upload your files into the knowledge base and start asking questions immediately.
          </p>
          <div className="mt-8">
            <button
              onClick={onLaunchApp}
              className="inline-flex items-center space-x-2.5 px-8 py-4 rounded-xl text-base font-semibold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white shadow-xl shadow-indigo-600/30 transition-all transform hover:-translate-y-0.5"
            >
              <span>Launch FAQ Assistant Now</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-800 py-8 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <Bot className="w-4 h-4 text-indigo-400" />
            <span className="text-slate-300 font-semibold">AI FAQ Assistant</span>
            <span>&bull;</span>
            <span>RAG Architecture</span>
          </div>

          <div className="flex items-center space-x-4">
            <a
              href="https://github.com/KushalKonduru/faq-assistant"
              target="_blank"
              rel="noreferrer"
              className="hover:text-slate-300 flex items-center space-x-1"
            >
              <Github className="w-3.5 h-3.5" />
              <span>GitHub Repository</span>
            </a>
            <span>&bull;</span>
            <span>Google Gemini 3.6 Flash</span>
            <span>&bull;</span>
            <span>Supabase pgvector</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
