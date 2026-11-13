import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { AuthGuard } from './auth';

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
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
        <header className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between">
          <Link to="/" className="text-xl font-bold tracking-tight text-slate-800 flex items-center gap-2">
            <span>✨</span> VoxFable
          </Link>
          <nav className="flex items-center gap-4 text-sm font-medium text-slate-600">
            <Link to="/quick" className="hover:text-slate-900">Quick Story</Link>
            <Link to="/studio" className="hover:text-slate-900">Studio</Link>
            <Link to="/library" className="hover:text-slate-900">Library</Link>
          </nav>
        </header>

        <main className="flex-1">
          <Suspense fallback={<div className="p-8 text-center text-slate-400">Loading page...</div>}>
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
  );
}

