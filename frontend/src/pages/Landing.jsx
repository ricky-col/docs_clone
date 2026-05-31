import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { FileText, ArrowRight, PenTool, Users, History, Zap } from 'lucide-react';

const Landing = () => {
  const { user } = useAuthStore();
  const [typedText, setTypedText] = useState('');
  const fullText = "The best ideas happen when we work together. ";

  useEffect(() => {
    let i = 0;
    const typingInterval = setInterval(() => {
      if (i < fullText.length) {
        setTypedText(fullText.slice(0, i + 1));
        i++;
      } else {
        clearInterval(typingInterval);
      }
    }, 100);
    return () => clearInterval(typingInterval);
  }, []);

  return (
    <div className="min-h-screen bg-[#FDFCF8] text-stone-800 selection:bg-stone-200">
      
      {/* Navigation */}
      <nav className="border-b border-stone-200 bg-[#FDFCF8]/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-default">
            <div className="bg-stone-900 rounded p-1.5 flex items-center justify-center">
              <FileText className="h-5 w-5 text-[#FDFCF8]" />
            </div>
            <span className="font-bold text-xl tracking-tight text-stone-900 font-serif">CollabDoc</span>
          </div>
          
          <div className="flex items-center gap-4">
            {user ? (
              <Link 
                to="/dashboard" 
                className="text-sm font-semibold text-stone-900 hover:text-stone-600 transition-colors"
              >
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link 
                  to="/login" 
                  className="hidden sm:block text-sm font-medium text-stone-600 hover:text-stone-900 transition-colors"
                >
                  Log in
                </Link>
                <Link 
                  to="/signup" 
                  className="bg-stone-900 hover:bg-stone-700 text-white text-sm font-medium px-4 py-2 rounded transition-colors"
                >
                  Sign up free
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-20 pb-16 lg:pt-32 lg:pb-24">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          
          {/* Left: Copy */}
          <div className="max-w-xl">
            <h1 className="text-5xl sm:text-6xl font-serif font-bold text-stone-900 leading-tight mb-6">
              Write together,<br/>without the chaos.
            </h1>
            <p className="text-lg sm:text-xl text-stone-600 mb-8 leading-relaxed">
              A simple, fast, and remarkably human place for your team to capture ideas, draft documents, and collaborate in real-time. No clutter, just your words.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link 
                to={user ? "/dashboard" : "/signup"}
                className="inline-flex justify-center items-center gap-2 bg-stone-900 hover:bg-stone-800 text-white font-medium px-6 py-3.5 rounded text-lg transition-colors group"
              >
                Start writing
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            
            <div className="mt-10 flex items-center gap-4 text-sm text-stone-500 font-medium">
              <div className="flex -space-x-2">
                <img className="w-8 h-8 rounded-full border-2 border-[#FDFCF8]" src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=64&q=80" alt="User" />
                <img className="w-8 h-8 rounded-full border-2 border-[#FDFCF8]" src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=64&q=80" alt="User" />
                <img className="w-8 h-8 rounded-full border-2 border-[#FDFCF8]" src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=64&q=80" alt="User" />
              </div>
              <p>Loved by thousands of human teams.</p>
            </div>
          </div>

          {/* Right: Realistic Photograph & Grounded Mockup */}
          <div className="relative">
            {/* The main photograph */}
            <div className="rounded-sm overflow-hidden border border-stone-200 shadow-xl aspect-[4/3] relative">
              <img 
                src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80" 
                alt="Team collaborating" 
                className="object-cover w-full h-full grayscale-[20%] sepia-[10%]"
              />
              <div className="absolute inset-0 bg-stone-900/10"></div>
            </div>

            {/* The "Paper" Mockup floating over the photo organically */}
            <div className="absolute -bottom-8 -left-4 sm:-bottom-12 sm:-left-12 w-[90%] sm:w-[80%] bg-white p-6 sm:p-8 rounded shadow-2xl border border-stone-100 rotate-[-2deg] transition-transform hover:rotate-0 duration-500">
              <div className="w-12 h-1 bg-stone-200 mb-6 rounded-full"></div>
              <h3 className="font-serif text-xl sm:text-2xl font-bold text-stone-900 mb-3 outline-none" contentEditable suppressContentEditableWarning>
                Project Manifesto
              </h3>
              <div className="flex flex-wrap items-center mt-2">
                <p className="text-stone-600 leading-relaxed min-h-[1.5rem] font-serif">
                  {typedText}
                </p>
                <div className="flex items-center ml-1 relative">
                  <div className="w-0.5 h-4 sm:h-5 bg-stone-900 animate-pulse"></div>
                  <div className="absolute -top-7 -left-3 bg-stone-900 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm opacity-90 whitespace-nowrap">
                    Sarah
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Divider */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <hr className="border-stone-200" />
      </div>

      {/* Features Section - Earthy & Simple */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-20 lg:py-24">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-stone-900 mb-4">
            Everything you need. Nothing you don't.
          </h2>
          <p className="text-stone-600 text-lg">
            We stripped away the menus and the clutter to leave you with a blank canvas and the tools that actually matter.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          
          <div className="bg-[#F8F7F3] p-8 border border-stone-200 rounded">
            <div className="w-10 h-10 bg-amber-100 text-amber-700 rounded flex items-center justify-center mb-6">
              <Zap className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-bold text-stone-900 mb-2 font-serif">Instant Sync</h3>
            <p className="text-stone-600 leading-relaxed text-sm">
              Type a letter, and your team sees it instantly. Our real-time engine ensures nobody ever accidentally overwrites someone else's work.
            </p>
          </div>

          <div className="bg-[#F8F7F3] p-8 border border-stone-200 rounded">
            <div className="w-10 h-10 bg-emerald-100 text-emerald-700 rounded flex items-center justify-center mb-6">
              <History className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-bold text-stone-900 mb-2 font-serif">Time Travel</h3>
            <p className="text-stone-600 leading-relaxed text-sm">
              Deleted a paragraph by mistake? Just open the version history and restore any previous state with a single click. You can't break it.
            </p>
          </div>

          <div className="bg-[#F8F7F3] p-8 border border-stone-200 rounded">
            <div className="w-10 h-10 bg-rose-100 text-rose-700 rounded flex items-center justify-center mb-6">
              <PenTool className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-bold text-stone-900 mb-2 font-serif">Distraction Free</h3>
            <p className="text-stone-600 leading-relaxed text-sm">
              The editor fades away when you start typing. Focus entirely on your thoughts without a dozen toolbars screaming for your attention.
            </p>
          </div>

        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-stone-200 bg-[#FDFCF8] py-12 text-center">
        <p className="text-stone-500 text-sm font-medium">
          Handcrafted with care. CollabDoc © {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  );
};

export default Landing;
