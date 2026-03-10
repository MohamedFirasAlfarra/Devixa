-- FIX STORAGE BUCKET LIMITS AND POLICIES

-- 1. Ensure the bucket exists with a 2GB limit (2147483648 bytes)
-- Note: 'file_size_limit' is in bytes. 2GB = 2 * 1024 * 1024 * 1024 = 2147483648
-- We also allow common video mime types.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'course-videos', 
    'course-videos', 
    false, 
    2147483648, 
    ARRAY['video/mp4', 'video/mpeg', 'video/ogg', 'video/quicktime', 'video/webm', 'video/x-msvideo', 'video/x-flv', 'video/x-matroska']
)
ON CONFLICT (id) DO UPDATE SET 
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. Storage Policies (Confirming they are correctly set)
-- Admins can manage everything in course-videos
DROP POLICY IF EXISTS "Admins can manage course videos" ON storage.objects;
CREATE POLICY "Admins can manage course videos" 
ON storage.objects FOR ALL 
TO authenticated 
USING (bucket_id = 'course-videos' AND public.has_role(auth.uid(), 'admin'))
WITH CHECK (bucket_id = 'course-videos' AND public.has_role(auth.uid(), 'admin'));

-- Enrolled students (or admins) can read videos
DROP POLICY IF EXISTS "Enrolled students can access course videos" ON storage.objects;
CREATE POLICY "Enrolled students can access course videos" 
ON storage.objects FOR SELECT 
TO authenticated 
USING (
    bucket_id = 'course-videos' AND (
        EXISTS (
            SELECT 1 FROM public.course_sessions cs 
            JOIN public.enrollments e ON cs.course_id = e.course_id 
            WHERE cs.video_path = storage.objects.name AND e.user_id = auth.uid()
        ) 
        OR public.has_role(auth.uid(), 'admin')
    )
);

-- Notify schema reload
NOTIFY pgrst, 'reload schema';
