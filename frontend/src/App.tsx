import React, { Suspense, lazy, useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
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
          <header className="sticky top-0 z-40 bg-white/90 dark:bg-midnight-900/90 backdrop-blur-md border-b border-stone-200/80 dark:border-midnight-700/70 px-6 py-3 flex items-center justify-between shadow-storybook-sm">
            <Link to="/" className="text-xl font-bold font-display tracking-tight text-stone-900 dark:text-slate-100 flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500 text-xs shadow-storybook-sm">✨</span>
              <span>VoxFable</span>
            </Link>
            <nav className="flex items-center gap-4 text-sm font-semibold text-stone-600 dark:text-slate-300">
              <Link to="/quick" className="hover:text-stone-900 dark:hover:text-amber-300 transition-colors">Quick Story</Link>
              <Link to="/studio" className="hover:text-stone-900 dark:hover:text-amber-300 transition-colors">Studio</Link>
              <Link to="/library" className="hover:text-stone-900 dark:hover:text-amber-300 transition-colors">Library</Link>
              <Link to="/debug" className="hover:text-amber-500 dark:hover:text-amber-400 font-bold transition-colors">⚙️ Diagnostics</Link>

              {/* Dark Mode Toggle */}
              <button
                type="button"
                onClick={() => setIsDark((prev) => !prev)}
                aria-label="Toggle dark mode"
                className="ml-2 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border border-stone-200/90 dark:border-midnight-700/80 bg-stone-100/90 hover:bg-stone-200 dark:bg-midnight-800 dark:hover:bg-midnight-750 text-stone-800 dark:text-slate-200 transition-all shadow-storybook-sm active:scale-95"
              >
                <span className="text-xs">{isDark ? '🌙' : '☀️'}</span>
                <span>{isDark ? 'Dark Mode' : 'Light Mode'}</span>
              </button>
            </nav>
          </header>

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
