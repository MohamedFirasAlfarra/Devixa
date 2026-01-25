import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, XCircle, AlertCircle, Loader2, Award, ArrowRight, ArrowLeft } from "lucide-react";

interface Question {
    id: string;
    question_text: string;
    options: string[];
    correct_option_index: number;
}

interface Quiz {
    id: string;
    title: string;
    passing_score: number;
    reward_points: number;
}

import { updateStudentLevelAutomatically } from "@/utils/leveling";

export default function Quiz() {
    const { courseId } = useParams();
    const { user, refreshProfile } = useAuth();
    const { t, dir } = useLanguage();
    const navigate = useNavigate();
    const { toast } = useToast();

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [quiz, setQuiz] = useState<Quiz | null>(null);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [answers, setAnswers] = useState<Record<string, number>>({});
    const [result, setResult] = useState<{ score: number; passed: boolean } | null>(null);
    const [courseTitle, setCourseTitle] = useState("");

    useEffect(() => {
        if (user && courseId) {
            fetchQuizData();
        }
    }, [user, courseId]);

    const fetchQuizData = async () => {
        try {
            // Fetch course title
            const { data: courseData } = await supabase
                .from("courses")
                .select("title")
                .eq("id", courseId)
                .single();

            if (courseData) setCourseTitle(courseData.title);

            // Fetch quiz
            const { data: quizData, error: quizError } = await supabase
                .from("course_quizzes")
                .select("*")
                .eq("course_id", courseId)
                .maybeSingle();

            if (quizError) throw quizError;
            if (!quizData) {
                setLoading(false);
                return;
            }

            setQuiz(quizData);

            // Check if already attempted
            const { data: attemptData } = await supabase
                .from("quiz_attempts")
                .select("*")
                .eq("quiz_id", quizData.id)
                .eq("user_id", user?.id)
                .maybeSingle();

            if (attemptData) {
                setResult({ score: attemptData.score, passed: attemptData.passed });
                setLoading(false);
                return;
            }

            // Fetch questions
            const { data: questionsData, error: questionsError } = await supabase
                .from("quiz_questions")
                .select("*")
                .eq("quiz_id", quizData.id);

            if (questionsError) throw questionsError;
            setQuestions(questionsData as any);

        } catch (error) {
            console.error("Error fetching quiz:", error);
            toast({
                title: "Error",
                description: "Failed to load quiz data",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleAnswerSelect = (questionId: string, optionIndex: number) => {
        setAnswers(prev => ({ ...prev, [questionId]: optionIndex }));
    };

    const calculateScore = () => {
        let correctCount = 0;
        questions.forEach(q => {
            if (answers[q.id] === q.correct_option_index) {
                correctCount++;
            }
        });
        return Math.round((correctCount / questions.length) * 100);
    };

    const handleSubmit = async () => {
        if (!quiz || !user) return;

        if (Object.keys(answers).length < questions.length) {
            toast({
                title: "Incomplete",
                description: "Please answer all questions before submitting",
                variant: "destructive",
            });
            return;
        }

        setSubmitting(true);
        const score = calculateScore();
        const passed = score >= quiz.passing_score;

        try {
            const { error: attemptError } = await supabase.from("quiz_attempts").insert({
                user_id: user.id,
                quiz_id: quiz.id,
                score,
                passed,
            });

            if (attemptError) throw attemptError;

            if (passed && quiz.reward_points > 0) {
                // Award points
                const { data: profileData } = await supabase
                    .from("profiles")
                    .select("total_points")
                    .eq("user_id", user.id)
                    .single();

                await supabase
                    .from("profiles")
                    .update({
                        total_points: (profileData?.total_points || 0) + quiz.reward_points,
                    })
                    .eq("user_id", user.id);

                await supabase.from("points_history").insert({
                    user_id: user.id,
                    points: quiz.reward_points,
                    type: "attendance", // Or a new type "quiz_bonus"
                    description: `Final quiz bonus for ${courseTitle}`,
                    course_id: courseId,
                });

                // Trigger level update check
                const levelUpdateResult = await updateStudentLevelAutomatically(user.id);
                if (levelUpdateResult.updated) {
                    toast({
                        title: "🎉 Level Up!",
                        description: `Congratulations! You've reached ${levelUpdateResult.newLevel} level!`,
                    });
                }

                await refreshProfile();
            }

            setResult({ score, passed });
            toast({
                title: passed ? t.quiz.successTitle : t.quiz.failureTitle,
                description: t.quiz.score.replace("{score}", String(score)),
            });

        } catch (error) {
            console.error("Error submitting quiz:", error);
            toast({
                title: "Error",
                description: t.quiz.errorSubmit,
                variant: "destructive",
            });
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex flex-col items-center justify-center h-64 gap-4">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <p className="text-muted-foreground">{t.quiz.loading}</p>
                </div>
            </DashboardLayout>
        );
    }

    if (!quiz) {
        return (
            <DashboardLayout>
                <div className="text-center py-20">
                    <AlertCircle className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                    <h2 className="text-2xl font-bold">{t.quiz.notFound}</h2>
                    <Button onClick={() => navigate("/my-courses")} className="mt-6">
                        {t.quiz.backToCourses}
                    </Button>
                </div>
            </DashboardLayout>
        );
    }

    if (result) {
        return (
            <DashboardLayout>
                <div className="max-w-2xl mx-auto py-12">
                    <Card className="text-center overflow-hidden border-0 shadow-2xl">
                        <div className={`h-2 ${result.passed ? 'bg-success' : 'bg-destructive'}`} />
                        <CardHeader className="pt-10 pb-6">
                            <div className="flex justify-center mb-6">
                                {result.passed ? (
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-success/20 blur-2xl rounded-full scale-150" />
                                        <Award className="w-24 h-24 text-success relative" />
                                    </div>
                                ) : (
                                    <XCircle className="w-24 h-24 text-destructive" />
                                )}
                            </div>
                            <CardTitle className="text-3xl font-display font-black">
                                {result.passed ? t.quiz.successTitle : t.quiz.failureTitle}
                            </CardTitle>
                            <CardDescription className="text-xl mt-2">
                                {t.quiz.score.replace("{score}", String(result.score))}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-8 pb-10">
                            <div className="bg-muted/50 rounded-2xl p-6 inline-block">
                                <p className="text-sm font-medium text-muted-foreground mb-1">
                                    {t.quiz.passingScore.replace("{score}", String(quiz.passing_score))}
                                </p>
                                {result.passed && (
                                    <p className="text-primary font-bold text-lg">
                                        {t.quiz.pointsEarned.replace("{points}", String(quiz.reward_points))}
                                    </p>
                                )}
                            </div>
                            <div>
                                <Button onClick={() => navigate("/my-courses")} size="lg" className="rounded-full px-12 h-14 font-bold text-lg">
                                    {t.quiz.backToCourses}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="max-w-3xl mx-auto space-y-8 pb-20">
                <div>
                    <Button
                        variant="ghost"
                        onClick={() => navigate("/my-courses")}
                        className="mb-4 hover:bg-muted"
                    >
                        {dir === 'rtl' ? <ArrowRight className="w-4 h-4 me-2" /> : <ArrowLeft className="w-4 h-4 me-2" />}
                        {t.quiz.backToCourses}
                    </Button>
                    <h1 className="text-3xl font-display font-black">
                        {t.quiz.title.replace("{course}", courseTitle)}
                    </h1>
                </div>

                <div className="space-y-6">
                    {questions.map((q, qIndex) => (
                        <Card key={q.id} className="border-0 shadow-md">
                            <CardHeader>
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold">
                                        {qIndex + 1}
                                    </span>
                                    <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
                                        {t.quiz.questionCount.replace("{current}", String(qIndex + 1)).replace("{total}", String(questions.length))}
                                    </p>
                                </div>
                                <CardTitle className="text-xl font-medium leading-relaxed">
                                    {q.question_text}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <RadioGroup
                                    onValueChange={(val) => handleAnswerSelect(q.id, parseInt(val))}
                                    className="grid gap-3"
                                >
                                    {q.options.map((option, oIndex) => (
                                        <div key={oIndex} className="relative">
                                            <RadioGroupItem
                                                value={oIndex.toString()}
                                                id={`${q.id}-${oIndex}`}
                                                className="peer sr-only"
                                            />
                                            <Label
                                                htmlFor={`${q.id}-${oIndex}`}
                                                className="flex items-center p-4 rounded-xl border-2 border-border/50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 hover:bg-muted/50 cursor-pointer transition-all"
                                            >
                                                <span className="w-6 h-6 rounded-full border-2 border-primary/30 flex items-center justify-center me-4 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary">
                                                    <span className="w-2 h-2 rounded-full bg-white opacity-0 peer-data-[state=checked]:opacity-100" />
                                                </span>
                                                {option}
                                            </Label>
                                        </div>
                                    ))}
                                </RadioGroup>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <div className="pt-6">
                    <Button
                        onClick={handleSubmit}
                        disabled={submitting}
                        size="lg"
                        className="w-full h-16 rounded-full text-xl font-bold shadow-glow"
                    >
                        {submitting ? (
                            <Loader2 className="w-6 h-6 animate-spin" />
                        ) : (
                            t.quiz.submit
                        )}
                    </Button>
                </div>
            </div>
        </DashboardLayout>
    );
}
