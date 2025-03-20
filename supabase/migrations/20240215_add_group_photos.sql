-- Add group_photo_url column to groups table
ALTER TABLE public.groups
ADD COLUMN group_photo_url text;

-- Create storage bucket for group photos if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('group-photos', 'group-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policy to allow authenticated users to upload group photos
CREATE POLICY "Group admins can upload group photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'group-photos' AND
  EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_id = CAST(SPLIT_PART(name, '/', 1) AS uuid)
    AND user_id = auth.uid()
    AND role = 'admin'
  )
);

-- Create storage policy to allow public access to group photos
CREATE POLICY "Anyone can view group photos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'group-photos');

-- Create storage policy to allow group admins to update group photos
CREATE POLICY "Group admins can update group photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'group-photos' AND
  EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_id = CAST(SPLIT_PART(name, '/', 1) AS uuid)
    AND user_id = auth.uid()
    AND role = 'admin'
  )
);

-- Create storage policy to allow group admins to delete group photos
CREATE POLICY "Group admins can delete group photos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'group-photos' AND
  EXISTS (
    SELECT 1 FROM public.group_members
    WHERE group_id = CAST(SPLIT_PART(name, '/', 1) AS uuid)
    AND user_id = auth.uid()
    AND role = 'admin'
  )
); 