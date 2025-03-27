import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function uploadImage(file, path) {
  // Make sure the path exists by checking directories
  if (path.includes('/')) {
    // This is a file inside a folder structure
    const pathParts = path.split('/');
    // Remove the filename from the path
    const dirPath = pathParts.slice(0, -1).join('/');
    
    // Create folder placeholder if it doesn't exist
    try {
      // Check if the directory exists by listing files
      const { data: existingFiles } = await supabase.storage
        .from('images')
        .list(dirPath);
      
      // If directory doesn't exist or we can't check, create a placeholder file
      if (!existingFiles || existingFiles.error) {
        // Create a placeholder .keep file to ensure folder exists
        await supabase.storage
          .from('images')
          .upload(`${dirPath}/.keep`, new Blob(['']));
      }
    } catch (error) {
      // Ignore errors - if folder already exists, this will fail but that's ok
      console.log('Ensuring directory exists:', dirPath);
    }
  }

  // Upload the actual file
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