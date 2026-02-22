import React, { useEffect, useState } from "react";
import { motion, useSpring, useMotionValue } from "framer-motion";
import { PenTool } from "lucide-react";
import { cn } from "@/lib/utils";

export const CustomCursor = () => {
    const [isVisible, setIsVisible] = useState(false);
    const [isPointer, setIsPointer] = useState(false);

    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    // Fast springs for the pen - adjusted for a balanced "medium" response
    const penX = useSpring(mouseX, { damping: 35, stiffness: 600 });
    const penY = useSpring(mouseY, { damping: 35, stiffness: 600 });

    // Use motion value for opacity to avoid re-renders just for visibility
    const opacity = useSpring(useMotionValue(0), { damping: 20, stiffness: 100 });

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            mouseX.set(e.clientX);
            mouseY.set(e.clientY);

            if (!isVisible) {
                setIsVisible(true);
                opacity.set(1);
            }

            const target = e.target as HTMLElement;
            setIsPointer(
                window.getComputedStyle(target).cursor === "pointer" ||
                target.tagName === "BUTTON" ||
                target.tagName === "A" ||
                target.closest("button") !== null ||
                target.closest("a") !== null
            );
        };

        const handleMouseLeave = () => {
            setIsVisible(false);
            opacity.set(0);
        };
        const handleMouseEnter = () => {
            setIsVisible(true);
            opacity.set(1);
        };

        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseleave", handleMouseLeave);
        window.addEventListener("mouseenter", handleMouseEnter);

        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseleave", handleMouseLeave);
            window.removeEventListener("mouseenter", handleMouseEnter);
        };
    }, [isVisible, mouseX, mouseY, opacity]);

    return (
        <div className="fixed inset-0 pointer-events-none z-[99999]">
            {/* Pen Cursor - Always in DOM but opacity controlled */}
            <motion.div
                className="absolute flex items-center justify-center p-2"
                style={{
                    x: penX,
                    y: penY,
                    scale: isPointer ? 1.4 : 1,
                    opacity: opacity,
                }}
            >
                <div className="relative -translate-y-[80%] -translate-x-0 origin-bottom-left">
                    <PenTool
                        className="w-10 h-10 text-primary"
                        style={{
                            transform: "rotate(-45deg) translate(2px, 2px)"
                        }}
                    />
                    {/* Fixed "nib" indicator - very small but visible dot for precision */}
                    <div className="absolute bottom-0 left-0 w-1.5 h-1.5 bg-accent rounded-full border border-background shadow-sm" />
                </div>
            </motion.div>
        </div>
    );
};
