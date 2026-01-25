import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { User, Mail, Calendar, Star, Save, Lock, Trophy } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Profile() {
    const { user, profile, refreshProfile, isAdmin } = useAuth();
    const { t } = useLanguage();
    const { toast } = useToast();
    const navigate = useNavigate();
    const [fullName, setFullName] = useState(profile?.full_name || "");
    const [saving, setSaving] = useState(false);

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            const { error } = await supabase
                .from("profiles")
                .update({ full_name: fullName.trim() })
                .eq("user_id", user?.id);

            if (error) throw error;

            await refreshProfile();

            toast({
                title: t.profile?.updateSuccess || "Profile updated",
                description: t.profile?.updateSuccessDesc || "Your profile has been updated successfully",
            });
        } catch (error: any) {
            toast({
                title: t.common.error,
                description: error.message,
                variant: "destructive",
            });
        } finally {
            setSaving(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-display font-bold mb-2">{t.profile.title}</h1>
                    <p className="text-muted-foreground">
                        {t.profile.subtitle}
                    </p>
                </div>

                {/* Avatar and Basic Info */}
                <Card>
                    <CardHeader>
                        <CardTitle>{t.profile.personalInfo}</CardTitle>
                        <CardDescription>
                            {t.profile.personalInfoDesc}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Edit Form */}
                        <form onSubmit={handleSaveProfile} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="fullName">
                                    <User className="w-4 h-4 inline me-2" />
                                    {t.auth.fullName}
                                </Label>
                                <Input
                                    id="fullName"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    placeholder="Enter your full name"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email">
                                    <Mail className="w-4 h-4 inline me-2" />
                                    {t.auth.email}
                                </Label>
                                <Input
                                    id="email"
                                    value={profile?.email || ""}
                                    disabled
                                    className="bg-muted"
                                />
                                <p className="text-xs text-muted-foreground">
                                    {t.profile?.emailHint || "Email cannot be changed"}
                                </p>
                            </div>

                            <Button type="submit" disabled={saving} className="w-full sm:w-auto">
                                <Save className="w-4 h-4 me-2" />
                                {saving ? t.common.save + "..." : t.common.save}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Account Stats */}
                <Card>
                    <CardHeader>
                        <CardTitle>{t.profile.accountStats}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="p-4 rounded-lg bg-primary/5 border border-primary/10">
                                <div className="flex items-center gap-2 mb-1">
                                    <Star className="w-4 h-4 text-primary" />
                                    <span className="text-sm font-medium text-muted-foreground">
                                        {t.common.points}
                                    </span>
                                </div>
                                <div className="text-2xl font-bold">{profile?.total_points || 0}</div>
                            </div>

                            <div className="p-4 rounded-lg bg-accent/5 border border-accent/10">
                                <div className="flex items-center gap-2 mb-1">
                                    <Calendar className="w-4 h-4 text-accent" />
                                    <span className="text-sm font-medium text-muted-foreground">
                                        {t.profile.memberSince}
                                    </span>
                                </div>
                                <div className="text-2xl font-bold">
                                    {user?.created_at ? new Date(user.created_at).toLocaleDateString() : "N/A"}
                                </div>
                            </div>

                            <div className="p-4 rounded-lg bg-secondary/50 border border-secondary">
                                <div className="flex items-center gap-2 mb-1">
                                    {isAdmin ? (
                                        <User className="w-4 h-4 text-secondary-foreground" />
                                    ) : (
                                        <Trophy className={`w-4 h-4 ${profile?.student_level === 'advanced' ? 'text-amber-500' :
                                            profile?.student_level === 'intermediate' ? 'text-blue-500' :
                                                'text-slate-400'
                                            }`} />
                                    )}
                                    <span className="text-sm font-medium text-muted-foreground">
                                        {isAdmin ? (t.profile?.accountType || "Account Type") : t.common.level}
                                    </span>
                                </div>
                                <div className={`text-2xl font-bold capitalize ${!isAdmin && profile?.student_level === 'advanced' ? 'text-amber-600' :
                                    !isAdmin && profile?.student_level === 'intermediate' ? 'text-blue-600' :
                                        ''
                                    }`}>
                                    {isAdmin ? (t.profile?.admin || "Admin") : (
                                        profile?.student_level === 'advanced' ? t.common.advanced :
                                            profile?.student_level === 'intermediate' ? t.common.intermediate :
                                                t.common.beginner
                                    )}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Security */}
                <Card>
                    <CardHeader>
                        <CardTitle>{t.profile.security}</CardTitle>
                        <CardDescription>
                            {t.profile.securityDesc}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button
                            variant="outline"
                            onClick={() => navigate("/change-password")}
                            className="w-full sm:w-auto"
                        >
                            <Lock className="w-4 h-4 me-2" />
                            {t.profile.changePassword}
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
}
