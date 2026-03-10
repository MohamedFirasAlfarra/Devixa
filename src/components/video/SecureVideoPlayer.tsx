import React, { useEffect, useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Loader2, ShieldAlert, Monitor } from "lucide-react";

interface SecureVideoPlayerProps {
    videoUrl: string;
    title: string;
    onCompleted?: () => void;
}

const SecureVideoPlayer: React.FC<SecureVideoPlayerProps> = ({ videoUrl, title, onCompleted }) => {
    const { user, profile } = useAuth();
    const { dir } = useLanguage();
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isCheckingUrl, setIsCheckingUrl] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Dynamic Watermark state
    const [watermarkPos, setWatermarkPos] = useState({ top: "10%", left: "10%" });

    useEffect(() => {
        // Only check video-stream URLs for detailed errors
        if (!videoUrl || !videoUrl.includes("video-stream")) return;

        const checkUrl = async () => {
            setIsCheckingUrl(true);
            try {
                // We use a small range request to check if the server returns a video or an error JSON
                const response = await fetch(videoUrl, {
                    method: 'GET',
                    headers: { 'Range': 'bytes=0-1' }
                });

                if (!response.ok) {
                    const contentType = response.headers.get('content-type');
                    if (contentType && contentType.includes('application/json')) {
                        const data = await response.json();
                        setError(`Server Error: ${data.error || "Unknown stream error"}`);
                    } else {
                        setError(`HTTP Error ${response.status}: Failed to load stream.`);
                    }
                }
            } catch (err) {
                console.error("Link check failed:", err);
            } finally {
                setIsCheckingUrl(false);
            }
        };

        checkUrl();
    }, [videoUrl]);

    useEffect(() => {
        // Move watermark periodically to prevent static removal/masking
        const interval = setInterval(() => {
            const randomTop = Math.floor(Math.random() * 80) + 10;
            const randomLeft = Math.floor(Math.random() * 70) + 10;
            setWatermarkPos({ top: `${randomTop}%`, left: `${randomLeft}%` });
        }, 10000);

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const handleContextMenu = (e: MouseEvent) => {
            e.preventDefault();
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            // Block Common Shortcuts: F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U, PrintScreen, Ctrl+S
            if (
                e.key === "F12" ||
                (e.ctrlKey && e.shiftKey && (e.key === "I" || e.key === "J" || e.key === "C")) ||
                (e.ctrlKey && e.key === "u") ||
                (e.ctrlKey && e.key === "s") ||
                e.key === "PrintScreen"
            ) {
                e.preventDefault();
                setError("Security Violation Detected: Access Restricted.");
            }
        };

        document.addEventListener("contextmenu", handleContextMenu);
        document.addEventListener("keydown", handleKeyDown);

        return () => {
            document.removeEventListener("contextmenu", handleContextMenu);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, []);

    const getSecureEmbedUrl = (url: string) => {
        if (!url) return "";
        let finalUrl = url;

        // Telegram Support
        if (url.includes("t.me") && !url.includes("?embed=1")) {
            finalUrl = `${url}?embed=1`;
            return finalUrl;
        }

        // YouTube Support (matches youtube.com/watch?v=, youtu.be/, youtube.com/embed/)
        const ytMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
        if (ytMatch && ytMatch[1]) {
            // Adds modestbranding and rel=0 to hide related videos at the end
            finalUrl = `https://www.youtube.com/embed/${ytMatch[1]}?modestbranding=1&rel=0`;
            return finalUrl;
        }

        // Vimeo Support
        const vimeoMatch = url.match(/(?:vimeo\.com\/)(\d+)/i);
        if (vimeoMatch && vimeoMatch[1]) {
            finalUrl = `https://player.vimeo.com/video/${vimeoMatch[1]}`;
            return finalUrl;
        }

        return finalUrl;
    };

    if (error) {
        return (
            <div className="aspect-video bg-destructive/10 flex flex-col items-center justify-center p-6 text-center rounded-xl border border-destructive/20 gap-4">
                <ShieldAlert className="w-16 h-16 text-destructive mb-2" />
                <h3 className="text-xl font-bold text-destructive">{error}</h3>
                <button
                    onClick={() => window.location.reload()}
                    className="px-4 py-2 bg-destructive text-white rounded-lg hover:bg-destructive/90"
                >
                    Reload Player
                </button>
            </div>
        );
    }

    const isDirectVideo = videoUrl.includes("supabase.co/storage") || videoUrl.endsWith(".mp4") || videoUrl.endsWith(".webm") || videoUrl.endsWith(".m4v") || videoUrl.includes("token=");

    return (
        <div
            ref={containerRef}
            className="relative aspect-video bg-black rounded-xl overflow-hidden shadow-2xl group select-none"
            onContextMenu={(e) => e.preventDefault()}
        >
            {/* Loading Overlay */}
            {(isLoading || isCheckingUrl) && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80">
                    <div className="flex flex-col items-center gap-2">
                        <Loader2 className="w-10 h-10 animate-spin text-accent" />
                        <p className="text-white text-xs font-bold animate-pulse">
                            {dir === 'rtl' ? "جاري التحقق من الرابط..." : "Checking Stream..."}
                        </p>
                    </div>
                </div>
            )}

            {/* Custom UI Header */}
            <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/80 to-transparent z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex items-center gap-2 text-white/90">
                    <Monitor className="w-5 h-5 text-accent" />
                    <span className="font-bold truncate">{title}</span>
                </div>
            </div>

            {/* Dynamic Watermark */}
            <div
                className="absolute z-30 pointer-events-none transition-all duration-1000 ease-in-out"
                style={{
                    top: watermarkPos.top,
                    left: watermarkPos.left,
                    opacity: 0.15
                }}
            >
                <div className="bg-black/20 backdrop-blur-[2px] p-2 rounded text-[10px] md:text-sm font-mono text-white whitespace-nowrap border border-white/10 rotate-[-15deg]">
                    <p className="font-bold">{profile?.full_name || user?.email}</p>
                    <p>{user?.email}</p>
                    <p>ID: {user?.id?.slice(0, 8)}</p>
                    <p className="text-[8px] opacity-50">{new Date().toLocaleString()}</p>
                </div>
            </div>

            {/* Content Container */}
            <div className="w-full h-full relative">
                {isDirectVideo ? (
                    <video
                        src={videoUrl}
                        className="w-full h-full object-contain"
                        controls
                        controlsList="nodownload noremoteplayback"
                        disablePictureInPicture
                        onContextMenu={(e) => e.preventDefault()}
                        onLoadedData={() => setIsLoading(false)}
                        onError={(e) => {
                            const videoElement = e.currentTarget;
                            const videoError = videoElement.error;
                            console.error("Video playback error details:", {
                                code: videoError?.code,
                                message: videoError?.message,
                                src: videoElement.src,
                                event: e
                            });
                            setError(`خطأ في تشغيل الفيديو (Error Code: ${videoError?.code || 'Unknown'}). يرجى التأكد من اتصالك بالإنترنت.`);
                            setIsLoading(false);
                        }}
                        autoPlay={false}
                    />
                ) : (
                    <iframe
                        src={getSecureEmbedUrl(videoUrl)}
                        className="w-full h-full border-0 pointer-events-auto"
                        allowFullScreen
                        allow="autoplay; encrypted-media"
                        onLoad={() => setIsLoading(false)}
                        onError={() => {
                            setError("Error loading iframe. Access might be restricted.");
                            setIsLoading(false);
                        }}
                    ></iframe>
                )}
            </div>
        </div>
    );
};

export default SecureVideoPlayer;
