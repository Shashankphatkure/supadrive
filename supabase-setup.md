# Supabase Setup Guide

## 1. Create Bucket

In your Supabase dashboard, navigate to the "Storage" section and create a new bucket named `images` or run the following SQL in the SQL editor:

```sql
-- Create a new bucket called 'images'
INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true);
```

## 2. Set Up Storage Policies

After creating the bucket, you need to set up policies to allow users to interact with files. Run the following SQL commands in the SQL editor to set up the necessary policies:

```sql
-- Allow public read access to all images
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'images');

-- Allow authenticated users to upload files
CREATE POLICY "Allow uploads for authenticated users"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'images');

-- Allow authenticated users to update their own files
CREATE POLICY "Allow updates for authenticated users"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'images');

-- Allow authenticated users to delete their own files
CREATE POLICY "Allow deletes for authenticated users"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'images');
```

## 3. Set Up Anonymous Access (Optional)

If you want to allow anonymous users to upload and manage files as well, you can use the following policies instead:

```sql
-- Allow anonymous users to upload files
CREATE POLICY "Allow public uploads"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'images');

-- Allow anyone to update files
CREATE POLICY "Allow public updates"
ON storage.objects FOR UPDATE
USING (bucket_id = 'images');

-- Allow anyone to delete files
CREATE POLICY "Allow public deletes"
ON storage.objects FOR DELETE
USING (bucket_id = 'images');
```

## 4. Database Structure (Optional)

If you want to add metadata to your files, you could create a table to store additional information:

```sql
-- Create a table for file metadata
CREATE TABLE public.file_metadata (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  storage_path TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  name TEXT NOT NULL,
  description TEXT,
  tags TEXT[]
);

-- Add RLS to the table
ALTER TABLE public.file_metadata ENABLE ROW LEVEL SECURITY;

-- Add policies
CREATE POLICY "Allow public read"
ON public.file_metadata FOR SELECT
TO anon;

CREATE POLICY "Allow authenticated users to insert"
ON public.file_metadata FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update"
ON public.file_metadata FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated users to delete"
ON public.file_metadata FOR DELETE
TO authenticated
USING (true);
```

## 5. Important Notes

1. The current implementation of the application uses the Supabase client's anonymous key, so make sure your bucket is properly secured with the appropriate policies.

2. If using in production, consider implementing user authentication and restricting upload/delete operations to authenticated users only.

3. You may want to add file size limits and restrictions on file types in your application and/or using Supabase's storage configuration.

4. The policies above allow public access for simplicity. In a production environment, you might want more restrictive policies based on user roles or ownership of files. 