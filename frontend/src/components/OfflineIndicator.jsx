import React, { useState, useEffect } from 'react';
import { WifiOff, Loader2 } from 'lucide-react';

const OfflineIndicator = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="fixed bottom-6 right-6 bg-gray-900 text-white px-4 py-3 rounded-lg shadow-xl flex items-center gap-3 z-50 animate-in slide-in-from-bottom-5">
      <WifiOff className="h-5 w-5 text-red-400" />
      <div className="flex flex-col">
        <span className="font-semibold text-sm">You are offline</span>
        <span className="text-xs text-gray-300">Changes will be saved locally.</span>
      </div>
      <Loader2 className="h-4 w-4 animate-spin text-gray-400 ml-2" />
    </div>
  );
};

export default OfflineIndicator;
