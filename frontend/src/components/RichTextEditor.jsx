import React, { useEffect, useRef, useState } from 'react';
import Quill from 'quill';
import * as Y from 'yjs';
import { QuillBinding } from 'y-quill';
import { IndexeddbPersistence } from 'y-indexeddb';
import { createPortal } from 'react-dom';
import { 
  Bold, Italic, Underline, Strikethrough, 
  List, ListOrdered, Link2, Eraser, 
  Heading1, Heading2, Heading3, Type 
} from 'lucide-react';

const getCursorColor = (userId) => {
  const colors = ['#f56565', '#ed8936', '#ecc94b', '#48bb78', '#38b2ac', '#4299e1', '#667eea', '#9f7aea', '#ed64a6'];
  if (!userId) return colors[0];
  const hash = String(userId).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
};

const CustomToolbar = ({ quill, activeFormats }) => {
  if (!quill) return null;

  const toggleFormat = (format, value = true) => {
    const current = quill.getFormat()[format];
    quill.format(format, current === value ? false : value);
    quill.focus();
  };

  const handleLink = () => {
    const value = prompt('Enter link URL:');
    if (value) {
      quill.format('link', value);
    } else {
      quill.format('link', false);
    }
    quill.focus();
  };

  const handleClearFormat = () => {
    const range = quill.getSelection();
    if (range) {
      quill.removeFormat(range.index, range.length);
    } else {
      quill.removeFormat(0, quill.getLength());
    }
    quill.focus();
  };

  const ToolbarButton = ({ icon: Icon, format, value = true, onClick }) => {
    // If the format is active, apply the active styling
    // Handle array formats (like header levels) properly
    let isActive = false;
    if (value === true) {
      isActive = !!activeFormats[format];
    } else if (value === false) {
      isActive = !activeFormats[format] || activeFormats[format] === false;
    } else {
      isActive = activeFormats[format] === value;
    }

    return (
      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault(); // Prevent losing focus from the editor
          onClick ? onClick() : toggleFormat(format, value);
        }}
        className={`w-8 h-8 rounded flex items-center justify-center transition-colors cursor-pointer \${
          isActive ? 'bg-blue-100 text-blue-900' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
        }`}
      >
        <Icon className="w-[18px] h-[18px]" />
      </button>
    );
  };

  return (
    <div className="bg-white border-b border-gray-200 flex items-center justify-center gap-1 py-2 px-4 shadow-sm z-20 shrink-0 select-none">
      <div className="flex items-center gap-1 border-r border-gray-200 pr-2 mr-1">
        <ToolbarButton icon={Type} format="header" value={false} />
        <ToolbarButton icon={Heading1} format="header" value={1} />
        <ToolbarButton icon={Heading2} format="header" value={2} />
        <ToolbarButton icon={Heading3} format="header" value={3} />
      </div>
      <div className="flex items-center gap-1 border-r border-gray-200 pr-2 mr-1">
        <ToolbarButton icon={Bold} format="bold" />
        <ToolbarButton icon={Italic} format="italic" />
        <ToolbarButton icon={Underline} format="underline" />
        <ToolbarButton icon={Strikethrough} format="strike" />
      </div>
      <div className="flex items-center gap-1 border-r border-gray-200 pr-2 mr-1">
        <ToolbarButton icon={ListOrdered} format="list" value="ordered" />
        <ToolbarButton icon={List} format="list" value="bullet" />
      </div>
      <div className="flex items-center gap-1">
        <ToolbarButton icon={Link2} format="link" onClick={handleLink} />
        <ToolbarButton icon={Eraser} format="clean" onClick={handleClearFormat} />
      </div>
    </div>
  );
};

