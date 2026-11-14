import React, { Suspense, lazy, useState, useEffect, useRef } from 'react';
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
  const searchInputRef = useRef<HTMLInputElement>(null);

  const currentPath = location.pathname;

  const navItems = [
    { path: '/', label: 'Home', icon: '🏠' },
    { path: '/quick', label: 'Quick Story', icon: '🌙' },
    { path: '/studio', label: 'Studio', icon: '🎬' },
    { path: '/library', label: 'Library', icon: '📚' },
    { path: '/debug', label: 'Diagnostics', icon: '⚙️' },
  ];

  // Sliding pill position state & element refs
  const [indicatorStyle, setIndicatorStyle] = useState({
    left: 0,
    top: 6,
    width: 0,
    height: 0,
    opacity: 0,
  });
  const navRef = useRef<HTMLElement>(null);
  const itemRefs = useRef<Map<string, HTMLAnchorElement>>(new Map());

  const updateIndicator = () => {
    const matchedItem =
      navItems.find((item) =>
        item.path === '/'
          ? currentPath === '/'
          : currentPath.startsWith(item.path)
      ) || navItems[0];

    const el = itemRefs.current.get(matchedItem.path);
    if (el && navRef.current) {
      setIndicatorStyle({
        left: el.offsetLeft,
        top: el.offsetTop,
        width: el.offsetWidth,
        height: el.offsetHeight,
        opacity: 1,
      });
    }
  };

  useEffect(() => {
    updateIndicator();
  }, [currentPath]);

  useEffect(() => {
    window.addEventListener('resize', updateIndicator);
    if (document.fonts) {
      document.fonts.ready.then(updateIndicator);
    }
    const timer = setTimeout(updateIndicator, 50);
    return () => {
      window.removeEventListener('resize', updateIndicator);
      clearTimeout(timer);
    };
  }, []);

  const handleOpenSearch = () => {
    setIsSearchOpen(true);
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 100);
  };

  const handleCloseSearch = () => {
    setIsSearchOpen(false);
  };

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
    <header className="sticky top-0 z-50 w-full px-4 sm:px-8 py-3 flex items-center justify-between gap-3 select-none backdrop-blur-md bg-white/40 dark:bg-[#070a13]/40 border-b border-stone-200/50 dark:border-white/5 transition-colors duration-300">
      {/* 1. Left Brand Pod with Logo_Navbar */}
      <Link
        to="/"
        className="group flex items-center px-2 py-1 sm:px-2.5 sm:py-1 rounded-full bg-white/80 dark:bg-[#131d2e]/80 backdrop-blur-2xl border-t border-white/40 dark:border-white/15 border-l border-white/30 dark:border-white/10 border-r border-stone-200/80 dark:border-black/30 border-b border-stone-200/80 dark:border-black/40 shadow-storybook-sm hover:shadow-storybook hover:scale-[1.03] active:scale-[0.96] transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] shrink-0"
        title="VoxFable Home"
      >
        <img
          src="/logo_navbar.png"
          alt="VoxFable"
          className="h-8 sm:h-9 w-auto object-contain rounded-full group-hover:scale-105 transition-transform duration-300"
        />
        <span className="sr-only">VoxFable</span>
      </Link>

      {/* 2. Floating Center Pill Navigation Dock with Sliding Spring Indicator */}
      <nav
        ref={navRef}
        className="relative flex items-center gap-1 sm:gap-1.5 p-1.5 rounded-full bg-white/85 dark:bg-[#131d2e]/90 backdrop-blur-2xl border-t border-white/40 dark:border-white/15 border-l border-white/30 dark:border-white/10 border-r border-stone-200/90 dark:border-black/40 border-b border-stone-200/90 dark:border-black/50 shadow-[0_8px_32px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.5)] overflow-x-auto scrollbar-none transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
      >
        {/* The Smooth Sliding Spring Pill Indicator (Glides between sections) */}
        <div
          className="absolute rounded-full bg-gradient-to-r from-vox-gold via-lantern-500 to-vox-gold shadow-gold-sm pointer-events-none transition-all duration-350 ease-[cubic-bezier(0.16,1,0.3,1)]"
          style={{
            transform: `translate3d(${indicatorStyle.left}px, ${indicatorStyle.top}px, 0)`,
            width: `${indicatorStyle.width}px`,
            height: `${indicatorStyle.height}px`,
            opacity: indicatorStyle.opacity,
            left: 0,
            top: 0,
          }}
        />

        {navItems.map((item) => {
          const isActive =
            item.path === '/'
              ? currentPath === '/'
              : currentPath.startsWith(item.path);

          return (
            <Link
              key={item.path}
              to={item.path}
              ref={(el) => {
                if (el) itemRefs.current.set(item.path, el);
                else itemRefs.current.delete(item.path);
              }}
              className={`group relative z-10 flex items-center gap-1.5 sm:gap-2 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-bold transition-colors duration-250 whitespace-nowrap active:scale-[0.94] ${
                isActive
                  ? 'text-vox-midnight'
                  : 'text-stone-600 dark:text-slate-300 hover:text-vox-midnight dark:hover:text-vox-gold'
              }`}
            >
              <span className="text-sm transition-transform duration-200 ease-out group-hover:scale-115 group-hover:-translate-y-0.5 inline-block">
                {item.icon}
              </span>
              <span className="tracking-tight transition-colors duration-200">
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* 3. Right Companion Pods: Morphing Search Pod & Dark Mode */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Smooth Expanding Companion Search Pod (Apple Morphing Spring Animation) */}
        <div
          className={`relative h-10 rounded-full flex items-center bg-white/85 dark:bg-[#131d2e]/90 backdrop-blur-2xl border-t border-white/40 dark:border-white/15 border-l border-white/30 dark:border-white/10 border-r border-stone-200/90 dark:border-black/40 border-b border-stone-200/90 dark:border-black/50 shadow-storybook-sm transition-all duration-350 ease-[cubic-bezier(0.16,1,0.3,1)] overflow-hidden ${
            isSearchOpen
              ? 'w-60 sm:w-72 ring-2 ring-vox-gold/40 border-vox-gold/60 shadow-gold-sm px-3.5'
              : 'w-10 hover:w-10 hover:border-vox-gold/60 hover:scale-105 active:scale-95 cursor-pointer justify-center'
          }`}
          onClick={!isSearchOpen ? handleOpenSearch : undefined}
          title={!isSearchOpen ? 'Search videos in Asset Library' : undefined}
        >
          {isSearchOpen ? (
            <form onSubmit={handleSearchSubmit} className="flex items-center w-full gap-2">
              <span className="text-xs text-vox-gold animate-fadeIn">🔍</span>
              <input
                ref={searchInputRef}
                type="text"
                value={navSearchQuery}
                onChange={(e) => setNavSearchQuery(e.target.value)}
                placeholder="Search videos in Library..."
                className="bg-transparent text-xs text-stone-900 dark:text-slate-100 placeholder:text-stone-400 dark:placeholder:text-slate-500 focus:outline-none flex-1 min-w-0"
              />
              <button
                type="button"
                onClick={handleCloseSearch}
                className="w-5 h-5 rounded-full flex items-center justify-center text-xs text-stone-400 hover:text-stone-700 dark:text-slate-500 dark:hover:text-slate-200 hover:scale-110 active:scale-90 transition-all"
                title="Close search"
              >
                ✕
              </button>
            </form>
          ) : (
            <div className="flex items-center justify-center w-full h-full text-stone-700 dark:text-slate-200 hover:text-vox-gold transition-colors duration-200">
              <svg className="w-4 h-4 transition-transform duration-200 hover:scale-110" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>
          )}
        </div>

        {/* Companion Dark Mode Pod with Fluid Physics */}
        <button
          type="button"
          onClick={onToggleTheme}
          aria-label="Toggle dark mode"
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          className="group h-10 px-3.5 rounded-full flex items-center gap-1.5 text-xs font-bold border-t border-white/40 dark:border-white/15 border-l border-white/30 dark:border-white/10 border-r border-stone-200/90 dark:border-black/40 border-b border-stone-200/90 dark:border-black/50 bg-white/85 dark:bg-[#131d2e]/90 backdrop-blur-2xl text-stone-800 dark:text-slate-200 hover:border-vox-gold/50 hover:text-vox-gold shadow-storybook-sm hover:shadow-storybook hover:scale-105 active:scale-95 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
        >
          <span className="text-xs transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:rotate-180 group-hover:scale-120 inline-block">
            {isDark ? '🌙' : '☀️'}
          </span>
          <span className="hidden md:inline transition-colors duration-200">
            {isDark ? 'Dark' : 'Light'}
          </span>
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
