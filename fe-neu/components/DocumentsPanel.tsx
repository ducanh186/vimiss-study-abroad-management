import React, { useEffect, useState, useCallback } from 'react';
import {
  getApplicationDocuments,
  uploadDocument,
  getDocumentPreviewUrl,
  getDocumentDownloadUrl,
} from '../services/apiService';
import type { ApplicationDocument } from '../types';

const DOC_TYPES = [
  'passport',
  'transcript',
  'hsk_cert',
  'hskk_cert',
  'recommendation',
  'personal_statement',
  'photo',
  'medical_report',
  'other',
] as const;

const LABEL_COLORS: Record<string, string> = {
  pending_review: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  valid: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  need_more: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  translating: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  submitted: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
};

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface DocumentsPanelProps {
  applicationId: number;
  /** If true, show the upload form. Default: true */
  showUpload?: boolean;
}

const DocumentsPanel: React.FC<DocumentsPanelProps> = ({ applicationId, showUpload = true }) => {
  const [documents, setDocuments] = useState<ApplicationDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Upload state
  const [file, setFile] = useState<File | null>(null);
  const [docType, setDocType] = useState<string>('other');
  const [notes, setNotes] = useState('');
  const [uploading, setUploading] = useState(false);

  // Preview modal
  const [previewDoc, setPreviewDoc] = useState<ApplicationDocument | null>(null);

  const loadDocuments = useCallback(async () => {
    if (!applicationId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getApplicationDocuments(applicationId);
      const docs = Array.isArray(res) ? res : (res as any).documents ?? [];
      setDocuments(docs);
    } catch (err: any) {
      setError(err.message || 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  }, [applicationId]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !applicationId) return;
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('type', docType);
      if (notes.trim()) fd.append('notes', notes.trim());
      await uploadDocument(applicationId, fd);
      setFile(null);
      setNotes('');
      await loadDocuments();
    } catch (err: any) {
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Form */}
      {showUpload && (
        <form
          onSubmit={handleUpload}
          className="bg-surface dark:bg-slate-800 rounded-xl border border-border dark:border-slate-700 p-6 space-y-4 shadow-sm"
        >
          <h3 className="text-lg font-semibold text-primary dark:text-slate-100">Tải lên tài liệu</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-secondary dark:text-slate-400 mb-1">Tệp</label>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="block w-full text-sm text-secondary dark:text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-slate-700 dark:file:text-slate-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary dark:text-slate-400 mb-1">Loại</label>
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value)}
                className="block w-full rounded-lg border border-border dark:border-slate-700 bg-surface dark:bg-slate-800 text-primary dark:text-slate-100 shadow-sm focus:border-accent focus:ring-accent text-sm p-2"
              >
                {DOC_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-secondary dark:text-slate-400 mb-1">Ghi chú</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ghi chú (tùy chọn)"
                className="block w-full rounded-lg border border-border dark:border-slate-700 bg-surface dark:bg-slate-800 text-primary dark:text-slate-100 shadow-sm focus:border-accent focus:ring-accent text-sm p-2"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={!file || uploading}
            className="px-6 py-2 rounded-lg bg-accent text-white font-semibold text-sm hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {uploading ? 'Đang tải…' : 'Tải lên'}
          </button>
        </form>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-lg px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {/* Document List */}
      <div className="bg-surface dark:bg-slate-800 rounded-xl border border-border dark:border-slate-700 shadow-sm">
        <div className="px-6 py-4 border-b border-border dark:border-slate-700">
          <h3 className="text-lg font-semibold text-primary dark:text-slate-100">Tài liệu ({documents.length})</h3>
        </div>
        {loading ? (
          <div className="p-6 text-center text-secondary dark:text-slate-400">Đang tải…</div>
        ) : documents.length === 0 ? (
          <div className="p-6 text-center text-secondary dark:text-slate-400">Chưa có tài liệu.</div>
        ) : (
          <div className="divide-y divide-border dark:divide-slate-700">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="px-6 py-4 flex items-center justify-between gap-4 hover:bg-background dark:hover:bg-slate-700/50 transition"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-primary dark:text-slate-100 truncate">{doc.original_name}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-secondary dark:text-slate-400 flex-wrap">
                    <span className="uppercase font-semibold">{doc.type.replace(/_/g, ' ')}</span>
                    <span>{formatSize(doc.file_size)}</span>
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${LABEL_COLORS[doc.label_status] || 'bg-gray-100 text-gray-700 dark:bg-slate-700 dark:text-slate-300'}`}
                    >
                      {doc.label_status.replace(/_/g, ' ')}
                    </span>
                    {doc.storage === 'drive' && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 text-xs font-medium">
                        Drive
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {(doc.mime_type === 'application/pdf' || doc.mime_type.startsWith('image/')) && (
                    <button
                      onClick={() => setPreviewDoc(doc)}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg border border-accent/30 text-accent hover:bg-accent/10 transition"
                    >
                      Xem trước
                    </button>
                  )}
                  <a
                    href={getDocumentDownloadUrl(doc.id)}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg border border-border dark:border-slate-700 text-secondary dark:text-slate-400 hover:bg-background dark:hover:bg-slate-700 transition"
                  >
                    Tải về
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {previewDoc && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setPreviewDoc(null)}
        >
          <div
            className="bg-surface dark:bg-slate-800 rounded-2xl shadow-2xl w-[90vw] h-[85vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-border dark:border-slate-700">
              <h3 className="font-semibold text-primary dark:text-slate-100 truncate">{previewDoc.original_name}</h3>
              <button
                onClick={() => setPreviewDoc(null)}
                className="text-secondary dark:text-slate-400 hover:text-primary dark:hover:text-slate-100 text-2xl leading-none"
              >
                &times;
              </button>
            </div>
            <div className="flex-1 bg-background dark:bg-slate-900">
              {previewDoc.mime_type === 'application/pdf' ? (
                <iframe
                  src={getDocumentPreviewUrl(previewDoc.id)}
                  className="w-full h-full border-0"
                  title={`Preview ${previewDoc.original_name}`}
                />
              ) : previewDoc.mime_type.startsWith('image/') ? (
                <div className="flex items-center justify-center h-full p-4">
                  <img
                    src={getDocumentPreviewUrl(previewDoc.id)}
                    alt={previewDoc.original_name}
                    className="max-w-full max-h-full object-contain rounded-lg shadow"
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-secondary dark:text-slate-400">
                  Preview not available for this file type.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentsPanel;
