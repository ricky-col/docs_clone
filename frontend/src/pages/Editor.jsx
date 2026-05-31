import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../services/api';
import Navbar from '../components/Navbar';
import RichTextEditor from '../components/RichTextEditor';
import CollaboratorPanel from '../components/CollaboratorPanel';
import VersionHistory from '../components/VersionHistory';
import ActivityTimeline from '../components/ActivityTimeline';
import OfflineIndicator from '../components/OfflineIndicator';
import { useSocket } from '../hooks/useSocket';
import {
  ArrowLeft,
  Save,
  Users,
  History,
  Activity,
  FileEdit,
  Loader2,
  CheckCircle,
  Star,
  FilePlus,
  FolderOpen,
  Copy,
  UserPlus,
  Mail,
  Download,
  Trash2,
  Printer,
  Undo2,
  Redo2,
  Link2,
  Bold,
  Italic,
  Underline,
  Sparkles,
  BookOpen,
  ChevronRight,
  Info,
  Shield,
  Globe,
  FileText,
  Image,
  Table,
  Boxes,
  Volume2,
  PenTool,
  BarChart3,
  Sigma,
  Minus,
  Bookmark,
  MessageSquare,
  Heading,
  AlignLeft,
  ArrowUpDown,
  Columns,
  List,
  Binary,
  Compass,
  Eraser,
  FileCheck,
  Quote,
  ListOrdered,
  Book,
  CornerDownLeft,
  Layers,
  Layout,
} from 'lucide-react';

