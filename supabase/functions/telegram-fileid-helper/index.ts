import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const BOT_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN')

serve(async (req) => {
    try {
        // 1. Get the update from Telegram
        const update = await req.json()
        console.log('Received update:', JSON.stringify(update))

        // 2. Check if it's a message with a video or document (video)
        const message = update.message
        if (message) {
            const video = message.video || (message.document && message.document.mime_type?.startsWith('video/') ? message.document : null)

            if (video) {
                const chatId = message.chat.id
                const fileId = video.file_id

                // 3. Prepare the reply
                const replyText = `VIDEO FILE ID:\n\`${fileId}\``

                // 4. Send the reply back to Telegram
                await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        chat_id: chatId,
                        text: replyText,
                        parse_mode: 'Markdown'
                    })
                })
            }
        }

        return new Response(JSON.stringify({ ok: true }), {
            headers: { 'Content-Type': 'application/json' },
            status: 200,
        })
    } catch (error) {
        console.error('Error handling Telegram update:', error)
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { 'Content-Type': 'application/json' },
            status: 400,
        })
    }
})
