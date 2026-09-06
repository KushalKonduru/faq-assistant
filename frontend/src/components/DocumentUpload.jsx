import React, { useState, useRef } from 'react';
import { Upload, FileText, CheckCircle2, AlertCircle, Loader2, X } from 'lucide-react';
import { uploadDocument, generatePrompts } from '../services/api';

export default function DocumentUpload({
  onUploadSuccess,
  setGeneratedPrompts,
  setIsGeneratingPrompts,
  isGeneratingPrompts,
}) {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStage, setUploadStage] = useState('');
  const [successMessage, setSuccessMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = (selectedFile) => {
    setSuccessMessage(null);
    setErrorMessage(null);

    if (!selectedFile) return;

    const validExtensions = ['.pdf', '.txt', '.md'];
    const hasValidExt = validExtensions.some((ext) =>
      selectedFile.name.toLowerCase().endsWith(ext)
    );

    if (!hasValidExt) {
      setErrorMessage('Invalid file type. Please upload a PDF, TXT, or Markdown (.md) file.');
      setFile(null);
      return;
    }

    if (selectedFile.size > 50 * 1024 * 1024) {
      setErrorMessage('File size exceeds 50MB limit.');
      setFile(null);
      return;
    }

    setFile(selectedFile);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleClearFile = (e) => {
    e.stopPropagation();
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file || isUploading) return;

    setIsUploading(true);
    setUploadProgress(10);
    setUploadStage('Embedding & Storing Chunks...');
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const result = await uploadDocument(file, (progress) => {
        setUploadProgress(progress);
      });

      // Auto-generate suggested prompts from document content
      if (setIsGeneratingPrompts) setIsGeneratingPrompts(true);
      setUploadStage('Analyzing document with Gemini...');

      try {
        const promptRes = await generatePrompts(result.fileName);
        if (promptRes?.prompts && setGeneratedPrompts) {
          setGeneratedPrompts(promptRes.prompts);
        }
      } catch (promptErr) {
        console.warn('Failed to generate prompts from chunks:', promptErr);
        if (setGeneratedPrompts) {
          setGeneratedPrompts([]);
        }
      } finally {
        if (setIsGeneratingPrompts) setIsGeneratingPrompts(false);
      }

      setSuccessMessage(
        `"${result.fileName}" ingested into ${result.chunksCreated} chunks.`
      );
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';

      if (onUploadSuccess) {
        onUploadSuccess(result);
      }
    } catch (err) {
      console.error('Upload failed:', err);
      const serverError =
        err.response?.data?.error || err.message || 'Failed to upload and process document';
      setErrorMessage(serverError);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      setUploadStage('');
    }
  };

  return (
    <div className="bg-slate-50/70 rounded-2xl p-4 border border-slate-200/90 shadow-2xs">
      {/* Section Header */}
      <div className="flex items-center space-x-2.5 mb-3">
        <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
          <Upload className="w-4 h-4" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-slate-900 tracking-tight">Upload Documents</h2>
          <p className="text-[11px] text-slate-400">PDF, TXT, MD &bull; Up to 50 MB</p>
        </div>
      </div>

      <form onSubmit={handleUpload}>
        {/* Drop Zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
            isDragOver
              ? 'border-indigo-500 bg-indigo-50/60'
              : 'border-indigo-200 hover:border-indigo-400 bg-white hover:bg-indigo-50/30'
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => handleFileChange(e.target.files?.[0])}
            accept=".pdf,.txt,.md"
            className="hidden"
          />

          <div className="flex flex-col items-center justify-center">
            {file ? (
              <div className="relative w-full">
                <div className="flex items-center justify-between p-2 rounded-lg bg-indigo-50/70 border border-indigo-100">
                  <div className="flex items-center space-x-2 min-w-0 flex-1">
                    <FileText className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                    <div className="min-w-0 text-left">
                      <p className="font-semibold text-slate-800 text-xs truncate max-w-[160px]">
                        {file.name}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {(file.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleClearFile}
                    className="p-1 text-slate-400 hover:text-slate-600 hover:bg-white rounded"
                    title="Remove file"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-500 flex items-center justify-center mx-auto mb-1.5 shadow-2xs border border-indigo-100">
                  <FileText className="w-4 h-4" />
                </div>
                <p className="text-xs font-semibold text-slate-700">
                  Drop file here or browse
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">PDF, TXT, or MD</p>
              </div>
            )}
          </div>
        </div>

        {/* Upload & Progress Stages */}
        {isUploading && (
          <div className="mt-3">
            <div className="flex justify-between text-[11px] font-medium text-slate-600 mb-1">
              <span className="truncate max-w-[200px]">{uploadStage || 'Embedding...'}</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="w-full bg-slate-200/80 rounded-full h-1.5 overflow-hidden">
              <div
                className="bg-indigo-600 h-1.5 transition-all duration-300 rounded-full"
                style={{ width: `${Math.max(uploadProgress, 20)}%` }}
              />
            </div>
          </div>
        )}

        {/* Success Alert */}
        {successMessage && (
          <div className="mt-3 p-2.5 bg-emerald-50/90 border border-emerald-200/80 rounded-xl flex items-start space-x-2 text-emerald-800 text-xs">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600 mt-0.5" />
            <span className="flex-1 text-[11px] leading-tight">{successMessage}</span>
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div className="mt-3 p-2.5 bg-rose-50/90 border border-rose-200/80 rounded-xl flex items-start space-x-2 text-rose-800 text-xs">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600 mt-0.5" />
            <span className="flex-1 text-[11px] leading-tight">{errorMessage}</span>
          </div>
        )}

        {/* Action Button */}
        <button
          type="submit"
          disabled={!file || isUploading}
          className="mt-3 w-full py-2.5 px-3 rounded-xl font-semibold text-xs flex items-center justify-center space-x-2 transition-all shadow-sm shadow-indigo-600/15 disabled:opacity-50 disabled:cursor-not-allowed bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white"
        >
          {isUploading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Processing &amp; Ingesting...</span>
            </>
          ) : (
            <>
              <Upload className="w-3.5 h-3.5" />
              <span>Process &amp; Ingest</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
