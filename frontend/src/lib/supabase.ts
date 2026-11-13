import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from '../config';

let client: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (config.isDemoMode()) {
    return null;
  }
  if (!client && config.supabaseUrl && config.supabaseKey) {
    client = createClient(config.supabaseUrl, config.supabaseKey);
  }
  return client;
}

export const supabase = getSupabaseClient();
