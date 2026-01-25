import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Clock, Users, Star, Tag, Check, ArrowRight } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

interface OfferCardProps {
    course: {
        id: string;
        title: string;
        description: string;
        total_hours: number;
        sessions_count: number;
        price: number;
        points_reward: number;
        points_required: number;
    };
    offer: {
        discount_percentage: number;
        max_students: number | null;
        used_count: number;
    };
    enrolled?: boolean;
    onEnroll: (course: any, usePoints: boolean) => void;
    enrolling?: boolean;
    canRedeem?: boolean;
}

export default function OfferCard({
    course,
    offer,
    enrolled,
    onEnroll,
    enrolling,
    canRedeem
}: OfferCardProps) {
    const { t, dir } = useLanguage();
    const discountedPrice = course.price * (1 - offer.discount_percentage / 100);

    return (
        <Card className="relative border-0 shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden group bg-card">
            {/* Decorative Background Elements */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 rounded-full blur-3xl group-hover:bg-primary/20 transition-colors" />
            <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-accent/10 rounded-full blur-3xl group-hover:bg-accent/20 transition-colors" />

            {/* Offer Banner */}
            <div className={cn(
                "absolute top-4 z-10",
                dir === "rtl" ? "left-0" : "right-0"
            )}>
                <div className="flex items-center gap-2 px-4 py-2 bg-accent text-accent-foreground font-bold rounded-s-full shadow-lg transform translate-x-2 group-hover:translate-x-0 transition-transform">
                    <Tag className="w-4 h-4 animate-bounce" />
                    <span>{offer.discount_percentage}% {t.courses.off}</span>
                </div>
            </div>

            <div className="p-1">
                <div className="h-44 rounded-xl overflow-hidden relative">
                    <div className="absolute inset-0 gradient-primary opacity-20 group-hover:opacity-30 transition-opacity" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <BookOpen className="w-16 h-16 text-primary group-hover:scale-110 transition-transform duration-500" />
                    </div>
                    <div className="absolute bottom-3 left-3 right-3 flex justify-between items-center">
                        <Badge variant="secondary" className="bg-background/80 backdrop-blur-md">
                            <Star className="w-3 h-3 me-1 text-warning fill-warning" />
                            {course.points_reward} {t.common.pts}
                        </Badge>
                        {offer.max_students && (
                            <Badge variant="destructive" className="animate-pulse">
                                {offer.max_students - offer.used_count} {t.courses.spotsLeft}
                            </Badge>
                        )}
                    </div>
                </div>
            </div>

            <CardHeader className="pb-2">
                <CardTitle className="text-xl font-display font-bold group-hover:text-primary transition-colors">
                    {course.title}
                </CardTitle>
                <CardDescription className="line-clamp-2 min-h-[2.5rem]">
                    {course.description}
                </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
                <div className="flex items-center justify-between text-sm text-muted-foreground border-y border-border/50 py-3">
                    <div className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-primary" />
                        <span>{course.total_hours}h</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-primary" />
                        <span>{course.sessions_count} {t.common.sessions}</span>
                    </div>
                </div>

                <div className="flex items-end justify-between">
                    <div className="space-y-1">
                        <p className="text-sm text-muted-foreground line-through decoration-destructive/50">
                            ${course.price.toFixed(0)}
                        </p>
                        <div className="flex items-baseline gap-1">
                            <span className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent">
                                ${discountedPrice.toFixed(0)}
                            </span>
                        </div>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                        <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">Special Offer</span>
                        <div className="h-1 w-12 bg-accent rounded-full" />
                    </div>
                </div>

                <div className="space-y-3 pt-2">
                    {enrolled ? (
                        <Button className="w-full h-12 rounded-xl text-lg" disabled variant="secondary">
                            <Check className="w-5 h-5 me-2" />
                            {t.courses.enrolled}
                        </Button>
                    ) : (
                        <div className="grid grid-cols-1 gap-3">
                            <Button
                                className="w-full h-12 rounded-xl text-lg gradient-primary hover:opacity-90 shadow-lg shadow-primary/20 group/btn relative overflow-hidden"
                                onClick={() => onEnroll(course, false)}
                                disabled={enrolling}
                            >
                                <span className="relative z-10 flex items-center justify-center">
                                    {enrolling ? t.courses.enrolling : t.courses.enroll}
                                    {!enrolling && <ArrowRight className={cn("w-5 h-5 ms-2 transition-transform group-hover/btn:translate-x-1", dir === "rtl" && "rotate-180 group-hover/btn:-translate-x-1")} />}
                                </span>
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000" />
                            </Button>

                            {course.points_required > 0 && (
                                <Button
                                    variant="outline"
                                    className="w-full h-11 rounded-xl border-dashed border-2 hover:bg-accent/5"
                                    onClick={() => onEnroll(course, true)}
                                    disabled={!canRedeem || enrolling}
                                >
                                    <Star className="w-4 h-4 me-2 text-warning" />
                                    {t.courses.redeem} ({course.points_required} {t.common.pts})
                                </Button>
                            )}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
