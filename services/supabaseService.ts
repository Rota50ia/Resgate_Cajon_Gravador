
import { createClient } from '@supabase/supabase-js';

export interface SupabasePracticeData {
  rhythm_name: string;
  accuracy: number;
  type_accuracy: number;
  bpm: number;
  avg_offset_ms: number;
}

const SUPABASE_URL = "https://ctvdlamxicoxniyqcpfd.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN0dmRsYW14aWNveG5peXFjcGZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA0MjQ0MDksImV4cCI6MjA1NjAwMDQwOX0.H00Y_vwQQBVmWrdIBdSb-IklfMfe7bzxdAESh7J0ouc";

export class SupabaseService {
  private supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  async uploadSession(audioBlob: Blob, data: SupabasePracticeData) {
    const fileName = `session_${Date.now()}.webm`;
    const filePath = `${fileName}`;

    try {
      const { data: storageData, error: storageError } = await this.supabase
        .storage
        .from('cajon-recordings')
        .upload(filePath, audioBlob, {
          contentType: 'audio/webm',
          upsert: true
        });

      if (storageError) throw storageError;

      const { data: { publicUrl } } = this.supabase
        .storage
        .from('cajon-recordings')
        .getPublicUrl(filePath);

      const { error: dbError } = await this.supabase
        .from('practice_sessions')
        .insert([{
          rhythm_name: data.rhythm_name,
          accuracy: data.accuracy,
          type_accuracy: data.type_accuracy,
          bpm: data.bpm,
          avg_offset_ms: data.avg_offset_ms,
          audio_url: publicUrl,
          storage_path: filePath
        }]);

      if (dbError) throw dbError;

      return { success: true, url: publicUrl };
    } catch (error) {
      console.error("[Supabase Error]", error);
      return { success: false, error };
    }
  }

  async getRhythms() {
    const { data, error } = await this.supabase
      .from('course_rhythms')
      .select('*')
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error("Erro ao buscar ritmos:", error);
      return null;
    }
    return data;
  }

  getReferenceAudioUrl(path: string) {
    if (!path) return null;
    const { data } = this.supabase
      .storage
      .from('assets-curso')
      .getPublicUrl(path);
    return data.publicUrl;
  }

  async getGlobalHistory() {
    const { data, error } = await this.supabase
      .from('practice_sessions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (error) return [];
    return data;
  }
}

export const supabaseService = new SupabaseService();