const Editor = () => {
  const { id: documentId } = useParams();
  const navigate = useNavigate();
  const [docDetails, setDocDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState(''); // 'collaborators' | 'versions' | 'activity' | ''
  
  // Real-time states
  const [activeCollaborators, setActiveCollaborators] = useState([]);
  const [activities, setActivities] = useState([]);

  const addActivity = (type, message) => {
    setActivities(prev => [{ type, message, timestamp: Date.now() }, ...prev]);
  };


  const [titleInput, setTitleInput] = useState('');
  const [activeMenu, setActiveMenu] = useState(null); // null | 'file' | 'edit' | 'view' | 'insert' | 'format' | 'tools'
  const [isStarred, setIsStarred] = useState(false);
  const titleInputRef = useRef(null);

  const handleRenameClick = () => {
    if (titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  };

  // Fetch document details via REST on mount
  useEffect(() => {
    const fetchDoc = async () => {
      try {
        const { data } = await API.get(`/documents/${documentId}`);
        setDocDetails(data);
        setTitleInput(data.title);
      } catch (err) {
        alert(err.response?.data?.message || 'Access denied or not found');
        navigate('/');
      } finally {
        setLoading(false);
      }
    };
    fetchDoc();
  }, [documentId]);

  // Hook up WebSocket
  const socketHandlers = {
    'user:joined': ({ collaborators }) => {
      setActiveCollaborators(collaborators);
      addActivity('join', 'A collaborator joined the document');
    },
    'user:left': ({ collaborators }) => {
      setActiveCollaborators(collaborators);
      addActivity('leave', 'A collaborator left the document');
    },
    'cursor:moved': ({ socketId, name, cursor, isTyping }) => {
      setActiveCollaborators((prev) =>
        prev.map((c) =>
          c.socketId === socketId ? { ...c, cursor, isTyping } : c
        )
      );
    },
    'version:created': () => {
      setSaveSuccess(true);
      addActivity('save', 'Version history snapshot saved');
      setTimeout(() => setSaveSuccess(false), 2000);
    },
  };

  const { socket, emit } = useSocket(documentId, socketHandlers);

  // Persist document title on blur or Enter press
  const handleTitleSave = async () => {
    if (!titleInput.trim() || titleInput === docDetails?.title) return;
    try {
      setDocDetails((prev) => ({ ...prev, title: titleInput }));
      await API.put(`/documents/${documentId}`, { title: titleInput });
    } catch (err) {
      console.error('Failed to save title:', err);
    }
  };

  // Helper actions for dropdown menus
  const handleNewDoc = async () => {
    try {
      const { data } = await API.post('/documents', { title: 'Untitled Document' });
      navigate(`/documents/${data._id}`);
      window.location.reload();
    } catch (err) {
      alert('Failed to create new document');
    }
  };

  const handleDuplicateDoc = async () => {
    try {
      const { data } = await API.post(`/documents/${documentId}/duplicate`);
      navigate(`/documents/${data._id}`);
      window.location.reload();
    } catch (err) {
      alert('Failed to duplicate document');
    }
  };

  const handleDeleteDoc = async () => {
    if (!window.confirm('Are you sure you want to move this document to trash?')) return;
    try {
      await API.delete(`/documents/${documentId}`);
      navigate('/');
    } catch (err) {
      alert('Failed to delete document');
    }
  };

  const handleWordCount = () => {
    if (window.__quill) {
      const text = window.__quill.getText() || '';
      const words = text.trim().split(/\s+/).filter(w => w.length > 0).length;
      const chars = text.length;
      alert(`Word Count: ${words} words\nCharacter Count: ${chars} characters`);
    } else {
      alert('Editor not loaded.');
    }
  };

  const handleInsertLink = () => {
    const url = prompt('Enter link URL:');
    if (url && window.__quill) {
      window.__quill.focus();
      const range = window.__quill.getSelection();
      if (range) {
        window.__quill.format('link', url);
      } else {
        alert('Please place your cursor or highlight text to insert a link.');
      }
    }
  };

  const triggerFormat = (type) => {
    if (window.__quill) {
      window.__quill.focus();
      const current = window.__quill.getFormat()[type];
      window.__quill.format(type, !current);
    }
  };

  const handleClearFormatting = () => {
    if (window.__quill) {
      window.__quill.focus();
      const range = window.__quill.getSelection();
      if (range) {
        window.__quill.removeFormat(range.index, range.length);
      } else {
        window.__quill.removeFormat(0, window.__quill.getLength());
      }
    }
  };


  // Manual save for Version History Snapshot
  const handleSaveSnapshot = () => {
    if (!window.__getYjsDocState) return;
    setSaving(true);
    const contentState = window.__getYjsDocState();
    emit('save:document', { documentId, content: contentState });
    setTimeout(() => {
      setSaving(false);
    }, 1000);
  };

  // Handler to inject content when version is restored
  const handleVersionRestored = (restoredContent) => {
    // Reload page to re-initialize editor with restored state
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] flex flex-col items-center justify-center gap-3 text-gray-500">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span>Loading workspace...</span>
      </div>
    );
  }

  const toggleMenu = (menu) => {
    setActiveMenu(activeMenu === menu ? null : menu);
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-gray-800 flex flex-col h-screen overflow-hidden" onClick={() => setActiveMenu(null)}>
      
      {/* Google Docs Ribbon Header */}
      <header className="bg-white border-b border-[#dadce0] px-2 sm:px-4 py-2 flex flex-col lg:flex-row lg:items-center justify-between relative z-50 gap-3 lg:gap-0">
        <div className="flex items-start lg:items-center gap-2 w-full lg:w-auto">
          {/* Docs Icon */}
          <div 
            onClick={() => navigate('/')}
            className="shrink-0 cursor-pointer flex items-center justify-center hover:opacity-80 transition-opacity"
            title="Back to Dashboard"
          >
            <div className="bg-stone-900 rounded p-1.5 flex items-center justify-center">
              <FileText className="h-5 w-5 text-[#FDFCF8]" />
            </div>
          </div>

          <div className="flex flex-col min-w-0 flex-1">
            {/* Title Input */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <input
                ref={titleInputRef}
                type="text"
                className="bg-transparent border-none text-[16px] sm:text-[18px] font-medium text-gray-900 focus:outline-none focus:bg-gray-100 focus:ring-1 focus:ring-blue-500 rounded px-2 py-0.5 w-[150px] sm:w-48 lg:w-64 truncate transition-all"
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
                onBlur={handleTitleSave}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.target.blur();
                  }
                }}
              />
              <button
                onClick={() => setIsStarred(!isStarred)}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors cursor-pointer text-gray-500 hover:text-yellow-500 shrink-0"
                title={isStarred ? "Unstar" : "Star"}
              >
                <Star className={`h-4 w-4 ${isStarred ? "fill-yellow-400 text-yellow-500" : "text-gray-400"}`} />
              </button>
              <div className="hidden sm:block text-[11px] text-gray-400 font-semibold px-2 py-0.5 bg-gray-100 rounded ml-1 shrink-0">
                Auto-saved
              </div>
            </div>

            {/* Menu Items (Interactive Dropdowns) */}
            <div className="flex items-center gap-1 text-xs text-gray-500 pl-2 font-medium relative flex-wrap w-full">
              {/* FILE MENU */}
              <div className="relative shrink-0">
                <span 
                  onClick={(e) => { e.stopPropagation(); toggleMenu('file'); }}
                  className={`hover:bg-gray-100 px-2 py-1 rounded cursor-pointer transition-colors ${activeMenu === 'file' ? 'bg-gray-100 text-gray-800' : ''}`}
                >
                  File
                </span>
                {activeMenu === 'file' && (
                  <div className="absolute left-0 mt-1.5 w-60 bg-white border border-[#dadce0] rounded-lg shadow-[0_4px_16px_rgba(0,0,0,0.1),0_1px_4px_rgba(0,0,0,0.05)] py-1.5 text-gray-700 z-50 text-left font-normal select-none">
                    <div onClick={handleNewDoc} className="flex items-center px-3 py-1.5 hover:bg-gray-100 cursor-pointer text-xs text-[#202124]">
                      <div className="w-5 h-5 flex items-center justify-center mr-2.5 text-gray-500">
                        <FilePlus className="h-4 w-4" />
                      </div>
                      <span className="flex-grow">New Document</span>
                    </div>
                    <div onClick={handleDuplicateDoc} className="flex items-center px-3 py-1.5 hover:bg-gray-100 cursor-pointer text-xs text-[#202124]">
                      <div className="w-5 h-5 flex items-center justify-center mr-2.5 text-gray-500">
                        <Copy className="h-4 w-4" />
                      </div>
                      <span className="flex-grow">Make a copy</span>
                    </div>
                    <div onClick={handleRenameClick} className="flex items-center px-3 py-1.5 hover:bg-gray-100 cursor-pointer text-xs text-[#202124]">
                      <div className="w-5 h-5 flex items-center justify-center mr-2.5 text-gray-500">
                        <FileEdit className="h-4 w-4" />
                      </div>
                      <span className="flex-grow">Rename</span>
                    </div>
                    <div onClick={handleDeleteDoc} className="flex items-center px-3 py-1.5 hover:bg-red-50 hover:text-red-600 cursor-pointer text-xs">
                      <div className="w-5 h-5 flex items-center justify-center mr-2.5 text-red-500">
                        <Trash2 className="h-4 w-4" />
                      </div>
                      <span className="flex-grow">Move to bin</span>
                    </div>
                    <div onClick={() => setActiveTab('versions')} className="flex items-center px-3 py-1.5 hover:bg-gray-100 cursor-pointer text-xs text-[#202124]">
                      <div className="w-5 h-5 flex items-center justify-center mr-2.5 text-gray-500">
                        <History className="h-4 w-4" />
                      </div>
                      <span className="flex-grow">Version history</span>
                    </div>
                    <hr className="border-[#dadce0] my-1" />
                    <div onClick={() => window.print()} className="flex items-center px-3 py-1.5 hover:bg-gray-100 cursor-pointer text-xs text-[#202124]">
                      <div className="w-5 h-5 flex items-center justify-center mr-2.5 text-gray-500">
                        <Printer className="h-4 w-4" />
                      </div>
                      <span className="flex-grow">Print</span>
                      <span className="text-[10px] text-gray-400 ml-auto">⌘P</span>
                    </div>
                  </div>
                )}
              </div>

              {/* EDIT MENU */}
              <div className="relative shrink-0">
                <span 
                  onClick={(e) => { e.stopPropagation(); toggleMenu('edit'); }}
                  className={`hover:bg-gray-100 px-2 py-1 rounded cursor-pointer transition-colors ${activeMenu === 'edit' ? 'bg-gray-100 text-gray-800' : ''}`}
                >
                  Edit
                </span>
                {activeMenu === 'edit' && (
                  <div className="absolute left-0 mt-1.5 w-48 bg-white border border-[#dadce0] rounded-lg shadow-[0_4px_16px_rgba(0,0,0,0.1),0_1px_4px_rgba(0,0,0,0.05)] py-1.5 text-gray-700 z-50 text-left font-normal select-none">
                    <div onClick={() => window.__quill?.history.undo()} className="flex items-center px-3 py-1.5 hover:bg-gray-100 cursor-pointer text-xs text-[#202124]">
                      <div className="w-5 h-5 flex items-center justify-center mr-2.5 text-gray-500">
                        <Undo2 className="h-4 w-4" />
                      </div>
                      <span className="flex-grow">Undo</span>
                      <span className="text-[10px] text-gray-400 ml-auto">⌘Z</span>
                    </div>
                    <div onClick={() => window.__quill?.history.redo()} className="flex items-center px-3 py-1.5 hover:bg-gray-100 cursor-pointer text-xs text-[#202124]">
                      <div className="w-5 h-5 flex items-center justify-center mr-2.5 text-gray-500">
                        <Redo2 className="h-4 w-4" />
                      </div>
                      <span className="flex-grow">Redo</span>
                      <span className="text-[10px] text-gray-400 ml-auto">⌘Y</span>
                    </div>
                  </div>
                )}
              </div>

              {/* VIEW MENU */}
              <div className="relative shrink-0">
                <span 
                  onClick={(e) => { e.stopPropagation(); toggleMenu('view'); }}
                  className={`hover:bg-gray-100 px-2 py-1 rounded cursor-pointer transition-colors ${activeMenu === 'view' ? 'bg-gray-100 text-gray-800' : ''}`}
                >
                  View
                </span>
                {activeMenu === 'view' && (
                  <div className="absolute left-0 mt-1.5 w-52 bg-white border border-[#dadce0] rounded-lg shadow-[0_4px_16px_rgba(0,0,0,0.1),0_1px_4px_rgba(0,0,0,0.05)] py-1.5 text-gray-700 z-50 text-left font-normal select-none">
                    <div onClick={() => setActiveTab('collaborators')} className="flex items-center px-3 py-1.5 hover:bg-gray-100 cursor-pointer text-xs text-[#202124]">
                      <div className="w-5 h-5 flex items-center justify-center mr-2.5 text-gray-500">
                        <Users className="h-4 w-4" />
                      </div>
                      <span className="flex-grow">Show Collaborators</span>
                    </div>
                    <div onClick={() => setActiveTab('versions')} className="flex items-center px-3 py-1.5 hover:bg-gray-100 cursor-pointer text-xs text-[#202124]">
                      <div className="w-5 h-5 flex items-center justify-center mr-2.5 text-gray-500">
                        <History className="h-4 w-4" />
                      </div>
                      <span className="flex-grow">Show Version History</span>
                    </div>
                  </div>
                )}
              </div>

              {/* INSERT MENU */}
              <div className="relative shrink-0">
                <span 
                  onClick={(e) => { e.stopPropagation(); toggleMenu('insert'); }}
                  className={`hover:bg-gray-100 px-2 py-1 rounded cursor-pointer transition-colors ${activeMenu === 'insert' ? 'bg-gray-100 text-gray-800' : ''}`}
                >
                  Insert
                </span>
                {activeMenu === 'insert' && (
                  <div className="absolute left-0 mt-1.5 w-48 bg-white border border-[#dadce0] rounded-lg shadow-[0_4px_16px_rgba(0,0,0,0.1),0_1px_4px_rgba(0,0,0,0.05)] py-1.5 text-gray-700 z-50 text-left font-normal select-none">
                    <div onClick={handleInsertLink} className="flex items-center px-3 py-1.5 hover:bg-gray-100 cursor-pointer text-xs text-[#202124]">
                      <div className="w-5 h-5 flex items-center justify-center mr-2.5 text-gray-500">
                        <Link2 className="h-4 w-4" />
                      </div>
                      <span className="flex-grow">Link</span>
                      <span className="text-[10px] text-gray-400 ml-auto">⌘K</span>
                    </div>
                  </div>
                )}
              </div>

              {/* FORMAT MENU */}
              <div className="relative shrink-0">
                <span 
                  onClick={(e) => { e.stopPropagation(); toggleMenu('format'); }}
                  className={`hover:bg-gray-100 px-2 py-1 rounded cursor-pointer transition-colors ${activeMenu === 'format' ? 'bg-gray-100 text-gray-800' : ''}`}
                >
                  Format
                </span>
                {activeMenu === 'format' && (
                  <div className="absolute left-0 mt-1.5 w-48 bg-white border border-[#dadce0] rounded-lg shadow-[0_4px_16px_rgba(0,0,0,0.1),0_1px_4px_rgba(0,0,0,0.05)] py-1.5 text-gray-700 z-50 text-left font-normal select-none">
                    <div onClick={() => triggerFormat('bold')} className="flex items-center px-3 py-1.5 hover:bg-gray-100 cursor-pointer text-xs text-[#202124]">
                      <div className="w-5 h-5 flex items-center justify-center mr-2.5 text-gray-500">
                        <Bold className="h-4 w-4" />
                      </div>
                      <span className="flex-grow font-bold">Bold</span>
                      <span className="text-[10px] text-gray-400 ml-auto">⌘B</span>
                    </div>
                    <div onClick={() => triggerFormat('italic')} className="flex items-center px-3 py-1.5 hover:bg-gray-100 cursor-pointer text-xs text-[#202124]">
                      <div className="w-5 h-5 flex items-center justify-center mr-2.5 text-gray-500">
                        <Italic className="h-4 w-4" />
                      </div>
                      <span className="flex-grow italic">Italic</span>
                      <span className="text-[10px] text-gray-400 ml-auto">⌘I</span>
                    </div>
                    <div onClick={() => triggerFormat('underline')} className="flex items-center px-3 py-1.5 hover:bg-gray-100 cursor-pointer text-xs text-[#202124]">
                      <div className="w-5 h-5 flex items-center justify-center mr-2.5 text-gray-500">
                        <Underline className="h-4 w-4" />
                      </div>
                      <span className="flex-grow underline">Underline</span>
                      <span className="text-[10px] text-gray-400 ml-auto">⌘U</span>
                    </div>
                    <hr className="border-[#dadce0] my-1" />
                    <div onClick={handleClearFormatting} className="flex items-center px-3 py-1.5 hover:bg-gray-100 cursor-pointer text-xs text-[#202124]">
                      <div className="w-5 h-5 flex items-center justify-center mr-2.5 text-gray-500">
                        <Eraser className="h-4 w-4" />
                      </div>
                      <span className="flex-grow">Clear formatting</span>
                      <span className="text-[10px] text-gray-400 ml-auto">⌘\</span>
                    </div>
                  </div>
                )}
              </div>

              {/* TOOLS MENU */}
              <div className="relative shrink-0">
                <span 
                  onClick={(e) => { e.stopPropagation(); toggleMenu('tools'); }}
                  className={`hover:bg-gray-100 px-2 py-1 rounded cursor-pointer transition-colors ${activeMenu === 'tools' ? 'bg-gray-100 text-gray-800' : ''}`}
                >
                  Tools
                </span>
                {activeMenu === 'tools' && (
                  <div className="absolute left-0 mt-1.5 w-52 bg-white border border-[#dadce0] rounded-lg shadow-[0_4px_16px_rgba(0,0,0,0.1),0_1px_4px_rgba(0,0,0,0.05)] py-1.5 text-gray-700 z-50 text-left font-normal select-none">
                    <div onClick={handleWordCount} className="flex items-center px-3 py-1.5 hover:bg-gray-100 cursor-pointer text-xs text-[#202124]">
                      <div className="w-5 h-5 flex items-center justify-center mr-2.5 text-gray-500">
                        <BookOpen className="h-4 w-4" />
                      </div>
                      <span className="flex-grow">Word count</span>
                      <span className="text-[10px] text-gray-400 ml-auto">⌘+Shift+C</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>

        {/* Action Controls & Active Users */}
        <div className="flex items-center justify-between lg:justify-end gap-2 sm:gap-4 w-full lg:w-auto px-2 lg:px-0 pb-1 lg:pb-0 overflow-x-auto scrollbar-hide">
          
          {/* Active Collaborator Avatar Stack */}
          <div className="flex items-center -space-x-2 mr-0 sm:mr-2 shrink-0">
            {activeCollaborators.slice(0, 3).map((collab, index) => (
              <div 
                key={collab.email}
                title={`${collab.name} (${collab.email})`}
                className={`h-6 w-6 sm:h-7 sm:w-7 rounded-full border-2 border-white flex items-center justify-center text-white font-bold text-[10px] sm:text-xs select-none shadow-sm ${
                  index % 3 === 0 ? 'bg-blue-500' : index % 3 === 1 ? 'bg-emerald-500' : 'bg-purple-500'
                }`}
              >
                {collab?.name?.charAt(0)?.toUpperCase() || '?'}
              </div>
            ))}
            {activeCollaborators.length > 3 && (
              <div className="h-6 w-6 sm:h-7 sm:w-7 rounded-full border-2 border-white bg-gray-200 text-gray-600 flex items-center justify-center text-[10px] sm:text-xs font-bold shadow-sm">
                +{activeCollaborators.length - 3}
              </div>
            )}
          </div>

          {/* Save Version State */}
          <button
            onClick={handleSaveSnapshot}
            disabled={saving}
            className="flex items-center gap-1.5 border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold py-1.5 px-2 sm:px-3 rounded-full text-xs transition-all cursor-pointer disabled:opacity-50 shrink-0"
            title="Save historical version checkpoint"
          >
            {saving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
            ) : saveSuccess ? (
              <CheckCircle className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
            ) : (
              <Save className="h-3.5 w-3.5 shrink-0" />
            )}
            <span className="hidden sm:inline">{saveSuccess ? 'Saved' : 'Save'}</span>
          </button>

          {/* Share Button (Google Style) */}
          <button
            onClick={() => setActiveTab(activeTab === 'collaborators' ? '' : 'collaborators')}
            className="flex items-center gap-1 sm:gap-2 bg-[#c2e7ff] hover:bg-[#b3dcfa] text-[#001d35] font-semibold py-1.5 sm:py-2 px-3 sm:px-5 rounded-full text-xs sm:text-sm transition-all cursor-pointer shadow-sm shrink-0"
          >
            <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
            <span className="hidden sm:inline">Share</span>
          </button>

          {/* Side Drawer Toggle controls */}
          <div className="flex items-center bg-gray-150 border border-gray-300 rounded-full p-0.5 gap-0.5 shrink-0">
            <button
              onClick={() => setActiveTab(activeTab === 'collaborators' ? '' : 'collaborators')}
              className={`p-1 sm:p-1.5 rounded-full flex items-center justify-center text-xs cursor-pointer transition-all ${
                activeTab === 'collaborators'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
              title="Collaborators presence list"
            >
              <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </button>
            <button
              onClick={() => setActiveTab(activeTab === 'versions' ? '' : 'versions')}
              className={`p-1 sm:p-1.5 rounded-full flex items-center justify-center text-xs cursor-pointer transition-all ${
                activeTab === 'versions'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
              title="Version history list"
            >
              <History className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </button>
            <button
              onClick={() => setActiveTab(activeTab === 'activity' ? '' : 'activity')}
              className={`p-1 sm:p-1.5 rounded-full flex items-center justify-center text-xs cursor-pointer transition-all ${
                activeTab === 'activity'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
              title="Activity timeline"
            >
              <Activity className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Editor & Panel Main Grid */}
      <div className="flex-1 flex overflow-hidden">
        {/* Editor Body Canvas */}
        <RichTextEditor
          documentId={documentId}
          socket={socket}
          emit={emit}
        />

        {/* Panel Sideboard drawers */}
        {activeTab === 'collaborators' && (
          <CollaboratorPanel 
            collaborators={activeCollaborators} 
            documentId={documentId}
            docDetails={docDetails}
            setDocDetails={setDocDetails}
          />
        )}

        {activeTab === 'versions' && (
          <VersionHistory
            documentId={documentId}
            onVersionRestored={handleVersionRestored}
          />
        )}

        {activeTab === 'activity' && (
          <ActivityTimeline activities={activities} />
        )}
      </div>
      
      <OfflineIndicator />
    </div>
  );
};

export default Editor;
// 
