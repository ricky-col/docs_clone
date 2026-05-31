import React, { useState } from 'react';
import { Users, Wifi, UserPlus, ShieldAlert, Loader2, Check, Link2, Copy } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import API from '../services/api';

const COLLABORATOR_COLORS = [
  'bg-blue-500',
  'bg-emerald-500',
  'bg-purple-500',
  'bg-rose-500',
  'bg-amber-500',
  'bg-cyan-500',
];

const CollaboratorPanel = ({ 
  collaborators = [], 
  documentId, 
  docDetails, 
  setDocDetails 
}) => {
  const { user: currentUser } = useAuthStore();
  const [success, setSuccess] = useState(false);

  const isOwner = docDetails?.owner?._id === currentUser?._id;

  return (
    <div className="w-80 bg-white border-l border-[#dadce0] p-5 flex flex-col h-full shadow-sm select-none overflow-y-auto">
      
      {/* 1. SHARE SECTION */}
      <div className="mb-6 pb-6 border-b border-[#dadce0]">
        <div className="flex items-center gap-2 mb-3">
          <UserPlus className="h-5 w-5 text-blue-600" />
          <h3 className="font-bold text-sm text-gray-800">Share with collaborators</h3>
        </div>

        {isOwner ? (
          <div className="space-y-3">
            <p className="text-[12px] text-gray-500 leading-relaxed">
              Anyone with this link can view and edit the document.
            </p>
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-md p-1 pl-3 shadow-sm transition-colors hover:border-gray-300">
              <div className="flex-1 overflow-hidden">
                <p 
                  className="text-[11px] text-gray-500 truncate select-all font-mono" 
                  title={`${window.location.origin}/invite/${documentId}/${docDetails?.inviteToken}`}
                >
                  {`${window.location.origin}/invite/${documentId}/${docDetails?.inviteToken}`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  const inviteLink = `${window.location.origin}/invite/${documentId}/${docDetails?.inviteToken}`;
                  navigator.clipboard.writeText(inviteLink);
                  setSuccess(true);
                  setTimeout(() => setSuccess(false), 3000);
                }}
                className={`px-3 py-1.5 rounded text-[11px] font-semibold flex items-center gap-1.5 transition-all duration-200 cursor-pointer ${
                  success 
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-white text-gray-700 border border-gray-200 shadow-sm hover:bg-gray-50 hover:text-blue-600'
                }`}
              >
                {success ? (
                  <>
                    <Check className="h-3.5 w-3.5" /> Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" /> Copy
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-2 bg-gray-50 border border-gray-200 rounded p-2.5">
            <ShieldAlert className="h-4.5 w-4.5 text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-[11px] text-gray-500">
              Only the document owner (<strong>{docDetails?.owner?.name || 'Owner'}</strong>) can share or manage permissions.
            </p>
          </div>
        )}
      </div>

      {/* 2. PRESENCE (ONLINE NOW) */}
      <div className="mb-6 flex-1 flex flex-col min-h-0">
        <div className="flex items-center gap-2 mb-3">
          <Users className="h-5 w-5 text-blue-650" />
          <h3 className="font-bold text-sm text-gray-800">Active Collaborators</h3>
          <span className="ml-auto text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-bold">
            {collaborators.length}
          </span>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2.5 min-h-[120px] max-h-[220px] pr-1">
          {collaborators.length === 0 ? (
            <p className="text-xs text-gray-400 italic">No active collaborators online.</p>
          ) : (
            collaborators.map((collab, idx) => {
              const colorClass = COLLABORATOR_COLORS[idx % COLLABORATOR_COLORS.length];
              return (
                <div
                  key={collab.email}
                  className="flex items-center justify-between p-2 rounded bg-gray-50 border border-gray-150"
                >
                  <div className="flex items-center gap-2 truncate">
                    <div className={`h-7 w-7 rounded-full ${colorClass} flex items-center justify-center text-white font-bold text-[11px] flex-shrink-0`}>
                      {collab?.name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div className="truncate">
                      <h4 className="text-xs font-semibold text-gray-700 truncate">{collab.name}</h4>
                      <p className="text-[10px] text-gray-400 truncate">{collab.email}</p>
                    </div>
                  </div>
                  <div className="flex-shrink-0 ml-2">
                    {collab.isTyping ? (
                      <span className="flex h-2.5 w-2.5 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-600"></span>
                      </span>
                    ) : (
                      <Wifi className="h-3.5 w-3.5 text-emerald-600" />
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 3. ACCESS LIST */}
      <div className="border-t border-[#dadce0] pt-4">
        <h4 className="font-bold text-xs text-gray-500 uppercase tracking-wider mb-2.5">
          Users with access ({1 + (docDetails?.collaborators?.length || 0)})
        </h4>
        <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
          {/* Owner details */}
          {docDetails?.owner && (
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-full bg-gray-200 text-gray-700 font-bold text-[10px] flex items-center justify-center flex-shrink-0">
                {docDetails?.owner?.name?.charAt(0)?.toUpperCase() || '?'}
              </div>
              <div className="truncate flex-grow">
                <p className="text-xs font-medium text-gray-800 truncate">
                  {docDetails.owner.name} <span className="text-[10px] text-gray-400 font-normal">(Owner)</span>
                </p>
                <p className="text-[9px] text-gray-400 truncate">{docDetails.owner.email}</p>
              </div>
            </div>
          )}

          {/* Invited Collaborators list */}
          {docDetails?.collaborators?.map((collab) => (
            <div key={collab.email} className="flex items-center gap-2">
              <div className="h-6 w-6 rounded-full bg-gray-100 text-gray-600 font-medium text-[10px] flex items-center justify-center flex-shrink-0">
                {collab?.name?.charAt(0)?.toUpperCase() || '?'}
              </div>
              <div className="truncate flex-grow">
                <p className="text-xs text-gray-700 truncate">{collab.name}</p>
                <p className="text-[9px] text-gray-400 truncate">{collab.email}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default CollaboratorPanel;
