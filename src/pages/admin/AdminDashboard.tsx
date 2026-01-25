import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, BookOpen, Star, TrendingUp } from "lucide-react";

export default function AdminDashboard() {
  const { t } = useLanguage();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCourses: 0,
    totalEnrollments: 0,
    totalPointsAwarded: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [profiles, courses, enrollments, points] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact" }),
        supabase.from("courses").select("id", { count: "exact" }),
        supabase.from("enrollments").select("id", { count: "exact" }),
        supabase.from("points_history").select("points").gt("points", 0),
      ]);

      setStats({
        totalUsers: profiles.count || 0,
        totalCourses: courses.count || 0,
        totalEnrollments: enrollments.count || 0,
        totalPointsAwarded: points.data?.reduce((sum, p) => sum + p.points, 0) || 0,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { icon: Users, label: t.admin.totalStudents, value: stats.totalUsers, color: "text-primary", bg: "bg-primary/10" },
    { icon: BookOpen, label: t.admin.coursesCount, value: stats.totalCourses, color: "text-success", bg: "bg-success/10" },
    { icon: TrendingUp, label: t.admin.enrollments, value: stats.totalEnrollments, color: "text-accent", bg: "bg-accent/10" },
    { icon: Star, label: t.admin.pointsAwarded, value: stats.totalPointsAwarded, color: "text-warning", bg: "bg-warning/10" },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-display font-bold mb-2">{t.admin.dashboard}</h1>
          <p className="text-muted-foreground">{t.admin.managePlatform}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat, index) => (
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

        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle>{t.admin.quickActions}</CardTitle>
            <CardDescription>{t.admin.quickActionsDesc}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    </DashboardLayout>
  );
}
