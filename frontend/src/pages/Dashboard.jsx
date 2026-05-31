import React, { useState, useEffect, useRef } from 'react';
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
  Search,
  MoreVertical,
  ChevronRight,
  FileBox
} from 'lucide-react';

const Dashboard = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  
  // UI Features State
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'owned', 'shared'
  const [openDropdownId, setOpenDropdownId] = useState(null);

  const { user } = useAuthStore();
  const navigate = useNavigate();

  // Modals state
  const [shareDocId, setShareDocId] = useState(null);
  const [shareEmail, setShareEmail] = useState('');
  const [shareError, setShareError] = useState(null);

  const [renameDocId, setRenameDocId] = useState(null);
  const [renameTitle, setRenameTitle] = useState('');
  const [renameError, setRenameError] = useState(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setOpenDropdownId(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

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
    setOpenDropdownId(null);
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
    setOpenDropdownId(null);
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
    setOpenDropdownId(null);
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
    setOpenDropdownId(null);
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

  // Helper for greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  // Filter documents
  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase());
    const isOwner = doc.owner._id === user._id;
    
    let matchesTab = true;
    if (activeTab === 'owned') matchesTab = isOwner;
    if (activeTab === 'shared') matchesTab = !isOwner;
    
    return matchesSearch && matchesTab;
  });

  return (
    <div className="min-h-screen bg-[#FDFCF8] text-stone-900 pb-16 flex flex-col font-sans">
      <Navbar />

      {/* Dynamic Header Section */}
      <section className="border-b border-stone-200 bg-white">
        <div className="max-w-6xl mx-auto px-6 py-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
          
          <div className="flex flex-col gap-2">
            <h1 className="text-4xl font-bold tracking-tight text-stone-900">
              {getGreeting()}, <span className="text-stone-500">{user?.name?.split(' ')[0] || 'Friend'}</span>.
            </h1>
            <p className="text-stone-500 text-lg font-sans">
              You have {documents.length} document{documents.length !== 1 ? 's' : ''} in your workspace.
            </p>
          </div>

          <div className="flex items-center gap-4">
            {/* Search Bar */}
            <div className="relative w-full md:w-72 font-sans group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-stone-400 group-focus-within:text-stone-900 transition-colors" />
              <input
                type="text"
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-stone-100 border border-transparent focus:border-stone-900 focus:bg-white rounded-full py-3 pl-10 pr-4 text-sm focus:outline-none transition-all placeholder:text-stone-400"
              />
            </div>
            
            {/* Create Button */}
            <button
              onClick={handleCreateDocument}
              disabled={actionLoading}
              className="flex items-center gap-2 bg-stone-900 hover:bg-stone-800 text-[#FDFCF8] font-semibold py-3 px-6 rounded-full text-sm transition-all shadow-sm active:scale-95 disabled:opacity-50 shrink-0 font-sans"
            >
              {actionLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5" />}
              <span>New Document</span>
            </button>
          </div>

        </div>
      </section>

      {/* Main Workspace */}
      <main className="max-w-6xl w-full mx-auto px-6 mt-10 flex-1 font-sans">
        
        {/* Tabs */}
        <div className="flex items-center gap-6 border-b border-stone-200 mb-8">
          {['all', 'owned', 'shared'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 text-sm font-semibold capitalize transition-colors relative ${
                activeTab === tab ? 'text-stone-900' : 'text-stone-400 hover:text-stone-600'
              }`}
            >
              {tab === 'all' ? 'All Documents' : tab === 'owned' ? 'Owned by me' : 'Shared with me'}
              {activeTab === tab && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-stone-900 rounded-t-full" />
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4 text-stone-400">
            <Loader2 className="h-8 w-8 animate-spin text-stone-900" />
            <span className="text-sm font-semibold tracking-wide">Loading workspace...</span>
          </div>
        ) : filteredDocuments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 bg-stone-50 border border-stone-200 rounded-2xl border-dashed">
            <div className="bg-white p-4 rounded-full shadow-sm mb-4">
              <FileBox className="h-8 w-8 text-stone-300" />
            </div>
            <h3 className="text-lg font-bold text-stone-900">No documents found</h3>
            <p className="text-stone-500 text-sm mt-1 max-w-sm text-center">
              {searchQuery 
                ? "We couldn't find anything matching your search." 
                : "Your workspace is empty. Create a new document to get started."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredDocuments.map((doc) => {
              const isOwner = doc.owner._id === user._id;
              
              return (
                <div
                  key={doc._id}
                  onClick={() => navigate(`/documents/${doc._id}`)}
                  className="group relative bg-white border border-stone-200 hover:border-stone-900 hover:shadow-xl rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 flex flex-col hover:-translate-y-1"
                >
                  {/* Card Preview Background */}
                  <div className="h-36 bg-stone-50 border-b border-stone-100 flex items-center justify-center group-hover:bg-stone-100 transition-colors relative">
                    <FileText className="h-12 w-12 text-stone-200 group-hover:text-stone-300 transition-colors" />
                    
                    {/* Floating Avatar Badge */}
                    <div 
                      className="absolute bottom-3 left-4 flex items-center gap-1.5 bg-white/80 backdrop-blur-md px-2 py-1 rounded-full shadow-sm border border-stone-200"
                      title={`Owner: ${doc.owner.name}`}
                    >
                      <div className="h-4 w-4 rounded-full bg-stone-900 flex items-center justify-center text-white font-bold text-[8px]">
                        {doc.owner?.name?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      <span className="text-[10px] font-semibold text-stone-600 truncate max-w-[80px]">
                        {isOwner ? 'Me' : doc.owner?.name?.split(' ')[0]}
                      </span>
                    </div>

                    {/* Collaborator Count Badge */}
                    {doc.collaborators.length > 0 && (
                      <div 
                        className="absolute bottom-3 right-4 flex items-center gap-1 bg-white/80 backdrop-blur-md px-2 py-1 rounded-full shadow-sm border border-stone-200 text-[10px] font-semibold text-stone-600"
                        title={`${doc.collaborators.length} collaborators`}
                      >
                        <Users className="h-3 w-3" />
                        {doc.collaborators.length}
                      </div>
                    )}
                  </div>

                  {/* Card Content */}
                  <div className="p-4 flex flex-col flex-1">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="text-base font-bold text-stone-900 truncate flex-1" title={doc.title}>
                        {doc.title}
                      </h3>
                      
                      {/* Dropdown Action Menu */}
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenDropdownId(openDropdownId === doc._id ? null : doc._id);
                          }}
                          className="p-1 hover:bg-stone-100 rounded-full text-stone-400 hover:text-stone-900 transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>
                        
                        {openDropdownId === doc._id && (
                          <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-stone-200 rounded-xl shadow-xl py-1.5 z-50 text-stone-700 animate-in fade-in slide-in-from-top-2 text-sm font-medium">
                            <div onClick={(e) => openRenameModal(doc, e)} className="flex items-center px-3 py-2 hover:bg-stone-50 cursor-pointer">
                              <Edit3 className="h-4 w-4 mr-2.5 text-stone-400" /> Rename
                            </div>
                            <div onClick={(e) => handleDuplicateDocument(doc._id, e)} className="flex items-center px-3 py-2 hover:bg-stone-50 cursor-pointer">
                              <Copy className="h-4 w-4 mr-2.5 text-stone-400" /> Duplicate
                            </div>
                            {isOwner && (
                              <>
                                <div onClick={(e) => openShareModal(doc, e)} className="flex items-center px-3 py-2 hover:bg-stone-50 cursor-pointer">
                                  <Share2 className="h-4 w-4 mr-2.5 text-stone-400" /> Share
                                </div>
                                <hr className="border-stone-100 my-1" />
                                <div onClick={(e) => handleDeleteDocument(doc._id, e)} className="flex items-center px-3 py-2 hover:bg-red-50 text-red-600 cursor-pointer">
                                  <Trash2 className="h-4 w-4 mr-2.5 text-red-500" /> Delete
                                </div>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1.5 text-xs text-stone-500 mt-auto pt-2">
                      <Clock className="h-3.5 w-3.5" />
                      <span>Updated {new Date(doc.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-stone-900/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-sm p-6 rounded-2xl shadow-2xl relative font-sans">
            <button
              onClick={() => setRenameDocId(null)}
              className="absolute right-4 top-4 text-stone-400 hover:text-stone-900 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
            <h2 className="text-xl font-bold text-stone-900 mb-4">Rename Document</h2>
            {renameError && <p className="mb-3 text-sm text-red-600">{renameError}</p>}
            <form onSubmit={handleRenameSubmit} className="space-y-4">
              <input
                type="text"
                className="w-full bg-stone-50 border border-stone-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-1 focus:ring-stone-900 focus:bg-white transition-all"
                value={renameTitle}
                onChange={(e) => setRenameTitle(e.target.value)}
                autoFocus
                required
              />
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setRenameDocId(null)} className="px-4 py-2 text-sm font-semibold text-stone-500 hover:text-stone-900 transition-colors">
                  Cancel
                </button>
                <button type="submit" className="bg-stone-900 hover:bg-stone-800 text-white font-semibold py-2 px-6 rounded-xl text-sm transition-all active:scale-95 shadow-sm">
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SHARE MODAL */}
      {shareDocId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-stone-900/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-sm p-6 rounded-2xl shadow-2xl relative font-sans">
            <button
              onClick={() => setShareDocId(null)}
              className="absolute right-4 top-4 text-stone-400 hover:text-stone-900 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
            <h2 className="text-xl font-bold text-stone-900 mb-1">Share Document</h2>
            <p className="text-sm text-stone-500 mb-5">
              Enter the email address of the person you'd like to collaborate with.
            </p>
            {shareError && <p className="mb-3 text-sm text-red-600">{shareError}</p>}
            <form onSubmit={handleShareSubmit} className="space-y-4">
              <input
                type="email"
                placeholder="colleague@domain.com"
                className="w-full bg-stone-50 border border-stone-200 rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-1 focus:ring-stone-900 focus:bg-white transition-all"
                value={shareEmail}
                onChange={(e) => setShareEmail(e.target.value)}
                autoFocus
                required
              />
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShareDocId(null)} className="px-4 py-2 text-sm font-semibold text-stone-500 hover:text-stone-900 transition-colors">
                  Cancel
                </button>
                <button type="submit" className="bg-stone-900 hover:bg-stone-800 text-white font-semibold py-2 px-6 rounded-xl text-sm transition-all active:scale-95 shadow-sm flex items-center gap-2">
                  <Share2 className="h-4 w-4" /> Share
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
