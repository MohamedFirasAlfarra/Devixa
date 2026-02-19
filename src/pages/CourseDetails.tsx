import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
    BookOpen, Clock, Users, Star, CheckCircle2,
    Wallet, CreditCard, Send, ShieldCheck,
    ChevronRight, ChevronLeft, Loader2, Info, Award
} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import CommentSection from "@/components/courses/CommentSection";
import CountdownTimer from "@/components/common/CountdownTimer";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { Tables } from "@/integrations/supabase/types";

type Course = Tables<"courses">;
type Offer = Tables<"offers">;

export default function CourseDetails() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user, profile, refreshProfile } = useAuth();
    const { t, dir, language } = useLanguage();
    const { toast } = useToast();

    const [course, setCourse] = useState<Course | null>(null);
    const [offer, setOffer] = useState<Offer | null>(null);
    const [loading, setLoading] = useState(true);
    const [enrolling, setEnrolling] = useState(false);
    const [paymentModalOpen, setPaymentModalOpen] = useState(false);
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("shamiCash");

    useEffect(() => {
        if (id) {
            fetchCourseData();
        }
    }, [id]);

    const fetchCourseData = async () => {
        try {
            setLoading(true);
            const { data: courseData, error: courseError } = await supabase
                .from("courses")
                .select("*")
                .eq("id", id)
                .single();

            if (courseError) throw courseError;
            setCourse(courseData);

            const { data: offerData } = await supabase
                .from("offers")
                .select("*")
                .eq("course_id", id)
                .eq("is_active", true)
                .maybeSingle();

            setOffer(offerData);
        } catch (error) {
            console.error("Error fetching course details:", error);
            toast({
                title: t.common.error,
                description: "Could not load course details",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleEnroll = async (paymentMethod: string) => {
        if (!user || !course) return;

        setEnrolling(true);
        try {
            const { data: batches } = await supabase
                .from("batches")
                .select("*")
                .eq("course_id", course.id)
                .eq("is_active", true)
                .order("created_at", { ascending: false })
                .limit(1);

            const batchId = batches?.[0]?.id || null;

            const { error: enrollError } = await supabase.from("enrollments").insert({
                user_id: user.id,
                course_id: course.id,
                batch_id: batchId,
                payment_method: paymentMethod,
            });

            if (enrollError) throw enrollError;

            toast({
                title: t.courses.enrollSuccess,
                description: t.courses.enrollSuccessDesc.replace("{course}", course.title),
            });

            setPaymentModalOpen(false);
        } catch (error: any) {
            toast({
                title: t.courses.enrollFailed,
                description: error.message || "An error occurred",
                variant: "destructive",
            });
        } finally {
            setEnrolling(false);
        }
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
                    <Loader2 className="w-12 h-12 animate-spin text-primary" />
                    <p className="text-muted-foreground animate-pulse font-medium">{t.common.loading}</p>
                </div>
            </DashboardLayout>
        );
    }

    if (!course) {
        return (
            <DashboardLayout>
                <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6 text-center">
                    <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center">
                        <Info className="w-10 h-10 text-destructive" />
                    </div>
                    <h1 className="text-3xl font-display font-black">Course Not Found</h1>
                    <Button onClick={() => navigate("/courses")} variant="outline" className="rounded-xl px-8">
                        Back to Courses
                    </Button>
                </div>
            </DashboardLayout>
        );
    }

    const originalPrice = Number(course.price || 0);
    const discountedPrice = offer
        ? originalPrice * (1 - offer.discount_percentage / 100)
        : originalPrice;

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                {/* Navigation Breadcrumb */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <button onClick={() => navigate("/courses")} className="hover:text-primary transition-colors">
                        {t.courses.title}
                    </button>
                    {dir === "rtl" ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    <span className="text-foreground font-medium truncate max-w-[200px]">{course.title}</span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content Area */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Hero Image Section */}
                        <div className="relative h-64 md:h-96 rounded-[2.5rem] overflow-hidden group shadow-2xl border border-border/50">
                            {course.image_url ? (
                                <img
                                    src={course.image_url}
                                    alt={course.title}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                />
                            ) : (
                                <div className="w-full h-full gradient-hero flex items-center justify-center">
                                    <BookOpen className="w-24 h-24 text-white/30" />
                                </div>
                            )}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                            <div className="absolute bottom-8 left-8 right-8 space-y-4">
                                {offer && (
                                    <Badge className="bg-destructive text-white border-none py-1.5 px-4 text-sm font-bold shadow-glow-destructive">
                                        {offer.discount_percentage}% {t.courses.off}
                                    </Badge>
                                )}
                                <h1 className="text-3xl md:text-5xl font-display font-black text-white leading-tight drop-shadow-lg">
                                    {course.title}
                                </h1>
                            </div>
                        </div>

                        {/* Quick Stats Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="p-6 rounded-3xl bg-card border shadow-sm hover:shadow-md transition-all text-center group">
                                <Clock className="w-6 h-6 mx-auto mb-3 text-primary group-hover:scale-110 transition-transform" />
                                <div className="text-xl font-black">{course.total_hours}</div>
                                <div className="text-xs uppercase font-bold tracking-widest text-muted-foreground">{t.common.hours}</div>
                            </div>
                            <div className="p-6 rounded-3xl bg-card border shadow-sm hover:shadow-md transition-all text-center group">
                                <Users className="w-6 h-6 mx-auto mb-3 text-accent group-hover:scale-110 transition-transform" />
                                <div className="text-xl font-black">{course.sessions_count}</div>
                                <div className="text-xs uppercase font-bold tracking-widest text-muted-foreground">{t.common.sessions}</div>
                            </div>
                            <div className="p-6 rounded-3xl bg-card border shadow-sm hover:shadow-md transition-all text-center group">
                                <Star className="w-6 h-6 mx-auto mb-3 text-yellow-500 group-hover:scale-110 transition-transform" />
                                <div className="text-xl font-black">+{course.points_reward}</div>
                                <div className="text-xs uppercase font-bold tracking-widest text-muted-foreground">{t.common.pts}</div>
                            </div>
                            <div className="p-6 rounded-3xl bg-card border shadow-sm hover:shadow-md transition-all text-center group">
                                <ShieldCheck className="w-6 h-6 mx-auto mb-3 text-green-500 group-hover:scale-110 transition-transform" />
                                <div className="text-xl font-black">Cert.</div>
                                <div className="text-xs uppercase font-bold tracking-widest text-muted-foreground">Certified</div>
                            </div>
                        </div>

                        {/* Description */}
                        <div className="space-y-6 bg-card border p-8 md:p-10 rounded-[2.5rem] shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                    <CheckCircle2 className="w-6 h-6" />
                                </div>
                                <h2 className="text-2xl font-display font-black">{t.adminCourses.description}</h2>
                            </div>
                            <p className="text-lg text-muted-foreground leading-relaxed whitespace-pre-wrap">
                                {course.description || "Course description will be updated soon."}
                            </p>
                        </div>

                        {/* Comments Section */}
                        <div className="bg-card border p-8 md:p-10 rounded-[2.5rem] shadow-sm">
                            <CommentSection courseId={course.id} />
                        </div>
                    </div>

                    {/* Pricing & CTA Sidebar */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-8 space-y-6">
                            <div className="p-8 rounded-[2.5rem] border bg-card shadow-2xl space-y-8 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16" />

                                <div className="space-y-2 relative z-10">
                                    <div className="text-sm uppercase tracking-widest font-black text-muted-foreground opacity-60">
                                        {t.adminCourses.price}
                                    </div>
                                    <div className="flex items-baseline gap-3">
                                        <div className="text-5xl font-display font-black text-foreground">
                                            ${discountedPrice.toFixed(0)}
                                        </div>
                                        {offer && (
                                            <div className="text-xl font-bold text-muted-foreground line-through opacity-50">
                                                ${originalPrice}
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-2xl font-bold text-primary">
                                        {Number(course.price_syp || 0).toLocaleString()} ل.س
                                    </div>
                                </div>

                                {offer?.expires_at && (
                                    <div className="p-6 rounded-3xl bg-destructive/5 border border-destructive/10 space-y-3">
                                        <div className="text-xs font-black uppercase text-destructive tracking-widest animate-pulse">
                                            {t.courses.endsIn}
                                        </div>
                                        <CountdownTimer expiryDate={offer.expires_at} />
                                    </div>
                                )}

                                <div className="space-y-4 pt-4">
                                    <Button
                                        onClick={() => setPaymentModalOpen(true)}
                                        className="w-full h-16 rounded-2xl text-xl font-display font-black gradient-primary shadow-glow hover:scale-[1.02] active:scale-[0.98] transition-all"
                                    >
                                        {t.courses.enroll}
                                    </Button>

                                    <div className="flex flex-col gap-3">
                                        <BenefitItem icon={ShieldCheck} text="Lifetime Access" />
                                        <BenefitItem icon={Award} text="Official Certificate" />
                                        <BenefitItem icon={BookOpen} text="Downloadable Materials" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Payment Selection Modal */}
            <Dialog open={paymentModalOpen} onOpenChange={setPaymentModalOpen}>
                <DialogContent className="sm:max-w-md rounded-[2rem]">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-display font-black">{t.courses.selectPaymentMethod}</DialogTitle>
                        <DialogDescription className="text-lg">
                            {course.title}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-6">
                        <RadioGroup
                            defaultValue="shamiCash"
                            onValueChange={setSelectedPaymentMethod}
                            className="grid gap-4"
                        >
                            <PaymentMethodItem
                                id="shamiCash"
                                icon={Wallet}
                                label={t.courses.paymentMethods.shamiCash}
                            />
                            <PaymentMethodItem
                                id="syriatelCash"
                                icon={CreditCard}
                                label={t.courses.paymentMethods.syriatelCash}
                            />
                            <PaymentMethodItem
                                id="alHaram"
                                icon={Send}
                                label={t.courses.paymentMethods.alHaram}
                            />
                        </RadioGroup>
                    </div>
                    <DialogFooter className="gap-3">
                        <Button
                            variant="outline"
                            onClick={() => setPaymentModalOpen(false)}
                            className="rounded-xl h-12 px-6"
                        >
                            {t.common.cancel}
                        </Button>
                        <Button
                            onClick={() => handleEnroll(selectedPaymentMethod)}
                            disabled={enrolling}
                            className="gradient-primary rounded-xl h-12 px-8 font-bold"
                        >
                            {enrolling ? <Loader2 className="animate-spin" /> : t.courses.enroll}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </DashboardLayout>
    );
}

function BenefitItem({ icon: Icon, text }: { icon: any, text: string }) {
    return (
        <div className="flex items-center gap-3 text-sm text-muted-foreground font-medium">
            <div className="w-6 h-6 rounded-full bg-green-500/10 flex items-center justify-center text-green-500 shrink-0">
                <Icon className="w-3.5 h-3.5" />
            </div>
            <span>{text}</span>
        </div>
    );
}

function PaymentMethodItem({ id, icon: Icon, label }: { id: string, icon: any, label: string }) {
    return (
        <div className="flex items-center space-x-3 space-x-reverse border-2 p-5 rounded-2xl hover:bg-muted/50 hover:border-primary/30 transition-all cursor-pointer group">
            <RadioGroupItem value={id} id={id} className="w-5 h-5" />
            <Label
                htmlFor={id}
                className="flex flex-1 items-center gap-4 cursor-pointer"
            >
                <div className="p-3 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <Icon className="w-6 h-6" />
                </div>
                <span className="font-bold text-lg">{label}</span>
            </Label>
        </div>
    );
}
