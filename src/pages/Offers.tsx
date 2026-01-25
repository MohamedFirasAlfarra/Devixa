import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/layout/DashboardLayout";
import OfferCard from "@/components/offers/OfferCard";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Course {
    id: string;
    title: string;
    description: string;
    total_hours: number;
    sessions_count: number;
    price: number;
    points_reward: number;
    points_required: number;
}

interface Offer {
    id: string;
    course_id: string;
    discount_percentage: number;
    max_students: number | null;
    used_count: number;
    courses: Course;
}

export default function Offers() {
    const { user, profile, refreshProfile } = useAuth();
    const { t } = useLanguage();
    const [offers, setOffers] = useState<Offer[]>([]);
    const [enrollments, setEnrollments] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [enrolling, setEnrolling] = useState<string | null>(null);
    const { toast } = useToast();

    useEffect(() => {
        fetchOffers();
    }, [user]);

    const fetchOffers = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from("offers")
                .select("*, courses(*)")
                .eq("is_active", true);

            if (error) throw error;
            setOffers((data as any) || []);

            if (user) {
                const { data: enrollmentData } = await supabase
                    .from("enrollments")
                    .select("course_id")
                    .eq("user_id", user.id);

                if (enrollmentData) {
                    setEnrollments(enrollmentData.map(e => e.course_id));
                }
            }
        } catch (error) {
            console.error("Error fetching offers:", error);
            toast({
                title: t.common.error,
                description: "Failed to load active offers.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleEnroll = async (course: Course, usePoints: boolean) => {
        if (!user) return;
        setEnrolling(course.id);

        try {
            // Get the latest batch for the course
            const { data: batches } = await supabase
                .from("batches")
                .select("*")
                .eq("course_id", course.id)
                .eq("is_active", true)
                .order("created_at", { ascending: false })
                .limit(1);

            const batchId = batches?.[0]?.id || null;

            if (usePoints) {
                if ((profile?.total_points || 0) < course.points_required) {
                    toast({
                        title: t.courses.insufficientPoints,
                        description: t.courses.insufficientPointsDesc.replace("{points}", String(course.points_required)),
                        variant: "destructive",
                    });
                    return;
                }

                const { error: enrollError } = await supabase.from("enrollments").insert({
                    user_id: user.id,
                    course_id: course.id,
                    batch_id: batchId,
                    payment_method: "points",
                    points_used: course.points_required,
                });

                if (enrollError) throw enrollError;

                // Update offer usage if applicable
                const offer = offers.find(o => o.course_id === course.id);
                if (offer) {
                    await supabase.from("offers").update({
                        used_count: (offer.used_count || 0) + 1
                    }).eq("id", offer.id);
                }

                await supabase
                    .from("profiles")
                    .update({
                        total_points: (profile?.total_points || 0) - course.points_required,
                    })
                    .eq("user_id", user.id);

                await refreshProfile();
                toast({
                    title: t.courses.redeemSuccess,
                    description: t.courses.redeemSuccessDesc
                        .replace("{course}", course.title)
                        .replace("{points}", String(course.points_required)),
                });
            } else {
                const { error: enrollError } = await supabase.from("enrollments").insert({
                    user_id: user.id,
                    course_id: course.id,
                    batch_id: batchId,
                    payment_method: "cash",
                });

                if (enrollError) throw enrollError;

                // Update offer usage
                const offer = offers.find(o => o.course_id === course.id);
                if (offer) {
                    await supabase.from("offers").update({
                        used_count: (offer.used_count || 0) + 1
                    }).eq("id", offer.id);
                }

                if (course.points_reward > 0) {
                    await supabase
                        .from("profiles")
                        .update({
                            total_points: (profile?.total_points || 0) + course.points_reward,
                        })
                        .eq("user_id", user.id);

                    await refreshProfile();
                }

                toast({
                    title: t.courses.enrollSuccess,
                    description: t.courses.enrollSuccessDesc.replace("{course}", course.title),
                });
            }

            setEnrollments(prev => [...prev, course.id]);
        } catch (error: any) {
            toast({
                title: t.courses.enrollFailed,
                description: error.message || "An error occurred",
                variant: "destructive",
            });
        } finally {
            setEnrolling(null);
        }
    };

    return (
        <DashboardLayout>
            <div className="space-y-8">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Tag className="w-6 h-6 text-accent" />
                            <Badge variant="outline" className="text-accent border-accent/20 bg-accent/5">{t.courses.promoBadge}</Badge>
                        </div>
                        <h1 className="text-4xl font-display font-bold mb-2">{t.nav.offers}</h1>
                        <p className="text-muted-foreground max-w-2xl">
                            {t.courses.promoSubtitle}
                        </p>
                    </div>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                ) : offers.length === 0 ? (
                    <div className="p-20 border-2 border-dashed border-muted rounded-3xl flex flex-col items-center justify-center text-center bg-muted/5">
                        <Tag className="w-16 h-16 text-muted-foreground/30 mb-6" />
                        <h3 className="text-xl font-bold mb-2">{t.courses.noOffers}</h3>
                        <p className="text-muted-foreground/60 max-w-sm">
                            {t.courses.noOffersDesc}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {offers.map((offer) => (
                            <OfferCard
                                key={offer.id}
                                course={offer.courses}
                                offer={offer}
                                enrolled={enrollments.includes(offer.course_id)}
                                onEnroll={handleEnroll}
                                enrolling={enrolling === offer.course_id}
                                canRedeem={
                                    offer.courses.points_required > 0 &&
                                    (profile?.total_points || 0) >= offer.courses.points_required
                                }
                            />
                        ))}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
