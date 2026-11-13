export const config = {
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL || '',
  supabaseKey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '',
  apiBase: import.meta.env.VITE_API_BASE || 'http://localhost:8000',
  isDemoMode: (): boolean => {
    return localStorage.getItem('voxfable_demo_mode') === 'true';
  },
  setDemoMode: (enabled: boolean) => {
    localStorage.setItem('voxfable_demo_mode', enabled ? 'true' : 'false');
  },
};

export default config;
