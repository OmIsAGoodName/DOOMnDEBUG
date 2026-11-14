export const config = {
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL || '',
  supabaseKey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '',
  apiBase:
    import.meta.env.VITE_API_BASE ||
    (import.meta.env.PROD ? 'https://voxfable-backend.onrender.com' : 'http://localhost:8000'),
  isDemoMode: (): boolean => {
    const stored = localStorage.getItem('voxfable_demo_mode');
    if (stored !== null) return stored === 'true';
    // If Supabase is not configured, default to demo mode for seamless zero-config play
    const sbUrl = import.meta.env.VITE_SUPABASE_URL || '';
    return !sbUrl || sbUrl.includes('your-project');
  },
  setDemoMode: (enabled: boolean) => {
    localStorage.setItem('voxfable_demo_mode', enabled ? 'true' : 'false');
  },
};

export default config;
