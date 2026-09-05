import React, { useState, useRef } from 'react';
import { Upload, FileText, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { uploadDocument } from '../services/api';

export default function DocumentUpload({ onUploadSuccess }) {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
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

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file || isUploading) return;

    setIsUploading(true);
    setUploadProgress(10);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const result = await uploadDocument(file, (progress) => {
        setUploadProgress(progress);
      });

      setSuccessMessage(
        `Successfully processed "${result.fileName}" into ${result.chunksCreated} vector chunks (${result.totalCharacters.toLocaleString()} characters).`
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
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
      <div className="flex items-center space-x-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
          <Upload className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Upload Knowledge Documents</h2>
          <p className="text-xs text-slate-500">Supports PDF, TXT, and Markdown up to 50MB</p>
        </div>
      </div>

      <form onSubmit={handleUpload}>
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
            isDragOver
              ? 'border-blue-500 bg-blue-50/50'
              : 'border-slate-300 hover:border-slate-400 bg-slate-50/50'
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => handleFileChange(e.target.files?.[0])}
            accept=".pdf,.txt,.md"
            className="hidden"
          />

          <div className="flex flex-col items-center justify-center space-y-2">
            <div className="p-3 bg-white rounded-full shadow-sm border border-slate-200 text-slate-600">
              <FileText className="w-6 h-6" />
            </div>
            {file ? (
              <div className="text-center">
                <p className="font-medium text-slate-800">{file.name}</p>
                <p className="text-xs text-slate-500">
                  {(file.size / 1024).toFixed(1)} KB &bull; Click or drop another to replace
                </p>
              </div>
            ) : (
              <div>
                <p className="text-sm font-medium text-slate-700">
                  Click to browse or drag & drop a file here
                </p>
                <p className="text-xs text-slate-400 mt-1">PDF, TXT, or MD</p>
              </div>
            )}
          </div>
        </div>

        {isUploading && (
          <div className="mt-4">
            <div className="flex justify-between text-xs text-slate-600 mb-1">
              <span>Embedding & Storing Chunks...</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div
                className="bg-blue-600 h-2 transition-all duration-300 rounded-full"
                style={{ width: `${Math.max(uploadProgress, 25)}%` }}
              />
            </div>
          </div>
        )}

        {successMessage && (
          <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start space-x-2 text-emerald-800 text-sm">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600 mt-0.5" />
            <span className="flex-1">{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start space-x-2 text-rose-800 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-600 mt-0.5" />
            <span className="flex-1">{errorMessage}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={!file || isUploading}
          className="mt-4 w-full py-2.5 px-4 rounded-xl font-medium text-sm flex items-center justify-center space-x-2 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800"
        >
          {isUploading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Processing & Embedding...</span>
            </>
          ) : (
            <>
              <Upload className="w-4 h-4" />
              <span>Process & Ingest Document</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
