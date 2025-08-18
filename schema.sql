-- This schema is designed for PostgreSQL and Supabase.

-- 1. Enable the required pg_graphql extension
-- This is usually enabled by default in Supabase projects.
-- create extension if not exists pg_graphql with schema graphql;

-- 2. Create the users table to store subscription and profile info.
-- This table will be populated by a trigger on the auth.users table.
CREATE TABLE users (
    id TEXT PRIMARY KEY, -- This will be the Clerk User ID
    email TEXT,
    stripe_customer_id TEXT UNIQUE,
    stripe_subscription_id TEXT UNIQUE,
    stripe_price_id TEXT,
    stripe_current_period_end TIMESTAMP WITH TIME ZONE
);

-- 3. Create the documents table to store metadata about uploaded PDFs.
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_key TEXT NOT NULL UNIQUE, -- The key/path to the file in Supabase Storage
    upload_status TEXT NOT NULL DEFAULT 'PENDING', -- Can be PENDING, PROCESSING, SUCCESS, FAILED
    page_count INT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Create a function to automatically insert a new user into our public.users table
-- when a new user signs up via Clerk (and is added to auth.users).
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert a new row into public.users, taking the id and email from the new auth.users record.
  INSERT INTO public.users (id, email)
  VALUES (new.id, new.email_addresses->0->>'email_address');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Create a trigger to call the handle_new_user function whenever a new user is created.
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 6. Set up Row Level Security (RLS) for the tables.
-- This is crucial for security in Supabase.

-- Enable RLS for the tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Create policies for 'users' table
-- Users can only see their own user record.
CREATE POLICY "Allow individual user access to their own record"
ON public.users
FOR SELECT
USING (auth.uid()::text = id);

-- Users can update their own record.
CREATE POLICY "Allow individual user to update their own record"
ON public.users
FOR UPDATE
USING (auth.uid()::text = id);

-- Create policies for 'documents' table
-- Users can only see their own documents.
CREATE POLICY "Allow individual user access to their own documents"
ON public.documents
FOR SELECT
USING (auth.uid()::text = user_id);

-- Users can insert new documents for themselves.
CREATE POLICY "Allow individual user to insert their own documents"
ON public.documents
FOR INSERT
WITH CHECK (auth.uid()::text = user_id);

-- Users can delete their own documents.
CREATE POLICY "Allow individual user to delete their own documents"
ON public.documents
FOR DELETE
USING (auth.uid()::text = user_id);

-- 7. Set up Supabase Storage policies.
-- These policies must be set in the Supabase Dashboard under Storage > Policies.
-- This SQL is for reference.

-- Allow users to upload files into a folder named after their user_id
-- CREATE POLICY "Allow individual user uploads"
-- ON storage.objects FOR INSERT
-- WITH CHECK ( bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text );

-- Allow users to view their own files
-- CREATE POLICY "Allow individual user to view their own files"
-- ON storage.objects FOR SELECT
-- USING ( bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text );

-- Allow users to delete their own files
-- CREATE POLICY "Allow individual user to delete their own files"
-- ON storage.objects FOR DELETE
-- USING ( bucket_id = 'documents' AND (storage.foldername(name))[1] = auth.uid()::text );
