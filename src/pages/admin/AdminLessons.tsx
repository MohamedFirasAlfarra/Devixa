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
import { Badge } from "@/components/ui/badge";
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
    ExternalLink,
    Upload,
    Video,
    Link as LinkIcon,
    X,
    Send
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Lesson {
    id: string;
    course_id: string;
    title: string;
    order_index: number;
    telegram_file_id: string | null;
    video_url: string | null;
    video_path: string | null;
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
    const [sourceType, setSourceType] = useState<'telegram' | 'upload' | 'url'>('telegram');
    const [formData, setFormData] = useState({
        title: "",
        order_index: 0,
        telegram_file_id: "",
        video_url: "",
        video_path: "",
        duration_hours: 1
    });

    // Upload state
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploadProgress, setUploadProgress] = useState(0);

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
                video_url: lesson.video_url || "",
                video_path: lesson.video_path || "",
                duration_hours: lesson.duration_hours || 1
            });
            if (lesson.telegram_file_id) setSourceType('telegram');
            else if (lesson.video_path) setSourceType('upload');
            else if (lesson.video_url) setSourceType('url');
        } else {
            setEditingLesson(null);
            setSourceType('telegram');
            setFormData({
                title: "",
                order_index: lessons.length > 0 ? Math.max(...lessons.map(l => l.order_index)) + 1 : 1,
                telegram_file_id: "",
                video_url: "",
                video_path: "",
                duration_hours: 1
            });
        }
        setSelectedFile(null);
        setUploadProgress(0);
        setDialogOpen(true);
    };

    const handleUploadVideo = async (file: File) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${courseId}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
            .from('course-videos')
            .upload(fileName, file, {
                cacheControl: '3600',
                upsert: false,
                contentType: file.type || 'video/mp4'
            });

        if (uploadError) {
            console.error("Upload error details:", uploadError);
            throw uploadError;
        }
        return fileName; // video_path
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            let finalVideoPath = formData.video_path;

            if (sourceType === 'upload' && selectedFile) {
                finalVideoPath = await handleUploadVideo(selectedFile);
            }

            const lessonData = {
                course_id: courseId,
                title: formData.title,
                order_index: formData.order_index,
                telegram_file_id: sourceType === 'telegram' ? formData.telegram_file_id : null,
                video_url: sourceType === 'url' ? formData.video_url : null,
                video_path: sourceType === 'upload' ? finalVideoPath : null,
                duration_hours: formData.duration_hours
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
            // Delete from storage if exists
            if (lessonToDelete.video_path) {
                await supabase.storage.from('course-videos').remove([lessonToDelete.video_path]);
            }

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
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => navigate("/admin/courses")} className="rounded-xl">
                            {dir === 'rtl' ? <ChevronRight /> : <ChevronLeft />}
                        </Button>
                        <div>
                            <h1 className="text-3xl font-display font-bold tracking-tight">{t.adminLessons.title}</h1>
                            <p className="text-muted-foreground font-medium">{courseTitle}</p>
                        </div>
                    </div>
                    <Button onClick={() => handleOpenDialog()} className="gradient-primary h-12 px-6 rounded-xl font-bold shadow-lg shadow-primary/20">
                        <Plus className="w-5 h-5 me-2" />
                        {t.adminLessons.addLesson}
                    </Button>
                </div>

                <Card className="border-accent/10 shadow-sm overflow-hidden rounded-[2rem]">
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader className="bg-muted/30">
                                <TableRow>
                                    <TableHead className="w-24 text-center">{t.adminLessons.orderNumber}</TableHead>
                                    <TableHead>{t.adminLessons.lessonTitle}</TableHead>
                                    <TableHead>{t.adminLessons.duration}</TableHead>
                                    <TableHead className="text-center">{t.common.actions}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-20">
                                            <Loader2 className="w-10 h-10 animate-spin mx-auto text-primary" />
                                        </TableCell>
                                    </TableRow>
                                ) : lessons.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center py-20 text-muted-foreground">
                                            <Video className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                            {t.adminLessons.noLessons}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    lessons.map((lesson, index) => (
                                        <TableRow key={lesson.id} className="group transition-colors hover:bg-muted/30">
                                            <TableCell className="font-bold text-center">
                                                <Badge variant="outline" className="rounded-lg px-3 py-1 bg-background">
                                                    #{lesson.order_index}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="font-medium">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent group-hover:bg-accent group-hover:text-white transition-all">
                                                        <PlayCircle className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold">{lesson.title}</p>
                                                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
                                                            {lesson.telegram_file_id ? 'Telegram' : lesson.video_path ? 'Hosted' : 'Direct URL'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-semibold text-muted-foreground">
                                                {lesson.duration_hours} {t.common.hours}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center justify-center gap-3">
                                                    <div className="flex flex-col gap-0.5">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-7 w-7 rounded-sm hover:bg-primary/10 hover:text-primary"
                                                            disabled={index === 0}
                                                            onClick={() => moveLesson(index, 'up')}
                                                        >
                                                            <ArrowUp className="w-3.5 h-3.5" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-7 w-7 rounded-sm hover:bg-primary/10 hover:text-primary"
                                                            disabled={index === lessons.length - 1}
                                                            onClick={() => moveLesson(index, 'down')}
                                                        >
                                                            <ArrowDown className="w-3.5 h-3.5" />
                                                        </Button>
                                                    </div>
                                                    <Button variant="outline" size="icon" className="h-10 w-10 rounded-xl" onClick={() => handleOpenDialog(lesson)}>
                                                        <Pencil className="w-4 h-4" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-destructive hover:bg-destructive/10" onClick={() => {
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
                <DialogContent className="max-w-xl rounded-[2rem]">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-display font-black">
                            {editingLesson ? t.adminLessons.editLesson : t.adminLessons.addLesson}
                        </DialogTitle>
                        <DialogDescription>
                            {dir === 'rtl' ? "أدخل تفاصيل الدرس واختر طريقة عرض الفيديو" : "Enter lesson details and choose video source"}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-6 py-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2 lg:col-span-2">
                                <Label className="font-bold">{t.adminLessons.lessonTitle}</Label>
                                <Input
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    placeholder={dir === 'rtl' ? "عنوان الدرس..." : "Lesson Title..."}
                                    className="h-12 rounded-xl"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="font-bold">{t.adminLessons.orderNumber}</Label>
                                <Input
                                    type="number"
                                    value={formData.order_index}
                                    onChange={e => setFormData({ ...formData, order_index: parseInt(e.target.value) })}
                                    className="h-12 rounded-xl"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="font-bold">{t.adminLessons.duration}</Label>
                                <Input
                                    type="number"
                                    step="0.1"
                                    value={formData.duration_hours}
                                    onChange={e => setFormData({ ...formData, duration_hours: parseFloat(e.target.value) })}
                                    className="h-12 rounded-xl"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-4 pt-4 border-t border-accent/10">
                            <Label className="font-black text-primary uppercase tracking-widest text-xs flex items-center gap-2">
                                <Video className="w-4 h-4" />
                                {dir === 'rtl' ? "مصدر الفيديو" : "Video Source"}
                            </Label>

                            <div className="grid grid-cols-3 gap-2">
                                <Button
                                    type="button"
                                    variant={sourceType === 'telegram' ? 'default' : 'outline'}
                                    className="h-20 flex-col gap-2 rounded-2xl"
                                    onClick={() => setSourceType('telegram')}
                                >
                                    <Send className="w-5 h-5 text-accent" />
                                    <span className="text-[10px] font-bold">Telegram</span>
                                </Button>
                                <Button
                                    type="button"
                                    variant={sourceType === 'upload' ? 'default' : 'outline'}
                                    className="h-20 flex-col gap-2 rounded-2xl"
                                    onClick={() => setSourceType('upload')}
                                >
                                    <Upload className="w-5 h-5 text-green-500" />
                                    <span className="text-[10px] font-bold">Upload</span>
                                </Button>
                                <Button
                                    type="button"
                                    variant={sourceType === 'url' ? 'default' : 'outline'}
                                    className="h-20 flex-col gap-2 rounded-2xl"
                                    onClick={() => setSourceType('url')}
                                >
                                    <LinkIcon className="w-5 h-5 text-primary" />
                                    <span className="text-[10px] font-bold">Direct URL</span>
                                </Button>
                            </div>

                            {sourceType === 'telegram' && (
                                <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                    <div className="flex items-center justify-between">
                                        <Label className="text-xs font-bold opacity-70">Telegram File ID</Label>
                                        <a href="https://t.me/" target="_blank" rel="noreferrer" className="text-[10px] flex items-center gap-1 text-accent hover:underline">
                                            {dir === 'rtl' ? "افتح تليجرام" : "Open Telegram"} <ExternalLink className="w-2 h-2" />
                                        </a>
                                    </div>
                                    <Input
                                        value={formData.telegram_file_id}
                                        onChange={e => setFormData({ ...formData, telegram_file_id: e.target.value })}
                                        placeholder="file_id_..."
                                        className="font-mono text-sm h-12 rounded-xl border-primary/20"
                                        required={sourceType === 'telegram'}
                                    />
                                </div>
                            )}

                            {sourceType === 'upload' && (
                                <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                                    {formData.video_path && !selectedFile && (
                                        <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                                <span className="text-xs font-bold text-green-700">Video Hosted Successfully</span>
                                            </div>
                                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setFormData({ ...formData, video_path: "" })}>
                                                <X className="w-3 h-3" />
                                            </Button>
                                        </div>
                                    )}
                                    <div className="relative">
                                        <Input
                                            type="file"
                                            accept="video/*"
                                            onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                                            className="hidden"
                                            id="video-upload"
                                        />
                                        <Label
                                            htmlFor="video-upload"
                                            className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-[1.5rem] bg-accent/5 cursor-pointer hover:bg-accent/10 hover:border-accent transition-all group"
                                        >
                                            <Upload className="w-10 h-10 text-accent mb-3 group-hover:scale-110 transition-transform" />
                                            <p className="font-bold text-sm">
                                                {selectedFile ? selectedFile.name : (dir === 'rtl' ? "اضغط هنا لرفع الفيديو" : "Click to upload video")}
                                            </p>
                                            <p className="text-[10px] text-muted-foreground mt-2 uppercase tracking-widest font-black opacity-50">
                                                MP4, WEBM (MAX 50MB - {dir === 'rtl' ? "الخطة المجانية" : "Free Tier"})
                                            </p>
                                        </Label>
                                    </div>
                                </div>
                            )}

                            {sourceType === 'url' && (
                                <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                    <Label className="text-xs font-bold opacity-70">Direct Video URL</Label>
                                    <Input
                                        value={formData.video_url}
                                        onChange={e => setFormData({ ...formData, video_url: e.target.value })}
                                        placeholder="https://youtube.com/watch?v=... / vimeo.com/... / *.mp4"
                                        className="h-12 rounded-xl"
                                        required={sourceType === 'url'}
                                    />
                                    <p className="text-[10px] text-muted-foreground opacity-60">
                                        {dir === 'rtl'
                                            ? "يدعم روابط YouTube أو Vimeo العادية، بالإضافة للروابط المباشرة (.mp4)"
                                            : "Supports standard YouTube/Vimeo links or direct .mp4 URLs"}
                                    </p>
                                </div>
                            )}
                        </div>

                        <DialogFooter className="pt-6">
                            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={saving} className="h-12 px-6 rounded-xl font-bold">
                                {t.common.cancel}
                            </Button>
                            <Button type="submit" disabled={saving} className="h-12 px-8 rounded-xl font-bold gradient-primary shadow-glow">
                                {saving && <Loader2 className="w-4 h-4 me-2 animate-spin" />}
                                {t.common.save}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent className="rounded-[2rem]">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-2xl font-display font-black">{t.adminLessons.deleteLesson}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t.adminLessons.deleteConfirm?.replace("{title}", lessonToDelete?.title || "")}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="pt-4">
                        <AlertDialogCancel className="h-12 rounded-xl font-bold">{t.common.cancel}</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="h-12 rounded-xl font-bold bg-destructive text-destructive-foreground hover:bg-destructive shadow-lg shadow-destructive/20">
                            {t.common.delete}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </DashboardLayout>
    );
}
