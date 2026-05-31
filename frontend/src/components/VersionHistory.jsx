import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { History, RotateCcw, Calendar, User, Loader2 } from 'lucide-react';

const VersionHistory = ({ documentId, onVersionRestored }) => {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [restoringId, setRestoringId] = useState(null);

  useEffect(() => {
    fetchVersions();
  }, [documentId]);

  const fetchVersions = async () => {
    setLoading(true);
    try {
      const { data } = await API.get(`/documents/${documentId}/versions`);
      setVersions(data);
    } catch (err) {
      console.error('Failed to load versions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (versionId) => {
    if (!window.confirm('Are you sure you want to restore this version? The current state will be saved as a new version.')) return;
    setRestoringId(versionId);
    try {
      const { data } = await API.post(`/documents/${documentId}/versions/${versionId}/restore`);
      // Update parent editor/doc content state
      onVersionRestored(data.content);
      // Refresh version list
      fetchVersions();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to restore version');
    } finally {
      setRestoringId(null);
    }
  };

  return (
    <div className="w-80 bg-white border-l border-[#dadce0] p-6 flex flex-col h-full shadow-sm select-none">
      <div className="flex items-center gap-2 mb-6">
        <History className="h-5 w-5 text-blue-600" />
        <h2 className="font-bold text-base text-gray-850">Version Timeline</h2>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3.5 pr-1">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2 text-gray-400">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
            <span className="text-xs">Loading versions...</span>
          </div>
        ) : versions.length === 0 ? (
          <p className="text-sm text-gray-400">No snapshots saved yet.</p>
        ) : (
          versions.map((ver) => (
            <div
              key={ver._id}
              className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 flex flex-col gap-2.5 hover:border-gray-300 transition-colors shadow-sm"
            >
              <div className="flex items-start gap-2.5">
                <Calendar className="h-4 w-4 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-gray-800">
                    {new Date(ver.createdAt).toLocaleString()}
                  </p>
                  <div className="flex items-center gap-1 text-[11px] text-gray-500 mt-1">
                    <User className="h-3 w-3" />
                    <span>Saved by {ver.editedBy?.name || 'Unknown'}</span>
                  </div>
                </div>
              </div>

              <button
                disabled={restoringId !== null}
                onClick={() => handleRestore(ver._id)}
                className="w-full bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-600 text-xs font-semibold py-2 rounded-lg flex items-center justify-center gap-1.5 active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none cursor-pointer border border-blue-200"
              >
                {restoringId === ver._id ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <RotateCcw className="h-3.5 w-3.5" />
                )}
                Restore Version
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default VersionHistory;
