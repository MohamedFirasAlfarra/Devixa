import { useState, useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
import { useToast } from "@/hooks/use-toast";
import {
  Users,
  Search,
  BookOpen,
  Calendar,
  Link as LinkIcon,
  MessageCircle,
  Plus,
  Loader2,
  GraduationCap,
  Activity,
  Trash2
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Batch {
  id: string;
  name: string;
  course_id: string;
  current_students: number;
  max_students: number;
  is_active: boolean;
  start_date: string;
  resources_link: string | null;
  telegram_group_link: string | null;
  created_at: string;
  courses: {
    title: string;
  } | null;
}

export default function AdminBatches() {
  const { t, language, dir } = useLanguage();
  const { toast } = useToast();
  const isRTL = dir === "rtl";
  
  const [batches, setBatches] = useState<Batch[]>([]);
  const [courses, setCourses] = useState<{ id: string, title: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Create Dialog State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    course_id: "",
    max_students: "",
    start_date: "",
    telegram_group_link: "",
    resources_link: ""
  });

  // Delete State
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchBatches = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("batches")
        .select(`
          *,
          courses (
            title
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setBatches(data || []);

      const { data: coursesData } = await supabase
        .from("courses")
        .select("id, title")
        .eq("is_active", true);
        
      if (coursesData) {
        setCourses(coursesData);
      }
    } catch (error: any) {
      console.error("Error fetching batches:", error);
      toast({
        title: isRTL ? "خطأ في تحميل الدفعات" : "Error loading batches",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBatches();
  }, []);

  const handleCreateBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.course_id) {
      toast({
        title: isRTL ? "معلومات ناقصة" : "Missing Information",
        description: isRTL ? "يرجى تعبئة اسم الدفعة واختيار الكورس." : "Please provide a batch name and select a course.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const { error } = await supabase
        .from("batches")
        .insert({
          name: formData.name,
          course_id: formData.course_id,
          max_students: formData.max_students ? parseInt(formData.max_students) : null,
          start_date: formData.start_date || null,
          telegram_group_link: formData.telegram_group_link || null,
          resources_link: formData.resources_link || null,
          is_active: true
        });

      if (error) throw error;

      toast({
        title: isRTL ? "تم الإنشاء بنجاح" : "Success",
        description: isRTL ? "تم إنشاء الدفعة وإضافتها للقائمة." : "Learning batch has been successfully created."
      });
      
      setIsCreateOpen(false);
      setFormData({ name: "", course_id: "", max_students: "", start_date: "", telegram_group_link: "", resources_link: "" });
      fetchBatches();
    } catch (error: any) {
      toast({
        title: isRTL ? "حدث خطأ" : "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteBatch = async () => {
    if (!deleteId) return;

    try {
      setIsDeleting(true);
      const { error } = await supabase
        .from("batches")
        .delete()
        .eq("id", deleteId);

      if (error) throw error;

      toast({
        title: isRTL ? "تم الحذف بنجاح" : "Deleted Successfully",
        description: isRTL ? "تم حذف الدفعة من قاعدة البيانات." : "The batch has been removed from the database."
      });
      
      fetchBatches();
    } catch (error: any) {
      toast({
        title: isRTL ? "خطأ في الحذف" : "Deletion Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
      setDeleteId(null);
    }
  };

  const filteredBatches = batches.filter(batch => {
    const searchLower = searchQuery.toLowerCase();
    return (
      batch.name.toLowerCase().includes(searchLower) ||
      (batch.courses?.title && batch.courses.title.toLowerCase().includes(searchLower))
    );
  });

  const totalBatches = batches.length;
  const activeBatches = batches.filter(b => b.is_active).length;
  const totalStudents = batches.reduce((sum, b) => sum + (b.current_students || 0), 0);
  
  const totalCapacity = batches.filter(b => b.is_active).reduce((sum, b) => sum + (b.max_students || 0), 0);
  const capacityPercentage = totalCapacity > 0 ? Math.round((totalStudents / totalCapacity) * 100) : 0;

  const stats = [
    {
      label: t.adminBatches.totalBatches || (isRTL ? "إجمالي الدفعات" : "Total Batches"),
      value: totalBatches,
      icon: GraduationCap,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10"
    },
    {
      label: t.adminBatches.activeBatches || (isRTL ? "الدفعات النشطة" : "Active Batches"),
      value: activeBatches,
      icon: Activity,
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10"
    },
    {
      label: t.adminBatches.totalStudents || (isRTL ? "إجمالي الطلاب" : "Total Students"),
      value: totalStudents,
      icon: Users,
      color: "text-amber-500",
      bgColor: "bg-amber-500/10"
    },
    {
      label: t.adminBatches.capacity || (isRTL ? "القدرة الاستيعابية" : "Capacity Used"),
      value: `${capacityPercentage}%`,
      icon: BookOpen,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10"
    }
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8 pb-8">
        {/* Header content */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold mb-2 text-foreground">{t.nav.batches}</h1>
            <p className="text-muted-foreground">{t.adminBatches.subtitle}</p>
          </div>
          <Button 
            onClick={() => setIsCreateOpen(true)}
            className="gradient-primary text-white border-0 shrink-0 shadow-lg hover:scale-[1.02] transition-transform"
          >
            <Plus className="w-5 h-5 me-2" />
            {t.adminBatches.createBatch || (isRTL ? "إنشاء دفعة" : "Create Batch")}
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300"
            >
              <div className="flex items-center gap-4">
                <div className={cn("p-3 rounded-xl", stat.bgColor, stat.color)}>
                  <stat.icon className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-sm text-muted-foreground font-medium">{stat.label}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Search Bar */}
        <div className="bg-card border border-border/50 rounded-2xl p-4 shadow-sm">
          <div className="relative max-w-md">
            <Search className={cn("absolute top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground", isRTL ? "right-3" : "left-3")} />
            <Input
              type="text"
              placeholder={t.adminBatches.searchPlaceholder || (isRTL ? "ابحث بالاسم أو الدورة..." : "Search by name or course...")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={cn("bg-background", isRTL ? "pr-9" : "pl-9")}
            />
          </div>
        </div>

        {/* Batches Grid */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredBatches.length === 0 ? (
          <div className="bg-card border border-border/50 rounded-2xl p-12 text-center">
            <GraduationCap className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-xl font-bold mb-2">{t.adminBatches.noBatches || (isRTL ? "لا توجد دفعات" : "No Batches Found")}</h3>
            <p className="text-muted-foreground">
              {(isRTL ? "لم يتم العثور على دفعات مطابقة لبحثك." : "No learning batches found matching your search criteria.")}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            <AnimatePresence>
              {filteredBatches.map((batch, index) => (
                <motion.div
                  key={batch.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="group bg-card border border-border/50 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:border-primary/30 transition-all duration-300"
                >
                  {/* Card Header */}
                  <div className="relative p-6 border-b border-border/50 bg-gradient-to-br from-background to-muted/30">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-foreground mb-1 group-hover:text-primary transition-colors line-clamp-1">{batch.name}</h3>
                        <div className="flex items-center text-sm text-muted-foreground mt-2">
                          <BookOpen className="w-4 h-4 me-1.5 shrink-0" />
                          <span className="truncate">{batch.courses?.title || (isRTL ? "دورة غير معروفة" : "Unknown Course")}</span>
                        </div>
                      </div>
                      <Badge 
                        variant={batch.is_active ? "default" : "secondary"}
                        className={cn(
                          "shrink-0",
                          batch.is_active ? "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20" : ""
                        )}
                      >
                        {batch.is_active 
                          ? (t.adminBatches.statusActive || (isRTL ? "نشطة" : "Active")) 
                          : (t.adminBatches.statusInactive || (isRTL ? "مكتملة" : "Completed"))}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteId(batch.id)}
                        className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 -mt-1 -me-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5" />
                          {t.adminBatches.students || (isRTL ? "الطلاب" : "Students")}
                        </span>
                        <p className="font-semibold text-lg">
                          {batch.current_students || 0} <span className="text-sm font-normal text-muted-foreground">/ {batch.max_students || "∞"}</span>
                        </p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" />
                          {t.adminBatches.startDate || (isRTL ? "البدء" : "Started")}
                        </span>
                        <p className="font-semibold">{batch.start_date ? new Date(batch.start_date).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US') : '-'}</p>
                      </div>
                    </div>

                    {/* Progress Bar for capacity */}
                    {batch.max_students && batch.max_students > 0 ? (
                      <div className="space-y-1.5 pt-2">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{isRTL ? "الاستيعاب" : "Capacity"}</span>
                          <span>{Math.round(((batch.current_students || 0) / batch.max_students) * 100)}%</span>
                        </div>
                        <div className="h-2 w-full bg-muted/50 rounded-full overflow-hidden">
                          <div 
                            className={cn(
                              "h-full rounded-full transition-all duration-500",
                              ((batch.current_students || 0) / batch.max_students) >= 1 ? "bg-destructive" :
                              ((batch.current_students || 0) / batch.max_students) > 0.8 ? "bg-amber-500" : "bg-primary"
                            )}
                            style={{ width: `${Math.min(((batch.current_students || 0) / batch.max_students) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                    ) : null}

                    {/* Links */}
                    <div className="pt-4 flex gap-2 border-t border-border/50">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 border-muted-foreground/20 hover:bg-primary/5 hover:text-primary hover:border-primary/30"
                        disabled={!batch.telegram_group_link}
                        onClick={() => batch.telegram_group_link && window.open(batch.telegram_group_link, '_blank')}
                      >
                        <MessageCircle className="w-4 h-4 me-2" />
                        <span className="text-xs">{t.adminBatches.telegramGroup || (isRTL ? "المجموعة" : "Group")}</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 border-muted-foreground/20 hover:bg-primary/5 hover:text-primary hover:border-primary/30"
                        disabled={!batch.resources_link}
                        onClick={() => batch.resources_link && window.open(batch.resources_link, '_blank')}
                      >
                        <LinkIcon className="w-4 h-4 me-2" />
                        <span className="text-xs">{t.adminBatches.resources || (isRTL ? "المصادر" : "Resources")}</span>
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Create Batch Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className={cn("sm:max-w-[500px]", dir === "rtl" && "font-cairo")} dir={dir}>
          <DialogHeader>
            <DialogTitle>{t.adminBatches.addBatchTitle || (isRTL ? "إضافة دفعة جديدة" : "Add New Batch")}</DialogTitle>
            <DialogDescription>
              {t.adminBatches.addBatchDesc || (isRTL ? "تكوين تفاصيل دفعة تعليمية جديدة." : "Configure details for a new learning batch.")}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateBatch} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">{isRTL ? "اسم الدفعة" : "Batch Name"} *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={isRTL ? "مثال: دفعة برمجة الويب 1" : "e.g., Web Dev Batch 1"}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="course">{t.adminBatches.course || (isRTL ? "الكورس" : "Course")} *</Label>
              <select
                id="course"
                value={formData.course_id}
                onChange={(e) => setFormData({ ...formData, course_id: e.target.value })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                required
              >
                <option value="" disabled>
                  {isRTL ? "اختر الكورس" : "Select a Course"}
                </option>
                {courses.map(course => (
                  <option key={course.id} value={course.id}>
                    {course.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="max_students">{t.adminBatches.capacity || (isRTL ? "القدرة الاستيعابية" : "Max Students")}</Label>
                <Input
                  id="max_students"
                  type="number"
                  min="0"
                  value={formData.max_students}
                  onChange={(e) => setFormData({ ...formData, max_students: e.target.value })}
                  placeholder={isRTL ? "الحد الأقصى للطلاب" : "Unlimited if empty"}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="start_date">{t.adminBatches.startDate || (isRTL ? "تاريخ البدء" : "Start Date")}</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="telegram">{t.adminBatches.telegramGroup || (isRTL ? "مجموعة التلغرام" : "Telegram Group")} (Optional)</Label>
              <Input
                id="telegram"
                type="url"
                value={formData.telegram_group_link}
                onChange={(e) => setFormData({ ...formData, telegram_group_link: e.target.value })}
                placeholder="https://t.me/..."
                className="text-left"
                dir="ltr"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="resources">{t.adminBatches.resources || (isRTL ? "المصادر" : "Resources Link")} (Optional)</Label>
              <Input
                id="resources"
                type="url"
                value={formData.resources_link}
                onChange={(e) => setFormData({ ...formData, resources_link: e.target.value })}
                placeholder="https://drive.google.com/..."
                className="text-left"
                dir="ltr"
              />
            </div>

            <div className="pt-4 flex justify-end gap-2 border-t">
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                {t.common.cancel || (isRTL ? "إلغاء" : "Cancel")}
              </Button>
              <Button type="submit" disabled={isSubmitting} className="gradient-primary text-white border-0">
                {isSubmitting && <Loader2 className="w-4 h-4 me-2 animate-spin" />}
                {t.adminBatches.saveBatchBtn || (isRTL ? "إنشاء الدفعة" : "Create Batch")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Alert */}
      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent className={cn(dir === "rtl" && "font-cairo")} dir={dir}>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isRTL ? "هل أنت متأكد من الحذف؟" : "Are you absolutely sure?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isRTL 
                ? "سيؤدي هذا الإجراء إلى حذف الدفعة نهائياً من النظام. لا يمكن التراجع عن هذه الخطوة." 
                : "This action cannot be undone. This will permanently delete the batch and remove it from our servers."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel disabled={isDeleting}>
              {t.common.cancel || (isRTL ? "إلغاء" : "Cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDeleteBatch();
              }}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : (isRTL ? "حذف نهائي" : "Delete Permanently")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
