import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { BookOpen, Star, Trophy, ArrowRight, ArrowLeft, Calendar, Users } from "lucide-react";

interface Enrollment {
  id: string;
  progress_percentage: number;
  enrolled_at: string;
  course: {
    id: string;
    title: string;
    description: string;
    total_hours: number;
    sessions_count: number;
  };
  batch: {
    id: string;
    name: string;
    start_date: string;
    telegram_group_link: string;
  } | null;
}

interface PointsHistory {
  id: string;
  points: number;
  type: string;
  description: string;
  created_at: string;
}

export default function Dashboard() {
  const { user, profile, isAdmin } = useAuth();
  const { t, dir, language } = useLanguage();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [recentPoints, setRecentPoints] = useState<PointsHistory[]>([]);
  const [loading, setLoading] = useState(true);

  const ArrowIcon = dir === "rtl" ? ArrowLeft : ArrowRight;

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      const { data: enrollmentData } = await supabase
        .from("enrollments")
        .select(`
          id,
          progress_percentage,
          enrolled_at,
          course:courses(id, title, description, total_hours, sessions_count),
          batch:batches(id, name, start_date, telegram_group_link)
        `)
        .eq("user_id", user!.id)
        .order("enrolled_at", { ascending: false });

      if (enrollmentData) {
        setEnrollments(enrollmentData as unknown as Enrollment[]);
      }

      const { data: pointsData } = await supabase
        .from("points_history")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(5);

      if (pointsData) {
        setRecentPoints(pointsData);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    {
      icon: BookOpen,
      label: t.dashboard.enrolledCourses,
      value: enrollments.length,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      icon: Star,
      label: t.dashboard.totalPoints,
      value: profile?.total_points || 0,
      color: "text-accent",
      bg: "bg-accent/10",
    },
    {
      icon: Trophy,
      label: t.dashboard.completed,
      value: enrollments.filter((e) => e.progress_percentage === 100).length,
      color: "text-success",
      bg: "bg-success/10",
    },
  ];

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
        {/* Welcome section */}
        <div className="animate-fade-in flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold mb-2 flex items-center gap-2">
              {t.dashboard.welcomeBack}،
              {isAdmin ? (
                <span className="relative inline-block group">
                  <span className="absolute -inset-1 bg-accent/20 blur-xl rounded-full animate-pulse transition-all duration-500 group-hover:bg-accent/40 group-hover:blur-2xl" />
                  <span className="relative bg-clip-text text-transparent bg-gradient-to-r from-accent via-white to-accent bg-[length:200%_auto] animate-shimmer font-[900] drop-shadow-[0_0_15px_rgba(251,191,36,0.6)] tracking-tight">
                    Admin!
                  </span>
                </span>
              ) : (
                <span>{profile?.full_name?.split(" ")[0] || "Student"}!</span>
              )}
            </h1>
            <p className="text-muted-foreground">
              {t.dashboard.trackProgress}
            </p>
          </div>

          {/* Level Badge - Hidden for Admin */}
          {!isAdmin && profile?.student_level && (
            <div className="flex items-center gap-3 bg-card/40 backdrop-blur-md border border-border/50 p-4 rounded-2xl shadow-glow">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${profile?.student_level === 'advanced' ? 'bg-amber-500/20 text-amber-500' :
                profile?.student_level === 'intermediate' ? 'bg-blue-500/20 text-blue-500' :
                  'bg-slate-500/20 text-slate-500'
                }`}>
                <Trophy className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{t.common.level}</p>
                <p className={`font-bold text-lg ${profile?.student_level === 'advanced' ? 'text-amber-500' :
                  profile?.student_level === 'intermediate' ? 'text-blue-500' :
                    'text-slate-500'
                  }`}>
                  {profile?.student_level === 'advanced' ? t.common.advanced :
                    profile?.student_level === 'intermediate' ? t.common.intermediate :
                      t.common.beginner}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-slide-up">
          {stats.map((stat, index) => (
            <Card key={index} className="border-0 shadow-md">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl ${stat.bg} flex items-center justify-center`}>
                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-2xl font-display font-bold">{stat.value}</p>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Enrolled courses */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-display font-bold">{t.dashboard.myCourses}</h2>
              <Link to="/courses">
                <Button variant="ghost" size="sm">
                  {t.common.viewAll} <ArrowIcon className="w-4 h-4 ms-2" />
                </Button>
              </Link>
            </div>

            {enrollments.length === 0 ? (
              <Card className="border-0 shadow-md">
                <CardContent className="p-8 text-center">
                  <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-semibold mb-2">{t.dashboard.noCoursesYet}</h3>
                  <p className="text-muted-foreground mb-4">
                    {t.dashboard.noCoursesDesc}
                  </p>
                  <Link to="/courses">
                    <Button>{t.dashboard.browseCourses}</Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {enrollments.slice(0, 3).map((enrollment) => (
                  <Card key={enrollment.id} className="border-0 shadow-md hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row md:items-center gap-4">
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg mb-1">
                            {enrollment.course.title}
                          </h3>
                          <p className="text-sm text-muted-foreground line-clamp-1 mb-3">
                            {enrollment.course.description}
                          </p>
                          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                            {enrollment.batch && (
                              <div className="flex items-center gap-1">
                                <Users className="w-4 h-4" />
                                {enrollment.batch.name}
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {enrollment.course.sessions_count} {t.common.sessions}
                            </div>
                          </div>
                        </div>
                        <div className="w-full md:w-32">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">{t.dashboard.progress}</span>
                            <span className="text-sm text-muted-foreground">
                              {enrollment.progress_percentage}%
                            </span>
                          </div>
                          <Progress value={enrollment.progress_percentage} className="h-2" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Points history */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-display font-bold">{t.dashboard.recentPoints}</h2>
              <Link to="/points">
                <Button variant="ghost" size="sm">
                  {t.common.viewAll} <ArrowIcon className="w-4 h-4 ms-2" />
                </Button>
              </Link>
            </div>

            <Card className="border-0 shadow-md">
              <CardContent className="p-4">
                {recentPoints.length === 0 ? (
                  <div className="text-center py-8">
                    <Star className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                    <p className="text-muted-foreground text-sm">
                      {t.dashboard.noPointsYet}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentPoints.map((point) => (
                      <div
                        key={point.id}
                        className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                      >
                        <div>
                          <p className="font-medium text-sm">{point.description}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(point.created_at).toLocaleDateString(language === "ar" ? "ar-SA" : "en-US")}
                          </p>
                        </div>
                        <span
                          className={`font-bold ${point.points > 0 ? "text-success" : "text-destructive"
                            }`}
                        >
                          {point.points > 0 ? "+" : ""}
                          {point.points}
                        </span>
                      </div>
                    ))}
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
