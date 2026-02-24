import React, { useEffect, useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, ShieldAlert, Monitor } from "lucide-react";

interface SecureVideoPlayerProps {
    videoUrl: string;
    title: string;
    onCompleted?: () => void;
}

const SecureVideoPlayer: React.FC<SecureVideoPlayerProps> = ({ videoUrl, title, onCompleted }) => {
    const { user, profile } = useAuth();
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Dynamic Watermark state
    const [watermarkPos, setWatermarkPos] = useState({ top: "10%", left: "10%" });

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
        if (url.includes("t.me") && !url.includes("?embed=1")) {
            finalUrl = `${url}?embed=1`;
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
            {isLoading && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80">
                    <Loader2 className="w-10 h-10 animate-spin text-accent" />
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
                        autoPlay={false}
                    />
                ) : (
                    <iframe
                        src={getSecureEmbedUrl(videoUrl)}
                        className="w-full h-full border-0 pointer-events-auto"
                        allowFullScreen
                        allow="autoplay; encrypted-media"
                        onLoad={() => setIsLoading(false)}
                    ></iframe>
                )}
            </div>
        </div>
    );
};

export default SecureVideoPlayer;
