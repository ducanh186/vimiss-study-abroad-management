import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
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
  pending_review: 'bg-yellow-100 text-yellow-800',
  valid: 'bg-green-100 text-green-800',
  need_more: 'bg-orange-100 text-orange-800',
  translating: 'bg-blue-100 text-blue-800',
  submitted: 'bg-indigo-100 text-indigo-800',
  rejected: 'bg-red-100 text-red-800',
};

const DocumentsTestPage: React.FC = () => {
  const { applicationId } = useParams<{ applicationId: string }>();
  const appId = Number(applicationId);

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
    if (!appId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getApplicationDocuments(appId);
      // API returns { documents: [...] } or array directly
      const docs = Array.isArray(res) ? res : (res as any).documents ?? [];
      setDocuments(docs);
    } catch (err: any) {
      setError(err.message || 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  }, [appId]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !appId) return;
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('type', docType);
      if (notes.trim()) fd.append('notes', notes.trim());
      await uploadDocument(appId, fd);
      setFile(null);
      setNotes('');
      await loadDocuments();
    } catch (err: any) {
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (!appId || isNaN(appId)) {
    return (
      <div className="p-8 text-center text-red-600">
        Invalid application ID. Use <code>/app/documents-test/:applicationId</code>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">
        Documents Test — Application #{appId}
      </h1>

      {/* Upload Form */}
      <form
        onSubmit={handleUpload}
        className="bg-white rounded-xl border border-gray-200 p-6 space-y-4 shadow-sm"
      >
        <h2 className="text-lg font-semibold">Upload Document</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">File</label>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
              className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm p-2 border"
            >
              {DOC_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes"
              className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm p-2 border"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={!file || uploading}
          className="px-6 py-2 rounded-lg bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {uploading ? 'Uploading…' : 'Upload'}
        </button>
      </form>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {/* Document List */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold">Documents ({documents.length})</h2>
        </div>
        {loading ? (
          <div className="p-6 text-center text-gray-500">Loading…</div>
        ) : documents.length === 0 ? (
          <div className="p-6 text-center text-gray-400">No documents yet.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="px-6 py-4 flex items-center justify-between gap-4 hover:bg-gray-50 transition"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{doc.original_name}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                    <span className="uppercase font-semibold text-gray-600">{doc.type.replace(/_/g, ' ')}</span>
                    <span>{formatSize(doc.file_size)}</span>
                    <span>{doc.mime_type}</span>
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${LABEL_COLORS[doc.label_status] || 'bg-gray-100 text-gray-700'}`}
                    >
                      {doc.label_status.replace(/_/g, ' ')}
                    </span>
                    {doc.storage === 'drive' && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium">
                        Drive
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {(doc.mime_type === 'application/pdf' || doc.mime_type.startsWith('image/')) && (
                    <button
                      onClick={() => setPreviewDoc(doc)}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg border border-blue-200 text-blue-700 hover:bg-blue-50 transition"
                    >
                      Preview
                    </button>
                  )}
                  <a
                    href={getDocumentDownloadUrl(doc.id)}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition"
                  >
                    Download
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
            className="bg-white rounded-2xl shadow-2xl w-[90vw] h-[85vh] flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900 truncate">{previewDoc.original_name}</h3>
              <button
                onClick={() => setPreviewDoc(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              >
                &times;
              </button>
            </div>
            <div className="flex-1 bg-gray-100">
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
                <div className="flex items-center justify-center h-full text-gray-500">
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

export default DocumentsTestPage;
