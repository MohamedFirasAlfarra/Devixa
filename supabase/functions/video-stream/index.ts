import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const url = new URL(req.url);
        const lessonId = url.searchParams.get('lessonId');
        if (!lessonId) throw new Error('Lesson ID is required');

        // 1. Initialize Supabase Client
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // 2. Get User from JWT
        const authHeader = req.headers.get('Authorization');
        const token = authHeader
            ? authHeader.replace('Bearer ', '')
            : url.searchParams.get('token');

        if (!token) throw new Error('Unauthorized: No token provided');
        const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
        if (userError || !user) throw new Error('Unauthorized');

        // 3. Verify Enrollment & Fetch Telegram File ID
        const { data: session, error: sessionError } = await supabaseClient
            .from('course_sessions')
            .select('telegram_file_id, course_id, batches(course_id)')
            .eq('id', lessonId)
            .single();

        if (sessionError || !session?.telegram_file_id) {
            throw new Error('Lesson not found or has no Telegram video');
        }

        const courseId = session.course_id || session.batches?.course_id;

        const { data: enrollment, error: enrollError } = await supabaseClient
            .from('enrollments')
            .select('id')
            .eq('user_id', user.id)
            .eq('course_id', courseId)
            .maybeSingle();

        // Check if user is admin if not enrolled
        const { data: profile } = await supabaseClient
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        const isAdmin = profile?.role === 'admin';

        if (!enrollment && !isAdmin) {
            throw new Error('Access denied: You are not enrolled in this course.');
        }

        // 4. Fetch Telegram File URL
        const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
        if (!botToken) throw new Error('Telegram Bot Token not configured');

        const tgFileId = session.telegram_file_id;
        const getFileUrl = `https://api.telegram.org/bot${botToken}/getFile?file_id=${tgFileId}`;

        const tgResponse = await fetch(getFileUrl);
        const tgData = await tgResponse.json();

        if (!tgData.ok) {
            throw new Error(`Telegram error: ${tgData.description}`);
        }

        const filePath = tgData.result.file_path;
        const downloadUrl = `https://api.telegram.org/file/bot${botToken}/${filePath}`;

        // 5. Proxy the visual stream
        const videoResponse = await fetch(downloadUrl);

        // Return the response as a stream
        const { readable, writable } = new TransformStream();
        videoResponse.body?.pipeTo(writable);

        return new Response(readable, {
            headers: {
                ...corsHeaders,
                'Content-Type': videoResponse.headers.get('Content-Type') || 'video/mp4',
                'Content-Length': videoResponse.headers.get('Content-Length') || '',
                'Accept-Ranges': 'bytes',
            },
        });

    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
})
