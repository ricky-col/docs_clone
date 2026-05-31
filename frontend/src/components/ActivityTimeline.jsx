import React from 'react';
import { Activity, LogIn, LogOut, Save, Edit3 } from 'lucide-react';

const ActivityTimeline = ({ activities = [] }) => {
  return (
    <div className="w-80 bg-white border-l border-[#dadce0] p-5 flex flex-col h-full shadow-sm overflow-y-auto">
      <div className="flex items-center gap-2 mb-4 pb-2 border-b border-[#dadce0]">
        <Activity className="h-5 w-5 text-purple-600" />
        <h3 className="font-bold text-sm text-gray-800">Activity Timeline</h3>
      </div>
      
      <div className="flex-1 space-y-4 pr-1 relative">
        {activities.length === 0 ? (
          <p className="text-xs text-gray-400 italic">No recent activity.</p>
        ) : (
          activities.map((act, idx) => (
            <div key={idx} className="flex gap-3 relative">
              {idx !== activities.length - 1 && (
                <div className="absolute left-[11px] top-6 bottom-[-24px] w-[2px] bg-gray-100" />
              )}
              <div className="flex-shrink-0 z-10 bg-white mt-0.5">
                {act.type === 'join' && <LogIn className="h-6 w-6 text-emerald-500 bg-emerald-50 rounded p-1" />}
                {act.type === 'leave' && <LogOut className="h-6 w-6 text-rose-500 bg-rose-50 rounded p-1" />}
                {act.type === 'save' && <Save className="h-6 w-6 text-blue-500 bg-blue-50 rounded p-1" />}
                {act.type === 'edit' && <Edit3 className="h-6 w-6 text-amber-500 bg-amber-50 rounded p-1" />}
              </div>
              <div className="pb-2">
                <p className="text-xs text-gray-700 font-medium">{act.message}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">
                  {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ActivityTimeline;
