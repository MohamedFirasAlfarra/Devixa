import { supabase } from "@/integrations/supabase/client";

export type StudentLevel = 'beginner' | 'intermediate' | 'advanced';

export const LEVEL_THRESHOLDS = {
    intermediate: {
        points: 100,
        completedCourses: 2,
        passedQuizzes: 1
    },
    advanced: {
        points: 300,
        completedCourses: 5,
        passedQuizzes: 3
    }
};

export const calculateStudentLevel = (
    points: number,
    completedCoursesCount: number,
    passedQuizzesCount: number
): StudentLevel => {
    if (
        points >= LEVEL_THRESHOLDS.advanced.points &&
        completedCoursesCount >= LEVEL_THRESHOLDS.advanced.completedCourses &&
        passedQuizzesCount >= LEVEL_THRESHOLDS.advanced.passedQuizzes
    ) {
        return 'advanced';
    }

    if (
        points >= LEVEL_THRESHOLDS.intermediate.points &&
        completedCoursesCount >= LEVEL_THRESHOLDS.intermediate.completedCourses &&
        passedQuizzesCount >= LEVEL_THRESHOLDS.intermediate.passedQuizzes
    ) {
        return 'intermediate';
    }

    return 'beginner';
};

export const updateStudentLevelAutomatically = async (userId: string) => {
    try {
        // 1. Fetch current profile
        const { data: profile } = await supabase
            .from('profiles')
            .select('total_points, student_level')
            .eq('user_id', userId)
            .single();

        if (!profile) return;

        // 2. Fetch completed courses count
        const { count: completedCoursesCount } = await supabase
            .from('enrollments')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('progress_percentage', 100);

        // 3. Fetch passed quizzes count
        const { count: passedQuizzesCount } = await supabase
            .from('quiz_attempts')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('passed', true);

        const newLevel = calculateStudentLevel(
            profile.total_points || 0,
            completedCoursesCount || 0,
            passedQuizzesCount || 0
        );

        // Only update if the level is higher than current (beginner < intermediate < advanced)
        const levelRank = { 'beginner': 1, 'intermediate': 2, 'advanced': 3 };
        const currentRank = levelRank[profile.student_level as StudentLevel || 'beginner'];
        const newRank = levelRank[newLevel];

        if (newRank > currentRank) {
            await supabase
                .from('profiles')
                .update({ student_level: newLevel })
                .eq('user_id', userId);

            return { oldLevel: profile.student_level, newLevel, updated: true };
        }

        return { updated: false };
    } catch (error) {
        console.error("Error updating student level:", error);
        return { updated: false, error };
    }
};
