import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import Navbar from '../components/Navbar';
import { useAuthStore } from '../store/authStore';
import {
  Plus,
  FileText,
  Trash2,
  Copy,
  Share2,
  Edit3,
  Users,
  Clock,
  Loader2,
  X,
  User as UserIcon,
} from 'lucide-react';

const Dashboard = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const { user } = useAuthStore();
  const navigate = useNavigate();

  // Modals state
  const [shareDocId, setShareDocId] = useState(null);
  const [shareEmail, setShareEmail] = useState('');
  const [shareError, setShareError] = useState(null);

  const [renameDocId, setRenameDocId] = useState(null);
  const [renameTitle, setRenameTitle] = useState('');
  const [renameError, setRenameError] = useState(null);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const { data } = await API.get('/documents');
      setDocuments(data);
    } catch (err) {
      console.error('Failed to load documents:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDocument = async () => {
    setActionLoading(true);
    try {
      const { data } = await API.post('/documents', { title: 'Untitled Document' });
      navigate(`/documents/${data._id}`);
    } catch (err) {
      console.error('Failed to create document:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteDocument = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this document?')) return;
    setActionLoading(true);
    try {
      await API.delete(`/documents/${id}`);
      setDocuments(documents.filter((doc) => doc._id !== id));
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDuplicateDocument = async (id, e) => {
    e.stopPropagation();
    setActionLoading(true);
    try {
      const { data } = await API.post(`/documents/${id}/duplicate`);
      setDocuments([data, ...documents]);
    } catch (err) {
      alert(err.response?.data?.message || 'Duplicate failed');
    } finally {
      setActionLoading(false);
    }
  };

  const openShareModal = (doc, e) => {
    e.stopPropagation();
    setShareDocId(doc._id);
    setShareEmail('');
    setShareError(null);
  };

  const handleShareSubmit = async (e) => {
    e.preventDefault();
    if (!shareEmail) return;
    try {
      await API.post(`/documents/${shareDocId}/share`, { email: shareEmail });
      setShareDocId(null);
      fetchDocuments();
    } catch (err) {
      setShareError(err.response?.data?.message || 'Sharing failed');
    }
  };

  const openRenameModal = (doc, e) => {
    e.stopPropagation();
    setRenameDocId(doc._id);
    setRenameTitle(doc.title);
    setRenameError(null);
  };

  const handleRenameSubmit = async (e) => {
    e.preventDefault();
    if (!renameTitle.trim()) return;
    try {
      await API.put(`/documents/${renameDocId}`, { title: renameTitle });
      setRenameDocId(null);
      fetchDocuments();
    } catch (err) {
      setRenameError(err.response?.data?.message || 'Rename failed');
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-gray-850 pb-16 flex flex-col font-sans select-none">
      <Navbar />

      {/* Google Docs Template Gallery Bar (Top Ribbon) */}
      <section className="bg-[#f1f3f4] border-b border-[#dadce0] py-6 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Start a new document</h2>
          
          <div className="flex">
            {/* Blank Document Card */}
            <div 
              onClick={handleCreateDocument}
              className="flex flex-col gap-2 cursor-pointer group"
            >
              <div className="h-36 w-28 bg-white border border-[#dadce0] hover:border-blue-600 hover:shadow-md rounded flex items-center justify-center transition-all">
                {actionLoading ? (
                  <Loader2 className="h-8 w-8 animate-spin text-blue-650" />
                ) : (
                  <div className="h-12 w-12 rounded-full bg-blue-50 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                    <Plus className="h-6 w-6 text-blue-600" />
                  </div>
                )}
              </div>
              <span className="text-xs font-medium text-gray-800 pl-1 group-hover:text-blue-600 transition-colors">
                Blank Document
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Documents Section */}
      <main className="max-w-6xl w-full mx-auto px-6 mt-8 flex-1">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-sm font-semibold text-gray-700">Recent documents</h2>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-400">
            <Loader2 className="h-7 w-7 animate-spin text-blue-650" />
            <span className="text-xs font-semibold">Loading documents...</span>
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-16 bg-white border border-[#dadce0] rounded-xl shadow-sm">
            <FileText className="h-10 w-10 mx-auto text-gray-300 mb-2" />
            <h3 className="text-sm font-bold text-gray-700">No documents yet</h3>
            <p className="text-gray-450 text-xs mt-0.5">Click the "Blank Document" block above to create one.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {documents.map((doc) => {
              const isOwner = doc.owner._id === user._id;
              return (
                <div
                  key={doc._id}
                  onClick={() => navigate(`/documents/${doc._id}`)}
                  className="bg-white border border-[#dadce0] hover:border-blue-600 hover:shadow-md rounded-lg overflow-hidden cursor-pointer transition-all flex flex-col group"
                >
                  {/* Doc Preview Placeholder */}
                  <div className="h-32 bg-[#f8f9fa] border-b border-[#dadce0] flex items-center justify-center text-blue-600 group-hover:bg-[#f1f3f4] transition-colors">
                    <FileText className="h-10 w-10 opacity-70" />
                  </div>

                  {/* Metadata block */}
                  <div className="p-3 flex flex-col flex-1">
                    <h3 className="text-xs font-bold text-gray-800 truncate mb-1" title={doc.title}>
                      {doc.title}
                    </h3>
                    
                    <div className="flex items-center gap-1.5 text-[10px] text-gray-450 mt-auto">
                      <Clock className="h-3 w-3" />
                      <span>{new Date(doc.updatedAt).toLocaleDateString()}</span>
                    </div>

                    {/* Action buttons */}
                    <div className="border-t border-[#dadce0] mt-2.5 pt-2 flex items-center justify-end gap-2 text-gray-400">
                      <button
                        onClick={(e) => openRenameModal(doc, e)}
                        title="Rename"
                        className="p-1 hover:bg-gray-150 hover:text-gray-700 rounded transition-colors cursor-pointer"
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={(e) => handleDuplicateDocument(doc._id, e)}
                        title="Duplicate"
                        className="p-1 hover:bg-gray-150 hover:text-gray-700 rounded transition-colors cursor-pointer"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                      {isOwner && (
                        <>
                          <button
                            onClick={(e) => openShareModal(doc, e)}
                            title="Share"
                            className="p-1 hover:bg-gray-150 hover:text-blue-600 rounded transition-colors cursor-pointer"
                          >
                            <Share2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={(e) => handleDeleteDocument(doc._id, e)}
                            title="Delete"
                            className="p-1 hover:bg-red-50 hover:text-red-650 rounded transition-colors cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* RENAME MODAL */}
      {renameDocId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-gray-900/50 backdrop-blur-sm">
          <div className="bg-white border border-[#dadce0] w-full max-w-sm p-6 rounded-xl shadow-2xl relative text-gray-800">
            <button
              onClick={() => setRenameDocId(null)}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            <h2 className="text-base font-bold text-gray-900 mb-4">Rename Document</h2>

            {renameError && <p className="mb-3.5 text-xs text-red-600">{renameError}</p>}

            <form onSubmit={handleRenameSubmit} className="space-y-4">
              <input
                type="text"
                className="w-full bg-[#f8f9fa] border border-[#dadce0] rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-blue-600"
                value={renameTitle}
                onChange={(e) => setRenameTitle(e.target.value)}
                required
              />
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-755 text-white font-semibold py-2 rounded-lg text-sm active:scale-95 transition-all cursor-pointer shadow-sm"
              >
                Save
              </button>
            </form>
          </div>
        </div>
      )}

      {/* SHARE MODAL */}
      {shareDocId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-gray-900/50 backdrop-blur-sm">
          <div className="bg-white border border-[#dadce0] w-full max-w-sm p-6 rounded-xl shadow-2xl relative text-gray-800">
            <button
              onClick={() => setShareDocId(null)}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            <h2 className="text-base font-bold text-gray-900 mb-1">Share Document</h2>
            <p className="text-[11px] text-gray-450 mb-4">
              Type the email address of the user you want to share this document with.
            </p>

            {shareError && <p className="mb-3.5 text-xs text-red-600">{shareError}</p>}

            <form onSubmit={handleShareSubmit} className="space-y-4">
              <input
                type="email"
                placeholder="colleague@domain.com"
                className="w-full bg-[#f8f9fa] border border-[#dadce0] rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-blue-600"
                value={shareEmail}
                onChange={(e) => setShareEmail(e.target.value)}
                required
              />
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-755 text-white font-semibold py-2 rounded-lg text-sm active:scale-95 transition-all cursor-pointer shadow-sm"
              >
                Share
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
