# Check Current Bucket Limits
SELECT id, name, file_size_limit, allowed_mime_types FROM storage.buckets WHERE id = 'course-videos';
