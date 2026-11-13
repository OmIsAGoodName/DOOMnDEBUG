import type { DataRepo, Series, CharacterRecord, UserProfile } from '@contracts';
import { getSupabaseClient } from './supabase';
import { config } from '../config';

export class LocalRepo implements DataRepo {
  private getStorage<T>(key: string): Record<string, T> {
    try {
      return JSON.parse(localStorage.getItem(`voxfable_local_${key}`) || '{}');
    } catch {
      return {};
    }
  }

  private setStorage<T>(key: string, data: Record<string, T>) {
    localStorage.setItem(`voxfable_local_${key}`, JSON.stringify(data));
  }

  async listSeries(): Promise<Series[]> {
    const data = this.getStorage<Series>('series');
    return Object.values(data);
  }

  async getSeries(id: string): Promise<Series | null> {
    const data = this.getStorage<Series>('series');
    return data[id] || null;
  }

  async saveSeries(series: Partial<Series> & { title: string }): Promise<Series> {
    const data = this.getStorage<Series>('series');
    const id = series.id || `series_${Date.now()}`;
    const record: Series = {
      id,
      title: series.title,
      world: series.world || { setting: 'forest' },
      tone: series.tone || 'calm',
      age_band: series.age_band || '4-6',
      language: series.language || 'en',
      character_ids: series.character_ids || [],
      created_at: series.created_at || new Date().toISOString(),
    };
    data[id] = record;
    this.setStorage('series', data);
    return record;
  }

  async deleteSeries(id: string): Promise<void> {
    const data = this.getStorage<Series>('series');
    delete data[id];
    this.setStorage('series', data);
  }

  async listCharacters(seriesId?: string): Promise<CharacterRecord[]> {
    const data = this.getStorage<CharacterRecord>('characters');
    const all = Object.values(data);
    if (seriesId) {
      return all.filter((c) => c.series_id === seriesId);
    }
    return all;
  }

  async saveCharacter(char: Partial<CharacterRecord> & { name: string; species: string }): Promise<CharacterRecord> {
    const data = this.getStorage<CharacterRecord>('characters');
    const id = char.id || `char_${Date.now()}`;
    const record: CharacterRecord = {
      id,
      name: char.name,
      species: char.species,
      series_id: char.series_id || null,
      slug: char.slug || id,
      bible: char.bible || {
        id,
        name: char.name,
        species: char.species,
        personality: ['curious'],
        voice: { engine_voice: 'en-US-AnaNeural' },
        look: {
          palette: { primary: '#8b5e3c', secondary: '#d9b38c', accent: '#f2a65a', outline: '#3b2a1e' },
          accessories: [],
        },
      },
      created_at: char.created_at || new Date().toISOString(),
    };
    data[id] = record;
    this.setStorage('characters', data);
    return record;
  }

  async deleteCharacter(id: string): Promise<void> {
    const data = this.getStorage<CharacterRecord>('characters');
    delete data[id];
    this.setStorage('characters', data);
  }

  async getProfile(): Promise<UserProfile | null> {
    const profile = localStorage.getItem('voxfable_local_profile');
    if (!profile) return { id: 'demo', display_name: 'Demo Explorer', account_type: 'parent' };
    try {
      return JSON.parse(profile);
    } catch {
      return null;
    }
  }

  async saveProfile(profile: Partial<UserProfile>): Promise<UserProfile> {
    const current = (await this.getProfile()) || { id: 'demo', display_name: 'Demo', account_type: 'parent' };
    const updated: UserProfile = { ...current, ...profile };
    localStorage.setItem('voxfable_local_profile', JSON.stringify(updated));
    return updated;
  }
}

export class SupabaseRepo implements DataRepo {
  private get client() {
    const sb = getSupabaseClient();
    if (!sb) throw new Error('Supabase client unavailable');
    return sb;
  }

  async listSeries(): Promise<Series[]> {
    const { data, error } = await this.client.from('series').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return (data as Series[]) || [];
  }

  async getSeries(id: string): Promise<Series | null> {
    const { data, error } = await this.client.from('series').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    return data as Series | null;
  }

  async saveSeries(series: Partial<Series> & { title: string }): Promise<Series> {
    const { data: user } = await this.client.auth.getUser();
    if (!user.user) throw new Error('Not authenticated');

    const payload = { ...series, owner_id: user.user.id };
    const { data, error } = await this.client.from('series').upsert(payload).select().single();
    if (error) throw error;
    return data as Series;
  }

  async deleteSeries(id: string): Promise<void> {
    const { error } = await this.client.from('series').delete().eq('id', id);
    if (error) throw error;
  }

  async listCharacters(seriesId?: string): Promise<CharacterRecord[]> {
    let query = this.client.from('characters').select('*');
    if (seriesId) query = query.eq('series_id', seriesId);
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return (data as CharacterRecord[]) || [];
  }

  async saveCharacter(char: Partial<CharacterRecord> & { name: string; species: string }): Promise<CharacterRecord> {
    const { data: user } = await this.client.auth.getUser();
    if (!user.user) throw new Error('Not authenticated');

    const payload = { ...char, owner_id: user.user.id };
    const { data, error } = await this.client.from('characters').upsert(payload).select().single();
    if (error) throw error;
    return data as CharacterRecord;
  }

  async deleteCharacter(id: string): Promise<void> {
    const { error } = await this.client.from('characters').delete().eq('id', id);
    if (error) throw error;
  }

  async getProfile(): Promise<UserProfile | null> {
    const { data: user } = await this.client.auth.getUser();
    if (!user.user) return null;
    const { data, error } = await this.client.from('profiles').select('*').eq('id', user.user.id).maybeSingle();
    if (error) throw error;
    return data as UserProfile | null;
  }

  async saveProfile(profile: Partial<UserProfile>): Promise<UserProfile> {
    const { data: user } = await this.client.auth.getUser();
    if (!user.user) throw new Error('Not authenticated');
    const { data, error } = await this.client.from('profiles').upsert({ ...profile, id: user.user.id }).select().single();
    if (error) throw error;
    return data as UserProfile;
  }
}

export function getDataRepo(): DataRepo {
  if (config.isDemoMode()) {
    return new LocalRepo();
  }
  try {
    return new SupabaseRepo();
  } catch {
    return new LocalRepo();
  }
}