const RichTextEditor = ({ documentId, socket, emit }) => {
  const editorContainerRef = useRef(null);
  const quillRef = useRef(null);
  const ydocRef = useRef(null);
  const bindingRef = useRef(null);
  const providerRef = useRef(null);
  const [editorLoaded, setEditorLoaded] = useState(false);
  const [cursorContainer, setCursorContainer] = useState(null);
  const [activeFormats, setActiveFormats] = useState({});

  // cursors: { [socketId]: { range, name, color } }
  const [remoteCursors, setRemoteCursors] = useState({});

  useEffect(() => {
    const wrapper = editorContainerRef.current;
    if (!wrapper) return;

    wrapper.innerHTML = '<div id="editor-elem"></div>';
    const editor = wrapper.firstChild;

    // 1. Initialize Quill Editor
    // Disable Quill's built-in toolbar, we will provide our own React toolbar
    const quill = new Quill(editor, {
      modules: {
        toolbar: false,
      },
      placeholder: 'Start writing your document here...',
    });
    quillRef.current = quill;
    window.__quill = quill;

    // 2. Add cursor container for React Portal
    const cContainer = quill.addContainer('ql-remote-cursors');
    cContainer.className = 'absolute inset-0 pointer-events-none z-10';
    setCursorContainer(cContainer);

    // 3. Initialize Y.js document
    const ydoc = new Y.Doc();
    ydocRef.current = ydoc;
    const ytext = ydoc.getText('quill-content');

    // 4. Initialize IndexedDB Persistence for offline support
    const provider = new IndexeddbPersistence(documentId, ydoc);
    providerRef.current = provider;

    provider.on('synced', () => {
      console.log('IndexedDB loaded local state');
    });

    // 5. Bind Y.js state with Quill
    const binding = new QuillBinding(ytext, quill);
    bindingRef.current = binding;

    // Format tracking for Custom Toolbar
    const handleEditorChange = () => {
      setActiveFormats(quill.getFormat() || {});
    };
    quill.on('editor-change', handleEditorChange);

    setEditorLoaded(true);

    return () => {
      quill.off('editor-change', handleEditorChange);
      binding.destroy();
      provider.destroy();
      ydoc.destroy();
      setEditorLoaded(false);
      delete window.__quill;
      wrapper.innerHTML = '';
    };
  }, [documentId]);

  // Handle outgoing updates from Yjs doc to socket.io
  useEffect(() => {
    if (!editorLoaded || !ydocRef.current || !socket) return;

    const handleYjsUpdate = (update, origin) => {
      // Don't echo back updates received from socket or indexeddb
      if (origin !== socket && origin !== providerRef.current) {
        // Broadcast the small live delta to other users
        const base64Update = btoa(String.fromCharCode(...update));
        emit('document:update', { documentId, update: base64Update });
        
        // Emit the FULL document state for database auto-saving
        const fullState = Y.encodeStateAsUpdate(ydocRef.current);
        const fullStateBase64 = btoa(String.fromCharCode(...fullState));
        emit('document:autosave', { documentId, content: fullStateBase64 });
      }
    };

    ydocRef.current.on('update', handleYjsUpdate);

    return () => {
      if (ydocRef.current) {
        ydocRef.current.off('update', handleYjsUpdate);
      }
    };
  }, [editorLoaded, socket, documentId]);

  // Handle incoming updates from socket.io
  useEffect(() => {
    if (!socket) return;

    const handleDocUpdated = ({ update }) => {
      try {
        if (ydocRef.current) {
          const binaryUpdate = Uint8Array.from(atob(update), (c) => c.charCodeAt(0));
          Y.applyUpdate(ydocRef.current, binaryUpdate, socket);
        }
      } catch (err) {
        console.error('Error applying remote Yjs update:', err);
      }
    };

    const handleDocLoad = ({ content }) => {
      if (content && ydocRef.current) {
        try {
          const binaryUpdate = Uint8Array.from(atob(content), (c) => c.charCodeAt(0));
          Y.applyUpdate(ydocRef.current, binaryUpdate, socket);
        } catch (err) {
          console.error('Failed to load initial Yjs doc state:', err);
        }
      }
    };

    const handleCursorMoved = ({ socketId, userId, name, cursor, isTyping }) => {
      if (cursor && isTyping) {
        setRemoteCursors(prev => ({
          ...prev,
          [socketId]: { range: cursor, name, color: getCursorColor(userId) }
        }));
      } else {
        setRemoteCursors(prev => {
          const newCursors = { ...prev };
          delete newCursors[socketId];
          return newCursors;
        });
      }
    };

    const handleUserLeft = ({ socketId }) => {
      setRemoteCursors(prev => {
        const newCursors = { ...prev };
        delete newCursors[socketId];
        return newCursors;
      });
    };

    socket.on('document:updated', handleDocUpdated);
    socket.on('document:load', handleDocLoad);
    socket.on('cursor:moved', handleCursorMoved);
    socket.on('user:left', handleUserLeft);

    return () => {
      socket.off('document:updated', handleDocUpdated);
      socket.off('document:load', handleDocLoad);
      socket.off('cursor:moved', handleCursorMoved);
      socket.off('user:left', handleUserLeft);
    };
  }, [socket]);

  // Cursor & typing tracking outgoing
  useEffect(() => {
    if (!quillRef.current || !socket) return;

    const handleSelectionChange = (range) => {
      if (range) {
        emit('cursor:update', {
          documentId,
          range,
          isTyping: true,
        });

        const timer = setTimeout(() => {
          emit('cursor:update', {
            documentId,
            range,
            isTyping: false,
          });
        }, 1500);

        return () => clearTimeout(timer);
      }
    };

    quillRef.current.on('selection-change', handleSelectionChange);

    return () => {
      if (quillRef.current) {
        quillRef.current.off('selection-change', handleSelectionChange);
      }
    };
  }, [editorLoaded, socket, documentId]);

  useEffect(() => {
    if (!editorLoaded || !ydocRef.current) return;
    
    window.__getYjsDocState = () => {
      const state = Y.encodeStateAsUpdate(ydocRef.current);
      return btoa(String.fromCharCode(...state));
    };

    return () => {
      delete window.__getYjsDocState;
    };
  }, [editorLoaded]);

  // Render remote cursors inside the quill container using React Portal
  const renderRemoteCursors = () => {
    if (!quillRef.current || !cursorContainer) return null;
    
    const cursors = Object.entries(remoteCursors).map(([socketId, cursorData]) => {
      const { range, name, color } = cursorData;
      if (!range) return null;
      
      try {
        const bounds = quillRef.current.getBounds(range.index);
        if (!bounds) return null;
        
        return (
          <div
            key={socketId}
            className="absolute transition-all duration-100 ease-linear pointer-events-none"
            style={{
              top: `${bounds.top}px`,
              left: `${bounds.left}px`,
              height: `${bounds.height}px`,
            }}
          >
            {/* Cursor line */}
            <div 
              className="absolute w-[2px] h-full"
              style={{ backgroundColor: color }}
            />
            {/* Cursor label */}
            <div 
              className="absolute top-[-22px] left-[-2px] px-1.5 py-0.5 text-[10px] font-semibold text-white whitespace-nowrap rounded shadow-sm opacity-90"
              style={{ backgroundColor: color }}
            >
              {name}
            </div>
          </div>
        );
      } catch (err) {
        return null;
      }
    });

    return createPortal(cursors, cursorContainer);
  };

  return (
    <div className="flex-1 bg-gray-50 flex flex-col overflow-hidden relative">
      <div className="overflow-x-auto scrollbar-hide">
        <CustomToolbar quill={quillRef.current} activeFormats={activeFormats} />
      </div>
      
      <div 
        ref={editorContainerRef} 
        className="flex-1 flex flex-col overflow-hidden text-gray-900 
          [&_.ql-container]:border-none [&_.ql-container]:bg-gray-50 [&_.ql-container]:flex-1 [&_.ql-container]:overflow-y-auto [&_.ql-container]:relative
          
          [&_.ql-editor]:relative [&_.ql-editor]:bg-white [&_.ql-editor]:text-gray-800 [&_.ql-editor]:w-full [&_.ql-editor]:max-w-[816px] [&_.ql-editor]:min-h-[1056px] [&_.ql-editor]:my-6 [&_.ql-editor]:mx-auto [&_.ql-editor]:p-6 sm:[&_.ql-editor]:p-[96px] [&_.ql-editor]:shadow-[0_1px_3px_0_rgba(60,64,67,0.15),0_4px_8px_3px_rgba(60,64,67,0.1)] [&_.ql-editor]:border [&_.ql-editor]:border-gray-200 [&_.ql-editor]:outline-none [&_.ql-editor]:font-sans [&_.ql-editor]:text-[15px] [&_.ql-editor]:leading-[1.6] [&_.ql-editor]:cursor-text [&_.ql-editor]:whitespace-pre-wrap
          
          [&_.ql-editor.ql-blank::before]:absolute [&_.ql-editor.ql-blank::before]:left-6 sm:[&_.ql-editor.ql-blank::before]:left-[96px] [&_.ql-editor.ql-blank::before]:top-6 sm:[&_.ql-editor.ql-blank::before]:top-[96px] [&_.ql-editor.ql-blank::before]:text-gray-400 [&_.ql-editor.ql-blank::before]:not-italic [&_.ql-editor.ql-blank::before]:pointer-events-none [&_.ql-editor.ql-blank::before]:content-[attr(data-placeholder)]
          
          focus:[&_.ql-editor]:border-gray-300 focus:[&_.ql-editor]:shadow-[0_1px_3px_0_rgba(60,64,67,0.15),0_4px_12px_3px_rgba(60,64,67,0.12)]
          
          [&_.ql-editor_h1]:text-4xl [&_.ql-editor_h1]:font-bold [&_.ql-editor_h1]:mt-6 [&_.ql-editor_h1]:mb-4
          [&_.ql-editor_h2]:text-3xl [&_.ql-editor_h2]:font-bold [&_.ql-editor_h2]:mt-5 [&_.ql-editor_h2]:mb-3
          [&_.ql-editor_h3]:text-2xl [&_.ql-editor_h3]:font-bold [&_.ql-editor_h3]:mt-4 [&_.ql-editor_h3]:mb-2
          
          [&_.ql-editor_ol]:list-decimal [&_.ql-editor_ol]:pl-5 [&_.ql-editor_ol]:my-2
          [&_.ql-editor_ul]:list-disc [&_.ql-editor_ul]:pl-5 [&_.ql-editor_ul]:my-2
          [&_.ql-editor_li]:pl-1 [&_.ql-editor_li]:mb-1
          
          [&_.ql-editor_a]:text-blue-600 [&_.ql-editor_a]:underline
        " 
      />
      {renderRemoteCursors()}
    </div>
  );
};

export default RichTextEditor;
