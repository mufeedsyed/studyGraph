import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { Subject, DocumentItem } from '../../types';
import { api } from '../../api/client';

interface PdfUploadModalProps {
  isOpen: boolean;
  subjects: Subject[];
  initialSubjectId?: string;
  onClose: () => void;
  onUploadSuccess: (newDoc: DocumentItem) => void;
}

export const PdfUploadModal: React.FC<PdfUploadModalProps> = ({
  isOpen,
  subjects,
  initialSubjectId,
  onClose,
  onUploadSuccess,
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [subjectId, setSubjectId] = useState<string>(initialSubjectId || (subjects[0]?.id ?? ''));
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (file: File) => {
    setError(null);
    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      setError('Only PDF documents are supported.');
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      setError('File size exceeds the 50MB maximum limit.');
      return;
    }

    setSelectedFile(file);
    if (!title) {
      setTitle(file.name.replace(/\.[^/.]+$/, ''));
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    try {
      setIsUploading(true);
      setError(null);
      setProgress(35);

      const uploaded = await api.uploadDocument(selectedFile, subjectId || undefined, title.trim());
      setProgress(100);

      setTimeout(() => {
        setIsUploading(false);
        onUploadSuccess(uploaded);
        onClose();
      }, 400);
    } catch (err: any) {
      console.error('Upload failed:', err);
      setError(err.message || 'Upload failed. Please try again.');
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-[#121217] border border-white/15 rounded-3xl p-6 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div>
            <h3 className="text-base font-semibold text-white">Upload Academic PDF</h3>
            <p className="text-xs text-neutral-400 mt-0.5">
              Securely store lecture notes, textbooks, and problem sets.
            </p>
          </div>
          <button onClick={onClose} className="p-1 text-neutral-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleUpload} className="mt-5 space-y-4">
          {/* Dropzone */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`relative border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all ${
              dragActive
                ? 'border-emerald-400 bg-emerald-500/10'
                : selectedFile
                ? 'border-white/30 bg-white/5'
                : 'border-white/15 hover:border-white/30 bg-[#16161c]'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,application/pdf"
              onChange={handleFileChange}
              className="hidden"
            />

            {selectedFile ? (
              <div className="flex items-center space-x-3 text-left">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-white truncate max-w-[260px]">
                    {selectedFile.name}
                  </p>
                  <p className="text-[10px] text-neutral-400">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB • PDF Document
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-neutral-400 mb-3">
                  <UploadCloud className="w-6 h-6 text-neutral-300" />
                </div>
                <p className="text-xs font-medium text-neutral-200">
                  Click to browse or drop your PDF here
                </p>
                <p className="text-[10px] text-neutral-500 mt-1">
                  Maximum file size: 50MB • Academic documents only
                </p>
              </>
            )}
          </div>

          {/* Document Title */}
          <div>
            <label className="block text-xs font-mono text-neutral-400 mb-1.5">
              DOCUMENT TITLE
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Kinematics Handbook 2026"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#18181f] border border-white/10 text-white text-xs focus:outline-none focus:border-white/30"
            />
          </div>

          {/* Target Subject Folder */}
          <div>
            <label className="block text-xs font-mono text-neutral-400 mb-1.5">
              TARGET SUBJECT FOLDER
            </label>
            <select
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#18181f] border border-white/10 text-white text-xs focus:outline-none focus:border-white/30"
            >
              <option value="">No subject folder (Uncategorized)</option>
              {subjects.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.title}
                </option>
              ))}
            </select>
          </div>

          {/* Progress Bar */}
          {isUploading && (
            <div className="space-y-1.5 pt-2">
              <div className="flex justify-between text-[11px] font-mono text-neutral-400">
                <span>Uploading document...</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full bg-emerald-400 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-4 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isUploading}
              className="px-4 py-2 rounded-xl text-neutral-400 hover:text-white text-xs font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!selectedFile || isUploading || !title.trim()}
              className="px-5 py-2 rounded-xl bg-white text-black text-xs font-semibold hover:bg-neutral-200 disabled:opacity-40 transition-colors shadow-lg"
            >
              {isUploading ? 'Uploading...' : 'Save & Store PDF'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
