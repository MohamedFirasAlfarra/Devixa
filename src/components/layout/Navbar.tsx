import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import ThemeToggle from "@/components/ThemeToggle";
import {
    BookOpen, ChevronRight, Menu, X, Tag, Home, LogIn, LayoutDashboard,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Logo from "@/components/common/Logo";

export default function Navbar() {
    const { user, isAdmin } = useAuth();
    const { t, language } = useLanguage();

    const [isScrolled, setIsScrolled] = React.useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

    React.useEffect(() => {
        const handleScroll = () => setIsScrolled(window.scrollY > 50);
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <nav
            className={cn(
                "fixed top-0 left-0 right-0 mx-auto z-50 transition-all duration-500",
                "w-full bg-background/80 backdrop-blur-xl",
                isScrolled
                    ? "py-1 bg-background/80 backdrop-blur-xl shadow-xl"
                    : "py-1 glass-gooey"
            )}
        >
            <div className="container mx-auto px-6 flex items-center justify-between">
                <div className="flex items-center">
                    <Link to="/">
                        <Logo imageClassName="h-28 md:h-24 lg:h-40" isNavbar />
                    </Link>
                </div>

                {/* Desktop Links */}
                <div className="hidden md:flex items-center gap-8">
                    <Link to="/" className="text-foreground/80 hover:text-primary font-medium transition-colors">
                        {language === "ar" ? "الرئيسية" : "Home"}
                    </Link>
                    <Link to="/courses" className="text-foreground/80 hover:text-primary font-medium transition-colors">
                        {language === "ar" ? "الدورات" : "Courses"}
                    </Link>
                    <Link to="/offers" className="text-foreground/80 hover:text-primary font-medium transition-colors">
                        {language === "ar" ? "العروض" : "Offers"}
                    </Link>
                </div>

                <div className="flex items-center gap-2 md:gap-4">
                    <div className="flex items-center gap-2">
                        <ThemeToggle />
                        <LanguageSwitcher />
                    </div>

                    <div className="hidden xs:block">
                        {user ? (
                            <Link to={isAdmin ? "/admin" : "/dashboard"}>
                                <Button variant="default" className="rounded-full px-4 md:px-6 shadow-glow gradient-primary border-none">
                                    {t.landing.goToDashboard}
                                </Button>
                            </Link>
                        ) : (
                            <Link to="/auth">
                                <Button variant="default" className="rounded-full px-4 md:px-6 shadow-glow gradient-primary border-none">
                                    {t.common.signIn}
                                </Button>
                            </Link>
                        )}
                    </div>

                    {/* Mobile Toggle */}
                    <button
                        className="md:hidden p-2 text-foreground hover:bg-accent/10 rounded-xl transition-colors"
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    >
                        {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu Backdrop */}
            <div
                className={cn(
                    "fixed inset-0 bg-background/40 backdrop-blur-md z-[55] md:hidden transition-all duration-500",
                    mobileMenuOpen ? "opacity-100 visible" : "opacity-0 invisible"
                )}
                onClick={() => setMobileMenuOpen(false)}
            />

            {/* Mobile Menu Side Drawer */}
            <div
                className={cn(
                    "fixed inset-y-0 z-[60] w-[85%] max-w-xs bg-card/98 backdrop-blur-2xl border-none shadow-[0_0_50px_rgba(0,0,0,0.3)] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] md:hidden flex flex-col p-8 pt-12 overflow-hidden",
                    language === "ar" ? "right-0" : "left-0",
                    mobileMenuOpen
                        ? "translate-x-0"
                        : language === "ar" ? "translate-x-full" : "-translate-x-full"
                )}
            >
                {/* Decorative Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
                <div className="absolute -top-12 -right-12 w-40 h-40 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-accent/10 rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10 flex flex-col h-full">
                    {/* Drawer Header */}
                    <div className="flex items-center justify-between mb-12">
                        <Logo imageClassName="h-14" isNavbar />
                        <button
                            onClick={() => setMobileMenuOpen(false)}
                            className="p-3 rounded-2xl bg-accent/5 hover:bg-accent/10 transition-colors active:scale-95"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="flex flex-col gap-4">
                        {/* Home */}
                        <Link
                            to="/"
                            onClick={() => setMobileMenuOpen(false)}
                            className={cn(
                                "group text-xl font-display font-black flex items-center gap-4 hover:text-primary transition-all p-4 rounded-2xl hover:bg-primary/5",
                                mobileMenuOpen ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0",
                                "delay-[100ms] duration-500"
                            )}
                        >
                            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors shadow-sm">
                                <Home className="w-6 h-6" />
                            </div>
                            <span className="flex-1 text-start">{language === "ar" ? "الرئيسية" : "Home"}</span>
                            <ChevronRight className={cn("w-5 h-5 opacity-20 group-hover:opacity-100 transition-opacity", language === "ar" && "rotate-180")} />
                        </Link>

                        {/* Courses */}
                        <Link
                            to="/courses"
                            onClick={() => setMobileMenuOpen(false)}
                            className={cn(
                                "group text-xl font-display font-black flex items-center gap-4 hover:text-primary transition-all p-4 rounded-2xl hover:bg-accent/5",
                                mobileMenuOpen ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0",
                                "delay-[200ms] duration-500"
                            )}
                        >
                            <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center text-accent group-hover:bg-accent group-hover:text-accent-foreground transition-colors shadow-sm">
                                <BookOpen className="w-6 h-6" />
                            </div>
                            <span className="flex-1 text-start">{language === "ar" ? "الدورات" : "Courses"}</span>
                            <ChevronRight className={cn("w-5 h-5 opacity-20 group-hover:opacity-100 transition-opacity", language === "ar" && "rotate-180")} />
                        </Link>

                        {/* Offers */}
                        <Link
                            to="/offers"
                            onClick={() => setMobileMenuOpen(false)}
                            className={cn(
                                "group text-xl font-display font-black flex items-center gap-4 hover:text-primary transition-all p-4 rounded-2xl hover:bg-destructive/5",
                                mobileMenuOpen ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0",
                                "delay-[300ms] duration-500"
                            )}
                        >
                            <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center text-destructive group-hover:bg-destructive group-hover:text-destructive-foreground transition-colors shadow-sm">
                                <Tag className="w-6 h-6" />
                            </div>
                            <span className="flex-1 text-start">{language === "ar" ? "العروض" : "Offers"}</span>
                            <ChevronRight className={cn("w-5 h-5 opacity-20 group-hover:opacity-100 transition-opacity", language === "ar" && "rotate-180")} />
                        </Link>

                        {/* Auth Button */}
                        <div className={cn(
                            "mt-6 pt-8 border-t border-border/40 transition-all duration-700",
                            mobileMenuOpen ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0",
                            "delay-[400ms]"
                        )}>
                            {user ? (
                                <Link to={isAdmin ? "/admin" : "/dashboard"} onClick={() => setMobileMenuOpen(false)}>
                                    <Button className="w-full rounded-2xl h-16 text-xl font-display font-black gradient-primary shadow-glow hover:scale-[1.02] active:scale-[0.98] transition-all gap-2">
                                        <LayoutDashboard className="w-6 h-6" />
                                        {t.landing.goToDashboard}
                                    </Button>
                                </Link>
                            ) : (
                                <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                                    <Button className="w-full rounded-2xl h-16 text-xl font-display font-black gradient-primary shadow-glow hover:scale-[1.02] active:scale-[0.98] transition-all gap-2">
                                        <LogIn className="w-6 h-6" />
                                        {t.common.signIn}
                                    </Button>
                                </Link>
                            )}
                        </div>
                    </div>

                    {/* Footer copyright in drawer */}
                    <div className={cn(
                        "mt-auto pt-8 flex flex-col items-center gap-4 transition-all duration-700 delay-[500ms]",
                        mobileMenuOpen ? "opacity-100 scale-100" : "opacity-0 scale-90"
                    )}>
                        <div className="text-muted-foreground text-sm font-bold opacity-30 flex items-center gap-2">
                            <div className="w-8 h-px bg-current" />
                            <span>© {new Date().getFullYear()} {t.common.brandName}</span>
                            <div className="w-8 h-px bg-current" />
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
}
