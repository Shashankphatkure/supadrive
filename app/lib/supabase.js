import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function uploadImage(file, path) {
  const { data, error } = await supabase.storage
    .from('images')
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false
    });

  return { data, error };
}

export async function deleteFile(path) {
  const { error } = await supabase.storage
    .from('images')
    .remove([path]);
  
  return { error };
}

export async function listFiles(prefix) {
  const { data, error } = await supabase.storage
    .from('images')
    .list(prefix || '');

  return { data, error };
}

export async function getImageUrl(path) {
  const { data } = supabase.storage
    .from('images')
    .getPublicUrl(path);
  
  return data.publicUrl;
} 