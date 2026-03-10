import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, range',
    'Access-Control-Expose-Headers': 'content-range, content-length, accept-ranges',
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
        const { data: roleData } = await supabaseClient
            .from('user_roles')
            .select('role')
            .eq('user_id', user.id)
            .eq('role', 'admin')
            .maybeSingle();

        const isAdmin = !!roleData;

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

        // 5. Proxy the visual stream with Range support
        const range = req.headers.get('Range');
        console.log(`[STREAM] Starting stream for lesson: ${lessonId}`, { range });

        const fetchOptions: RequestInit = {
            method: 'GET',
            redirect: 'follow', // Explicitly follow redirects for Telegram CDNs
        };

        if (range) {
            fetchOptions.headers = { 'Range': range };
        }

        const videoResponse = await fetch(downloadUrl, fetchOptions);

        if (!videoResponse.ok && videoResponse.status !== 206) {
            const errorText = await videoResponse.text();
            console.error(`[STREAM] Telegram fetch failed: ${videoResponse.status}`, errorText);
            throw new Error(`Failed to fetch video from storage: ${videoResponse.status}`);
        }

        // Prepare response headers
        const responseHeaders = new Headers(corsHeaders);

        // Force video/mp4 if Telegram doesn't provide a specific video type
        const tgContentType = videoResponse.headers.get('Content-Type');
        const contentType = (tgContentType && tgContentType.startsWith('video/')) ? tgContentType : 'video/mp4';

        const contentLength = videoResponse.headers.get('Content-Length');
        const contentRange = videoResponse.headers.get('Content-Range');

        responseHeaders.set('Content-Type', contentType);
        responseHeaders.set('Accept-Ranges', 'bytes');
        responseHeaders.set('Content-Disposition', 'inline');

        if (contentLength) responseHeaders.set('Content-Length', contentLength);
        if (contentRange) responseHeaders.set('Content-Range', contentRange);

        console.log(`[STREAM] Proxying response: ${videoResponse.status}`, {
            contentType,
            contentRange,
            contentLength
        });

        return new Response(videoResponse.body, {
            status: videoResponse.status,
            headers: responseHeaders,
        });

    } catch (error: any) {
        console.error(`[ERROR] ${error.message}`);

        let status = 400;
        if (error.message.includes('Unauthorized')) status = 401;
        if (error.message.includes('Access denied')) status = 403;
        if (error.message.includes('not found')) status = 404;
        if (error.message.includes('Telegram error')) status = 502; // Bad Gateway from Telegram

        return new Response(JSON.stringify({ error: error.message }), {
            status,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
})
