import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { LogOut, FileText, User } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

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
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="flex items-center gap-2 bg-gray-100 border border-gray-200 rounded-full py-1.5 px-2 sm:px-3">
            <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
              {user?.name?.charAt(0)?.toUpperCase() || '?'}
            </div>
            <span className="text-xs font-semibold text-gray-700 hidden sm:block">{user.name}</span>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 hover:bg-red-50 text-gray-600 hover:text-red-600 border border-gray-300 hover:border-red-200 rounded-full py-1.5 px-3 sm:px-4 text-xs font-semibold transition-all active:scale-95 cursor-pointer shadow-sm"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
