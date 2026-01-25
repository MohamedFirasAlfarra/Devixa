import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BookOpen, Clock, PlayCircle, ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface CourseSession {
  id: string;
  title: string;
  duration_hours: number;
  session_date: string | null;
  attended: boolean;
  hours_attended: number;
}

interface EnrolledCourse {
  id: string;
  course_id: string;
  progress_percentage: number;
  course: {
    id: string;
    title: string;
    description: string | null;
    total_hours: number;
    sessions_count: number;
  };
  batch: {
    id: string;
    name: string;
  } | null;
  sessions: CourseSession[];
}

export default function MyCourses() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [enrolledCourses, setEnrolledCourses] = useState<EnrolledCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCourses, setExpandedCourses] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (user) {
      fetchEnrolledCourses();
    }
  }, [user]);

  const fetchEnrolledCourses = async () => {
    try {
      // Fetch enrollments with course and batch info
      const { data: enrollments, error: enrollmentsError } = await supabase
        .from("enrollments")
        .select(`
          id,
          course_id,
          progress_percentage,
          batch_id,
          courses (
            id,
            title,
            description,
            total_hours,
            sessions_count
          ),
          batches (
            id,
            name
          )
        `)
        .eq("user_id", user?.id);

      if (enrollmentsError) throw enrollmentsError;

      // For each enrollment, fetch sessions, attendance, and quiz info
      const coursesWithSessions = await Promise.all(
        (enrollments || []).map(async (enrollment) => {
          let sessions: CourseSession[] = [];
          let hasQuiz = false;
          let quizAttempted = false;

          // Check if quiz exists and if user attempted it
          const { data: quizData } = await supabase
            .from("course_quizzes")
            .select("id")
            .eq("course_id", enrollment.course_id)
            .maybeSingle();

          if (quizData) {
            hasQuiz = true;
            const { data: attemptData } = await supabase
              .from("quiz_attempts")
              .select("id")
              .eq("quiz_id", quizData.id)
              .eq("user_id", user?.id)
              .maybeSingle();

            if (attemptData) {
              quizAttempted = true;
            }
          }

          if (enrollment.batch_id) {
            // Fetch course sessions for this batch
            const { data: courseSessions } = await supabase
              .from("course_sessions")
              .select("id, title, duration_hours, session_date")
              .eq("batch_id", enrollment.batch_id)
              .order("session_date", { ascending: true });

            if (courseSessions) {
              // Fetch attendance for these sessions
              const { data: attendanceData } = await supabase
                .from("attendance")
                .select("session_id, attended, hours_attended")
                .eq("user_id", user?.id)
                .in("session_id", courseSessions.map(s => s.id));

              const attendanceMap = new Map(
                (attendanceData || []).map(a => [a.session_id, a])
              );

              sessions = courseSessions.map(session => ({
                ...session,
                attended: attendanceMap.get(session.id)?.attended || false,
                hours_attended: Number(attendanceMap.get(session.id)?.hours_attended) || 0,
              }));
            }
          }

          return {
            id: enrollment.id,
            course_id: enrollment.course_id,
            progress_percentage: enrollment.progress_percentage || 0,
            course: enrollment.courses as EnrolledCourse["course"],
            batch: enrollment.batches as EnrolledCourse["batch"],
            sessions,
            hasQuiz,
            quizAttempted
          };
        })
      );

      setEnrolledCourses(coursesWithSessions as any);
    } catch (error) {
      console.error("Error fetching enrolled courses:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleCourseExpanded = (courseId: string) => {
    setExpandedCourses(prev => {
      const next = new Set(prev);
      if (next.has(courseId)) {
        next.delete(courseId);
      } else {
        next.add(courseId);
      }
      return next;
    });
  };

  const calculateSessionProgress = (session: CourseSession) => {
    if (!session.attended) return 0;
    if (session.duration_hours === 0) return 100;
    return Math.min(100, (session.hours_attended / session.duration_hours) * 100);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-display font-bold">{t.myCourses.title}</h1>
          <p className="text-muted-foreground mt-1">{t.myCourses.subtitle}</p>
        </div>

        {/* Courses List */}
        {enrolledCourses.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <BookOpen className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">{t.myCourses.noCourses}</h3>
              <p className="text-muted-foreground text-center">{t.myCourses.noCoursesDesc}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {enrolledCourses.map((enrollment) => (
              <Card key={enrollment.id} className="overflow-hidden">
                <Collapsible
                  open={expandedCourses.has(enrollment.id)}
                  onOpenChange={() => toggleCourseExpanded(enrollment.id)}
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-xl mb-2">{enrollment.course.title}</CardTitle>
                        {enrollment.course.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {enrollment.course.description}
                          </p>
                        )}
                        <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>{enrollment.course.total_hours} {t.common.hours}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <PlayCircle className="w-4 h-4" />
                            <span>{enrollment.course.sessions_count} {t.common.sessions}</span>
                          </div>
                          {enrollment.batch && (
                            <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full text-xs font-medium">
                              {enrollment.batch.name}
                            </span>
                          )}
                        </div>
                      </div>

                      {enrollment.sessions.length > 0 && (
                        <CollapsibleTrigger asChild>
                          <Button variant="ghost" size="sm">
                            {expandedCourses.has(enrollment.id) ? (
                              <ChevronUp className="w-5 h-5" />
                            ) : (
                              <ChevronDown className="w-5 h-5" />
                            )}
                          </Button>
                        </CollapsibleTrigger>
                      )}
                    </div>

                    {/* Course Progress */}
                    <div className="mt-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">{t.myCourses.courseProgress}</span>
                        <span className="text-sm font-bold text-primary">
                          {enrollment.progress_percentage}%
                        </span>
                      </div>
                      <Progress value={enrollment.progress_percentage} className="h-3" />
                    </div>

                    {/* Final Quiz Button */}
                    {(enrollment as any).hasQuiz && enrollment.progress_percentage === 100 && (
                      <div className="mt-6">
                        <Link to={`/quiz/${enrollment.course_id}`}>
                          <Button
                            className="w-full gap-2 font-bold py-6 text-lg shadow-glow"
                            disabled={(enrollment as any).quizAttempted}
                          >
                            <Sparkles className="w-5 h-5 text-accent" />
                            {(enrollment as any).quizAttempted ? t.myCourses.quizCompleted : t.myCourses.startQuiz}
                          </Button>
                        </Link>
                      </div>
                    )}
                  </CardHeader>

                  {/* Sessions List */}
                  <CollapsibleContent>
                    <CardContent className="pt-0 border-t border-border">
                      <h4 className="font-semibold mb-4 mt-4">{t.myCourses.sessions}</h4>
                      {enrollment.sessions.length === 0 ? (
                        <p className="text-sm text-muted-foreground">{t.myCourses.noSessions}</p>
                      ) : (
                        <div className="space-y-3">
                          {enrollment.sessions.map((session, index) => {
                            const sessionProgress = calculateSessionProgress(session);
                            return (
                              <div
                                key={session.id}
                                className="bg-muted/50 rounded-lg p-4"
                              >
                                <div className="flex items-start justify-between gap-3 mb-2">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className="w-6 h-6 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center">
                                        {index + 1}
                                      </span>
                                      <span className="font-medium truncate">{session.title}</span>
                                    </div>
                                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground ms-8">
                                      <span>{session.duration_hours} {t.common.hours}</span>
                                      {session.session_date && (
                                        <span>{new Date(session.session_date).toLocaleDateString()}</span>
                                      )}
                                    </div>
                                  </div>
                                  <span className={`text-sm font-bold ${sessionProgress === 100 ? 'text-green-500' : 'text-primary'}`}>
                                    {sessionProgress.toFixed(0)}%
                                  </span>
                                </div>
                                <div className="ms-8">
                                  <Progress value={sessionProgress} className="h-2" />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </CardContent>
                  </CollapsibleContent>
                </Collapsible>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
