import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    Search,
    User,
    Mail,
    CheckCircle2,
    Clock,
    ChevronRight,
    GraduationCap,
    BookOpen,
} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface Profile {
    id: string;
    full_name: string | null;
    email: string | null;
    created_at: string;
}

interface Enrollment {
    id: string;
    course_id: string;
    progress_percentage: number;
    enrolled_at: string;
    courses: {
        title: string;
    };
}


export default function AdminUsers() {
    const { t, dir } = useLanguage();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState<Profile[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
    const [userDetails, setUserDetails] = useState<{
        enrollments: Enrollment[];
    }>({ enrollments: [] });
    const [loadingDetails, setLoadingDetails] = useState(false);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setUsers(data || []);
        } catch (error: any) {
            toast({
                title: t.common.error,
                description: error.message,
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const fetchUserDetails = async (profileId: string) => {
        try {
            setLoadingDetails(true);

            // Fetch Enrollments
            const { data: enrollmentsData, error: enrollmentsError } = await supabase
                .from('enrollments')
                .select('*, courses(title)')
                .eq('user_id', profileId);

            if (enrollmentsError) throw enrollmentsError;

            setUserDetails({
                enrollments: (enrollmentsData as any) || [],
            });
        } catch (error: any) {
            toast({
                title: t.common.error,
                description: error.message,
                variant: "destructive",
            });
        } finally {
            setLoadingDetails(false);
        }
    };

    const handleUserClick = (user: Profile) => {
        setSelectedUser(user);
        fetchUserDetails(user.id);
    };

    const filteredUsers = users.filter(user =>
        (user.full_name?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
        (user.email?.toLowerCase() || "").includes(searchQuery.toLowerCase())
    );

    const activeEnrollments = userDetails.enrollments.filter(e => e.progress_percentage < 100);
    const completedEnrollments = userDetails.enrollments.filter(e => e.progress_percentage === 100);

    const handleLevelChange = async (newLevel: string) => {
        if (!selectedUser) return;

        try {
            const { error } = await supabase
                .from('profiles')
                .update({ student_level: newLevel })
                .eq('id', selectedUser.id);

            if (error) throw error;

            setUsers(prev => prev.map(u => u.id === selectedUser.id ? { ...u, student_level: newLevel } : u));
            setSelectedUser(prev => prev ? { ...prev, student_level: newLevel } : null);

            toast({
                title: t.common.success,
                description: "Student level updated successfully",
            });
        } catch (error: any) {
            toast({
                title: t.common.error,
                description: error.message,
                variant: "destructive",
            });
        }
    };

    return (
        <DashboardLayout>
            <div className="space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-display font-bold mb-2">{t.nav.users}</h1>
                        <p className="text-muted-foreground">{t.adminUsers.subtitle}</p>
                    </div>
                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder={t.adminUsers.searchPlaceholder}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="ps-10"
                        />
                    </div>
                </div>

                {/* Users Grid */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="h-40 rounded-xl bg-muted animate-pulse" />
                        ))}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredUsers.map((user) => (
                            <Card
                                key={user.id}
                                className="group hover:shadow-lg transition-all duration-300 cursor-pointer border-accent/10 hover:border-accent/30"
                                onClick={() => handleUserClick(user)}
                            >
                                <CardHeader className="pb-3">
                                    <div className="flex items-start justify-between">
                                        <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center text-accent group-hover:bg-accent group-hover:text-accent-foreground transition-colors duration-300">
                                            <User className="w-6 h-6" />
                                        </div>
                                    </div>
                                    <CardTitle className="text-xl mt-3 line-clamp-1">{user.full_name || "N/A"}</CardTitle>
                                    <CardDescription className="flex items-center gap-1.5 truncate">
                                        <Mail className="w-3.5 h-3.5" />
                                        {user.email}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Button variant="ghost" className="w-full justify-between group-hover:bg-accent/5" size="sm">
                                        {t.adminUsers.viewDetails}
                                        <ChevronRight className={`w-4 h-4 transition-transform duration-300 ${dir === 'rtl' ? 'rotate-180 group-hover:-translate-x-1' : 'group-hover:translate-x-1'}`} />
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}

                {/* User Details Dialog */}
                <Dialog open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
                    <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-display flex items-center gap-2">
                                <GraduationCap className="w-6 h-6 text-accent" />
                                {t.adminUsers.userDetails}
                            </DialogTitle>
                            <DialogDescription>
                                {selectedUser?.full_name} ({selectedUser?.email})
                            </DialogDescription>
                        </DialogHeader>

                        {loadingDetails ? (
                            <div className="space-y-4 py-8">
                                <div className="h-20 bg-muted animate-pulse rounded-lg" />
                                <div className="h-40 bg-muted animate-pulse rounded-lg" />
                            </div>
                        ) : (
                            <div className="space-y-6 py-4">
                                {/* Stats Overview */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/10 flex flex-col items-center justify-center text-center">
                                        <BookOpen className="w-5 h-5 text-blue-500 mb-1" />
                                        <span className="text-lg font-bold">{activeEnrollments.length}</span>
                                        <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">{t.adminUsers.activeCourses}</span>
                                    </div>
                                    <div className="p-4 rounded-xl bg-green-500/5 border border-green-500/10 flex flex-col items-center justify-center text-center">
                                        <CheckCircle2 className="w-5 h-5 text-green-500 mb-1" />
                                        <span className="text-lg font-bold">{completedEnrollments.length}</span>
                                        <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">{t.adminUsers.completedCourses}</span>
                                    </div>
                                </div>

                                {/* Active Courses */}
                                <div className="space-y-3">
                                    <h3 className="font-display font-semibold flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-blue-500" />
                                        {t.adminUsers.activeCourses}
                                    </h3>
                                    {activeEnrollments.length > 0 ? (
                                        <div className="space-y-2">
                                            {activeEnrollments.map((enr) => (
                                                <div key={enr.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-muted">
                                                    <span className="font-medium">{enr.courses.title}</span>
                                                    <Badge variant="outline">{enr.progress_percentage}%</Badge>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-muted-foreground italic">{t.adminUsers.noActive}</p>
                                    )}
                                </div>

                                {/* Completed Courses */}
                                <div className="space-y-3">
                                    <h3 className="font-display font-semibold flex items-center gap-2">
                                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                                        {t.adminUsers.completedCourses}
                                    </h3>
                                    {completedEnrollments.length > 0 ? (
                                        <div className="space-y-2">
                                            {completedEnrollments.map((enr) => (
                                                <div key={enr.id} className="flex items-center justify-between p-3 rounded-lg bg-green-500/5 border border-green-500/20">
                                                    <span className="font-medium">{enr.courses.title}</span>
                                                    <Badge className="bg-green-500 border-0">{enr.progress_percentage}%</Badge>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-muted-foreground italic">{t.adminUsers.noCompleted}</p>
                                    )}
                                </div>

                            </div>
                        )}
                    </DialogContent>
                </Dialog>
            </div>
        </DashboardLayout >
    );
}
