import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, TrendingUp, TrendingDown, Gift, Calendar, BookOpen } from "lucide-react";

interface PointsHistory {
  id: string;
  points: number;
  type: string;
  description: string;
  created_at: string;
  course: {
    title: string;
  } | null;
}

interface Course {
  id: string;
  title: string;
  points_required: number;
}

export default function Points() {
  const { user, profile } = useAuth();
  const { t, language } = useLanguage();
  const [history, setHistory] = useState<PointsHistory[]>([]);
  const [redeemableCourses, setRedeemableCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      const { data: historyData } = await supabase
        .from("points_history")
        .select(`
          id,
          points,
          type,
          description,
          created_at,
          course:courses(title)
        `)
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });

      if (historyData) {
        setHistory(historyData as unknown as PointsHistory[]);
      }

      const { data: coursesData } = await supabase
        .from("courses")
        .select("id, title, points_required")
        .eq("is_active", true)
        .gt("points_required", 0)
        .order("points_required", { ascending: true });

      if (coursesData) {
        const { data: enrollments } = await supabase
          .from("enrollments")
          .select("course_id")
          .eq("user_id", user!.id);

        const enrolledIds = enrollments?.map((e) => e.course_id) || [];
        setRedeemableCourses(
          coursesData.filter((c) => !enrolledIds.includes(c.id))
        );
      }
    } catch (error) {
      console.error("Error fetching points data:", error);
    } finally {
      setLoading(false);
    }
  };

  const totalEarned = history
    .filter((h) => h.points > 0)
    .reduce((sum, h) => sum + h.points, 0);

  const totalSpent = history
    .filter((h) => h.points < 0)
    .reduce((sum, h) => sum + Math.abs(h.points), 0);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "registration":
        return BookOpen;
      case "attendance":
        return Calendar;
      case "redemption":
        return Gift;
      default:
        return Star;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "registration":
        return <Badge variant="secondary">{t.points.types.registration}</Badge>;
      case "attendance":
        return <Badge className="bg-success text-success-foreground">{t.points.types.attendance}</Badge>;
      case "redemption":
        return <Badge variant="outline">{t.points.types.redemption}</Badge>;
      default:
        return <Badge>{type}</Badge>;
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-pulse text-muted-foreground">{t.common.loading}</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-display font-bold mb-2">{t.points.title}</h1>
          <p className="text-muted-foreground">
            {t.points.subtitle}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-0 shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl gradient-accent flex items-center justify-center animate-pulse-glow">
                  <Star className="w-7 h-7 text-accent-foreground" />
                </div>
                <div>
                  <p className="text-3xl font-display font-bold">
                    {profile?.total_points || 0}
                  </p>
                  <p className="text-sm text-muted-foreground">{t.points.availablePoints}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-success/10 flex items-center justify-center">
                  <TrendingUp className="w-7 h-7 text-success" />
                </div>
                <div>
                  <p className="text-3xl font-display font-bold">{totalEarned}</p>
                  <p className="text-sm text-muted-foreground">{t.points.totalEarned}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-destructive/10 flex items-center justify-center">
                  <TrendingDown className="w-7 h-7 text-destructive" />
                </div>
                <div>
                  <p className="text-3xl font-display font-bold">{totalSpent}</p>
                  <p className="text-sm text-muted-foreground">{t.points.totalSpent}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Points history */}
          <div className="lg:col-span-2">
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="text-xl">{t.points.history}</CardTitle>
                <CardDescription>{t.points.historyDesc}</CardDescription>
              </CardHeader>
              <CardContent>
                {history.length === 0 ? (
                  <div className="text-center py-12">
                    <Star className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="font-semibold mb-2">{t.points.noPointsYet}</h3>
                    <p className="text-muted-foreground">
                      {t.points.noPointsDesc}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {history.map((item) => {
                      const Icon = getTypeIcon(item.type);
                      return (
                        <div
                          key={item.id}
                          className="flex items-center gap-4 p-4 bg-muted/50 rounded-xl hover:bg-muted transition-colors"
                        >
                          <div
                            className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                              item.points > 0
                                ? "bg-success/10 text-success"
                                : "bg-destructive/10 text-destructive"
                            }`}
                          >
                            <Icon className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-medium truncate">{item.description}</p>
                              {getTypeBadge(item.type)}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {new Date(item.created_at).toLocaleDateString(language === "ar" ? "ar-SA" : "en-US", {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                          <span
                            className={`text-lg font-bold ${
                              item.points > 0 ? "text-success" : "text-destructive"
                            }`}
                          >
                            {item.points > 0 ? "+" : ""}
                            {item.points}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Redeemable courses */}
          <div>
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Gift className="w-5 h-5 text-accent" />
                  {t.points.redeemPoints}
                </CardTitle>
                <CardDescription>{t.points.redeemDesc}</CardDescription>
              </CardHeader>
              <CardContent>
                {redeemableCourses.length === 0 ? (
                  <div className="text-center py-8">
                    <Gift className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                    <p className="text-muted-foreground text-sm">
                      {t.points.noRedeemable}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {redeemableCourses.map((course) => {
                      const canRedeem =
                        (profile?.total_points || 0) >= course.points_required;
                      return (
                        <div
                          key={course.id}
                          className={`p-4 rounded-xl border ${
                            canRedeem
                              ? "border-accent bg-accent/5"
                              : "border-border bg-muted/30"
                          }`}
                        >
                          <p className="font-medium mb-2 line-clamp-2">
                            {course.title}
                          </p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1 text-sm">
                              <Star className="w-4 h-4 text-accent" />
                              <span className="font-medium">
                                {course.points_required} {t.common.pts}
                              </span>
                            </div>
                            {canRedeem && (
                              <Badge className="gradient-accent text-accent-foreground">
                                {t.points.available}
                              </Badge>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
