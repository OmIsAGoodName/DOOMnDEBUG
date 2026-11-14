import React, { Suspense, lazy, useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider, AuthGuard } from './auth';

const Home = lazy(() => import('./pages/Home'));
const Quick = lazy(() => import('./pages/Quick'));
const Studio = lazy(() => import('./pages/Studio'));
const Library = lazy(() => import('./pages/Library'));
const Episode = lazy(() => import('./pages/Episode'));
const Login = lazy(() => import('./pages/auth/Login'));
const Signup = lazy(() => import('./pages/auth/Signup'));
const EngineHarness = lazy(() => import('./engine/dev/Harness'));
const LiveHarness = lazy(() => import('./live/dev/LiveHarness'));
const ArtGallery = lazy(() => import('./pages/dev/ArtGallery'));
const Debug = lazy(() => import('./pages/Debug'));

interface NavBarProps {
  isDark: boolean;
  onToggleTheme: () => void;
}

function NavBar({ isDark, onToggleTheme }: NavBarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [navSearchQuery, setNavSearchQuery] = useState('');

  const currentPath = location.pathname;

  const navItems = [
    { path: '/', label: 'Home', icon: '🏠' },
    { path: '/quick', label: 'Quick Story', icon: '🌙' },
    { path: '/studio', label: 'Studio', icon: '🎬' },
    { path: '/library', label: 'Library', icon: '📚' },
    { path: '/debug', label: 'Diagnostics', icon: '⚙️' },
  ];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (navSearchQuery.trim()) {
      navigate(`/library?q=${encodeURIComponent(navSearchQuery.trim())}`);
      setIsSearchOpen(false);
    } else {
      navigate('/library');
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full px-4 sm:px-8 py-3.5 flex items-center justify-between gap-3 select-none backdrop-blur-md bg-white/40 dark:bg-[#070a13]/40 border-b border-stone-200/50 dark:border-white/5 transition-colors">
      {/* 1. Left Brand Pod */}
      <Link
        to="/"
        className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-white/80 dark:bg-[#131d2e]/80 backdrop-blur-2xl border border-stone-200/80 dark:border-white/10 shadow-storybook-sm hover:scale-[1.02] transition-transform shrink-0"
      >
        <span className="w-7 h-7 rounded-full bg-vox-gold/20 border border-vox-gold/40 flex items-center justify-center text-vox-gold text-xs shadow-storybook-sm font-bold">
          ✨
        </span>
        <span className="font-extrabold font-display tracking-tight text-stone-900 dark:text-slate-100 text-sm hidden sm:inline">
          VoxFable
        </span>
      </Link>

      {/* 2. Floating Center Pill Navigation Dock (Inspired by Image 1) */}
      <nav className="flex items-center gap-1 sm:gap-1.5 p-1.5 rounded-full bg-white/85 dark:bg-[#131d2e]/90 backdrop-blur-2xl border border-stone-200/90 dark:border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.5)] overflow-x-auto scrollbar-none">
        {navItems.map((item) => {
          const isActive =
            item.path === '/'
              ? currentPath === '/'
              : currentPath.startsWith(item.path);

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-bold transition-all duration-200 whitespace-nowrap active:scale-95 ${
                isActive
                  ? 'bg-gradient-to-r from-vox-gold via-lantern-500 to-vox-gold text-vox-midnight shadow-gold-sm ring-1 ring-vox-gold/40'
                  : 'text-stone-600 dark:text-slate-300 hover:text-vox-midnight dark:hover:text-vox-gold hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              <span className="text-sm">{item.icon}</span>
              <span className="tracking-tight">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* 3. Right Companion Pods: Interactive Search & Dark Mode (Inspired by Image 1) */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Companion Search Pod (Exact Image 1 Companion Feature) */}
        {isSearchOpen ? (
          <form
            onSubmit={handleSearchSubmit}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/95 dark:bg-[#131d2e]/95 backdrop-blur-2xl border border-vox-gold/70 shadow-gold-sm animate-fadeIn"
          >
            <span className="text-xs text-vox-gold">🔍</span>
            <input
              type="text"
              autoFocus
              value={navSearchQuery}
              onChange={(e) => setNavSearchQuery(e.target.value)}
              placeholder="Search videos in Library..."
              className="bg-transparent text-xs text-stone-900 dark:text-slate-100 placeholder:text-stone-400 dark:placeholder:text-slate-500 focus:outline-none w-36 sm:w-52"
            />
            <button
              type="button"
              onClick={() => setIsSearchOpen(false)}
              className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] text-stone-400 hover:text-stone-600 dark:text-slate-500 dark:hover:text-slate-300"
            >
              ✕
            </button>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setIsSearchOpen(true)}
            title="Search videos in Asset Library"
            className="w-10 h-10 rounded-full flex items-center justify-center bg-white/80 dark:bg-[#131d2e]/85 backdrop-blur-2xl border border-stone-200/90 dark:border-white/10 shadow-storybook-sm hover:border-vox-gold/60 text-stone-700 dark:text-slate-200 hover:text-vox-gold hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </button>
        )}

        {/* Companion Dark Mode Pod */}
        <button
          type="button"
          onClick={onToggleTheme}
          aria-label="Toggle dark mode"
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          className="h-10 px-3.5 rounded-full flex items-center gap-1.5 text-xs font-bold border border-stone-200/90 dark:border-white/10 bg-white/80 dark:bg-[#131d2e]/85 backdrop-blur-2xl text-stone-800 dark:text-slate-200 hover:border-vox-gold/50 shadow-storybook-sm active:scale-95 transition-all"
        >
          <span>{isDark ? '🌙' : '☀️'}</span>
          <span className="hidden md:inline">{isDark ? 'Dark' : 'Light'}</span>
        </button>
      </div>
    </header>
  );
}

export default function App() {
  const [isDark, setIsDark] = useState<boolean>(() => {
    const saved = localStorage.getItem('voxfable_theme');
    // Default to dark mode as requested
    return saved ? saved === 'dark' : true;
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('voxfable_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('voxfable_theme', 'light');
    }
  }, [isDark]);

  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-parchment-50 dark:bg-midnight-950 text-stone-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
          <NavBar isDark={isDark} onToggleTheme={() => setIsDark((prev) => !prev)} />

          <main className="flex-1">
            <Suspense fallback={<div className="p-8 text-center text-slate-400 dark:text-slate-500">Loading page...</div>}>
              <Routes>
                {/* Public Auth Routes */}
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />

                {/* Protected / Demo Routes */}
                <Route element={<AuthGuard />}>
                  <Route path="/" element={<Home />} />
                  <Route path="/quick" element={<Quick />} />
                  <Route path="/studio" element={<Studio />} />
                  <Route path="/library" element={<Library />} />
                  <Route path="/debug" element={<Debug />} />
                  <Route path="/episode/:id" element={<Episode />} />
                  <Route path="/dev/engine" element={<EngineHarness />} />
                  <Route path="/dev/live" element={<LiveHarness />} />
                  <Route path="/dev/art" element={<ArtGallery />} />
                </Route>
              </Routes>
            </Suspense>
          </main>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}
