import React from 'react';
import {
    SiReact,
    SiTypescript,
    SiJavascript,
    SiHtml5,
    SiCss,
    SiTailwindcss,
    SiNodedotjs,
    SiMysql
} from "react-icons/si";
import LogoLoop from '../LogoLoop';

const TechLogoStrip: React.FC = () => {
    const techLogos = [
        { node: <SiReact title="React" />, title: "React" },
        { node: <SiTypescript title="TypeScript" />, title: "TypeScript" },
        { node: <SiJavascript title="JavaScript" />, title: "JavaScript" },
        { node: <SiHtml5 title="HTML5" />, title: "HTML5" },
        { node: <SiCss title="CSS3" />, title: "CSS3" },
        { node: <SiTailwindcss title="TailwindCSS" />, title: "TailwindCSS" },
        { node: <SiNodedotjs title="NodeJS" />, title: "NodeJS" },
        { node: <SiMysql title="MySQL" />, title: "MySQL" }
    ];

    return (
        <div className="w-full bg-background border-y border-border/40 py-10 md:py-16 overflow-hidden">
            <div className="container mx-auto px-6 mb-8">
                <h3 className="text-center text-muted-foreground font-medium uppercase tracking-[0.2em] text-xs md:text-sm">
                    Technologies We Teach
                </h3>
            </div>
            <LogoLoop
                logos={techLogos}
                speed={40}
                direction="left"
                logoHeight={48}
                gap={80}
                hoverSpeed={20}
                scaleOnHover
                fadeOut
            />
        </div>
    );
};

export default TechLogoStrip;
