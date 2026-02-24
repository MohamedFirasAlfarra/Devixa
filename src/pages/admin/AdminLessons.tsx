import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    Plus,
    Pencil,
    Trash2,
    PlayCircle,
    Loader2,
    ChevronLeft,
    ChevronRight,
    ArrowUp,
    ArrowDown,
    ExternalLink
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Lesson {
    id: string;
    course_id: string;
    title: string;
    order_index: number;
    telegram_file_id: string | null;
    duration_hours: number;
}

export default function AdminLessons() {
    const { courseId } = useParams();
    const navigate = useNavigate();
    const { t, dir } = useLanguage();
    const { toast } = useToast();
    const [lessons, setLessons] = useState<Lesson[]>([]);
    const [courseTitle, setCourseTitle] = useState("");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Dialog state
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
    const [formData, setFormData] = useState({
        title: "",
        order_index: 0,
        telegram_file_id: "",
        duration_hours: 1
    });

    // Delete state
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [lessonToDelete, setLessonToDelete] = useState<Lesson | null>(null);

    useEffect(() => {
        if (courseId) {
            fetchCourseDetails();
            fetchLessons();
        }
    }, [courseId]);

    const fetchCourseDetails = async () => {
        const { data } = await supabase
            .from("courses")
            .select("title")
            .eq("id", courseId)
            .single();
        if (data) setCourseTitle(data.title);
    };

    const fetchLessons = async () => {
        try {
            setLoading(true);
            const { data, error } = await (supabase
                .from("course_sessions" as any) as any)
                .select("*")
                .eq("course_id", courseId)
                .order("order_index", { ascending: true });

            if (error) throw error;
            setLessons((data as any[]) || []);
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

    const handleOpenDialog = (lesson?: Lesson) => {
        if (lesson) {
            setEditingLesson(lesson);
            setFormData({
                title: lesson.title,
                order_index: lesson.order_index,
                telegram_file_id: lesson.telegram_file_id || "",
                duration_hours: lesson.duration_hours || 1
            });
        } else {
            setEditingLesson(null);
            setFormData({
                title: "",
                order_index: lessons.length > 0 ? Math.max(...lessons.map(l => l.order_index)) + 1 : 1,
                telegram_file_id: "",
                duration_hours: 1
            });
        }
        setDialogOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const lessonData = {
                course_id: courseId,
                title: formData.title,
                order_index: formData.order_index,
                telegram_file_id: formData.telegram_file_id,
                duration_hours: formData.duration_hours,
                video_url: null, // Clear explicit URLs
                video_path: null // Clear direct storage paths
            };

            if (editingLesson) {
                const { error } = await (supabase
                    .from("course_sessions" as any) as any)
                    .update(lessonData)
                    .eq("id", editingLesson.id);
                if (error) throw error;
            } else {
                const { error } = await (supabase
                    .from("course_sessions" as any) as any)
                    .insert(lessonData);
                if (error) throw error;
            }

            toast({ title: t.adminLessons.saveSuccess });
            setDialogOpen(false);
            fetchLessons();
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

    const handleDelete = async () => {
        if (!lessonToDelete) return;
        try {
            const { error } = await (supabase
                .from("course_sessions" as any) as any)
                .delete()
                .eq("id", lessonToDelete.id);
            if (error) throw error;
            toast({ title: t.common.success });
            fetchLessons();
        } catch (error: any) {
            toast({
                title: t.common.error,
                description: error.message,
                variant: "destructive",
            });
        } finally {
            setDeleteDialogOpen(false);
            setLessonToDelete(null);
        }
    };

    const moveLesson = async (index: number, direction: 'up' | 'down') => {
        const newLessons = [...lessons];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;

        if (targetIndex < 0 || targetIndex >= lessons.length) return;

        const currentLesson = newLessons[index];
        const targetLesson = newLessons[targetIndex];

        const currentOrder = currentLesson.order_index;
        const targetOrder = targetLesson.order_index;

        try {
            await Promise.all([
                (supabase.from("course_sessions" as any) as any).update({ order_index: targetOrder }).eq("id", currentLesson.id),
                (supabase.from("course_sessions" as any) as any).update({ order_index: currentOrder }).eq("id", targetLesson.id)
            ]);
            fetchLessons();
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => navigate("/admin/courses")}>
                            {dir === 'rtl' ? <ChevronRight /> : <ChevronLeft />}
                        </Button>
                        <div>
                            <h1 className="text-3xl font-display font-bold">{t.adminLessons.title}</h1>
                            <p className="text-muted-foreground">{courseTitle}</p>
                        </div>
                    </div>
                    <Button onClick={() => handleOpenDialog()} className="gradient-primary">
                        <Plus className="w-4 h-4 me-2" />
                        {t.adminLessons.addLesson}
                    </Button>
                </div>

                <Card className="border-accent/10">
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-20">{t.adminLessons.orderNumber}</TableHead>
                                    <TableHead>{t.adminLessons.lessonTitle}</TableHead>
                                    <TableHead>{t.adminLessons.duration}</TableHead>
                                    <TableHead className="text-center">{t.common.actions}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-10">
                                            <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
                                        </TableCell>
                                    </TableRow>
                                ) : lessons.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-10 text-muted-foreground">
                                            {t.adminLessons.noLessons}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    lessons.map((lesson, index) => (
                                        <TableRow key={lesson.id} className="group">
                                            <TableCell className="font-bold">{lesson.order_index}</TableCell>
                                            <TableCell className="font-medium">
                                                <div className="flex items-center gap-2">
                                                    <PlayCircle className="w-4 h-4 text-accent" />
                                                    {lesson.title}
                                                </div>
                                            </TableCell>
                                            <TableCell>{lesson.duration_hours} {t.common.hours}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center justify-center gap-2">
                                                    <div className="flex flex-col gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8"
                                                            disabled={index === 0}
                                                            onClick={() => moveLesson(index, 'up')}
                                                        >
                                                            <ArrowUp className="w-4 h-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8"
                                                            disabled={index === lessons.length - 1}
                                                            onClick={() => moveLesson(index, 'down')}
                                                        >
                                                            <ArrowDown className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                    <Button variant="outline" size="icon" onClick={() => handleOpenDialog(lesson)}>
                                                        <Pencil className="w-4 h-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => {
                                                        setLessonToDelete(lesson);
                                                        setDeleteDialogOpen(true);
                                                    }}>
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingLesson ? t.adminLessons.editLesson : t.adminLessons.addLesson}</DialogTitle>
                        <DialogDescription>
                            {dir === 'rtl' ? "أدخل تفاصيل الدرس ومعرف فيديو تليجرام" : "Enter lesson details and Telegram video ID"}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>{t.adminLessons.lessonTitle}</Label>
                            <Input
                                value={formData.title}
                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                                placeholder={dir === 'rtl' ? "عنوان الدرس" : "Lesson Title"}
                                required
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>{t.adminLessons.orderNumber}</Label>
                                <Input
                                    type="number"
                                    value={formData.order_index}
                                    onChange={e => setFormData({ ...formData, order_index: parseInt(e.target.value) })}
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>{t.adminLessons.duration}</Label>
                                <Input
                                    type="number"
                                    step="0.1"
                                    value={formData.duration_hours}
                                    onChange={e => setFormData({ ...formData, duration_hours: parseFloat(e.target.value) })}
                                    required
                                />
                            </div>
                        </div>
                        <div className="space-y-2 pt-2 border-t border-accent/10">
                            <div className="flex items-center justify-between">
                                <Label className="text-primary font-bold">Telegram Video ID</Label>
                                <a
                                    href="https://t.me/"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-[10px] flex items-center gap-1 text-accent hover:underline"
                                >
                                    {dir === 'rtl' ? "افتح تليجرام" : "Open Telegram"}
                                    <ExternalLink className="w-2 h-2" />
                                </a>
                            </div>
                            <Input
                                value={formData.telegram_file_id}
                                onChange={e => setFormData({ ...formData, telegram_file_id: e.target.value })}
                                placeholder="file_id_..."
                                className="font-mono text-sm border-primary/20 focus-visible:ring-primary"
                                required
                            />
                            <p className="text-[10px] text-muted-foreground leading-relaxed italic">
                                {dir === 'rtl'
                                    ? "أرسل الفيديو للبوت الخاص بك وانسخ المعرف الذي سيرد به هنا."
                                    : "Send the video to your bot and copy the exact ID it replies with here."}
                            </p>
                        </div>
                        <DialogFooter className="pt-4">
                            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
                                {t.common.cancel}
                            </Button>
                            <Button type="submit" disabled={saving}>
                                {saving && <Loader2 className="w-4 h-4 me-2 animate-spin" />}
                                {t.common.save}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t.adminLessons.deleteLesson}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t.adminLessons.deleteConfirm?.replace("{title}", lessonToDelete?.title || "")}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
                            {t.common.delete}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </DashboardLayout>
    );
}
