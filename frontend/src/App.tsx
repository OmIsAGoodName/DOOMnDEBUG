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
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
          <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-3 flex items-center justify-between">
            <Link to="/" className="text-xl font-bold tracking-tight text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <span>✨</span> VoxFable
            </Link>
            <nav className="flex items-center gap-4 text-sm font-medium text-slate-600 dark:text-slate-300">
              <Link to="/quick" className="hover:text-slate-900 dark:hover:text-white transition-colors">Quick Story</Link>
              <Link to="/studio" className="hover:text-slate-900 dark:hover:text-white transition-colors">Studio</Link>
              <Link to="/library" className="hover:text-slate-900 dark:hover:text-white transition-colors">Library</Link>

              {/* Dark Mode Toggle */}
              <button
                type="button"
                onClick={() => setIsDark((prev) => !prev)}
                aria-label="Toggle dark mode"
                className="ml-2 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                <span>{isDark ? '🌙' : '☀️'}</span>
                <span>{isDark ? 'Dark' : 'Light'}</span>
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
