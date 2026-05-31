import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { LogOut, FileText, User } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [showProfile, setShowProfile] = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setShowProfile(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white border-b border-[#dadce0] px-6 py-3.5 flex items-center justify-between sticky top-0 z-50 select-none">
      <Link to="/" className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
        <div className="bg-stone-900 rounded p-1.5 flex items-center justify-center">
          <FileText className="h-5 w-5 text-[#FDFCF8]" />
        </div>
        <span className="font-bold text-xl tracking-tight text-stone-900 font-serif">
          CollabDoc
        </span>
      </Link>

      {user && (
        <div className="flex items-center gap-2 sm:gap-4 relative" ref={profileRef}>
          <div 
            onClick={() => setShowProfile(!showProfile)}
            className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 cursor-pointer border border-gray-200 rounded-full py-1.5 px-2 sm:px-3 transition-colors"
          >
            <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
              {user?.name?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <span className="text-xs font-semibold text-gray-700 hidden sm:block">{user.name}</span>
          </div>

          {showProfile && (
            <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-gray-200 rounded-2xl shadow-xl py-4 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="flex flex-col items-center px-4 mb-4">
                <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-2xl mb-2">
                  {user?.name?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <span className="text-base font-bold text-gray-900">{user?.name}</span>
                <span className="text-sm text-gray-500 truncate max-w-full">{user?.email}</span>
              </div>
              <hr className="border-gray-100 my-2" />
              <div className="px-2">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 hover:bg-red-50 text-red-600 rounded-xl py-2 px-4 text-sm font-semibold transition-colors active:scale-95 cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
