import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
import { Plus, Pencil, Trash2, BookOpen, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

type Course = Tables<"courses">;

interface CourseFormData {
  title: string;
  description: string;
  total_hours: number;
  sessions_count: number;
  price: number;
  points_reward: number;
  points_required: number;
  is_active: boolean;
}

const defaultFormData: CourseFormData = {
  title: "",
  description: "",
  total_hours: 0,
  sessions_count: 0,
  price: 0,
  points_reward: 0,
  points_required: 0,
  is_active: true,
};

export default function AdminCourses() {
  const { t } = useLanguage();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);
  const [formData, setFormData] = useState<CourseFormData>(defaultFormData);
  const { toast } = useToast();

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const { data, error } = await supabase
        .from("courses")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCourses(data || []);
    } catch (error) {
      console.error("Error fetching courses:", error);
      toast({
        title: t.common.error,
        description: t.adminCourses.loadFailed,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (course?: Course) => {
    if (course) {
      setEditingCourse(course);
      setFormData({
        title: course.title,
        description: course.description || "",
        total_hours: course.total_hours || 0,
        sessions_count: course.sessions_count || 0,
        price: Number(course.price) || 0,
        points_reward: course.points_reward || 0,
        points_required: course.points_required || 0,
        is_active: course.is_active ?? true,
      });
    } else {
      setEditingCourse(null);
      setFormData(defaultFormData);
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingCourse(null);
    setFormData(defaultFormData);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast({
        title: t.adminCourses.validationError,
        description: t.adminCourses.titleRequired,
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      if (editingCourse) {
        const { error } = await supabase
          .from("courses")
          .update({
            title: formData.title.trim(),
            description: formData.description.trim(),
            total_hours: formData.total_hours,
            sessions_count: formData.sessions_count,
            price: formData.price,
            points_reward: formData.points_reward,
            points_required: formData.points_required,
            is_active: formData.is_active,
          })
          .eq("id", editingCourse.id);

        if (error) throw error;

        toast({
          title: t.common.success,
          description: t.adminCourses.courseUpdated,
        });
      } else {
        const { error } = await supabase.from("courses").insert({
          title: formData.title.trim(),
          description: formData.description.trim(),
          total_hours: formData.total_hours,
          sessions_count: formData.sessions_count,
          price: formData.price,
          points_reward: formData.points_reward,
          points_required: formData.points_required,
          is_active: formData.is_active,
        });

        if (error) throw error;

        toast({
          title: t.common.success,
          description: t.adminCourses.courseCreated,
        });
      }

      handleCloseDialog();
      fetchCourses();
    } catch (error) {
      console.error("Error saving course:", error);
      toast({
        title: t.common.error,
        description: t.adminCourses.saveFailed,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = (course: Course) => {
    setCourseToDelete(course);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!courseToDelete) return;

    try {
      const { error } = await supabase
        .from("courses")
        .delete()
        .eq("id", courseToDelete.id);

      if (error) throw error;

      toast({
        title: t.common.success,
        description: t.adminCourses.courseDeleted,
      });

      fetchCourses();
    } catch (error) {
      console.error("Error deleting course:", error);
      toast({
        title: t.common.error,
        description: t.adminCourses.deleteFailed,
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setCourseToDelete(null);
    }
  };

  const handleInputChange = (field: keyof CourseFormData, value: string | number | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-display font-bold mb-2">{t.adminCourses.title}</h1>
            <p className="text-muted-foreground">{t.adminCourses.subtitle}</p>
          </div>
          <Button onClick={() => handleOpenDialog()} className="gap-2">
            <Plus className="w-4 h-4" />
            {t.adminCourses.addCourse}
          </Button>
        </div>

        <Card className="border-0 shadow-md">
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : courses.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <BookOpen className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium mb-2">{t.adminCourses.noCourses}</p>
                <p className="text-muted-foreground mb-4">{t.adminCourses.noCoursesDesc}</p>
                <Button onClick={() => handleOpenDialog()} className="gap-2">
                  <Plus className="w-4 h-4" />
                  {t.adminCourses.addCourse}
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t.adminCourses.courseTitle}</TableHead>
                    <TableHead>{t.common.hours}</TableHead>
                    <TableHead>{t.common.sessions}</TableHead>
                    <TableHead>{t.adminCourses.price}</TableHead>
                    <TableHead>{t.adminCourses.pointsReward}</TableHead>
                    <TableHead>{t.adminCourses.pointsRequired}</TableHead>
                    <TableHead>{t.common.status}</TableHead>
                    <TableHead className="text-end">{t.common.actions}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {courses.map((course) => (
                    <TableRow key={course.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{course.title}</p>
                          {course.description && (
                            <p className="text-sm text-muted-foreground line-clamp-1">
                              {course.description}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{course.total_hours || 0}h</TableCell>
                      <TableCell>{course.sessions_count || 0}</TableCell>
                      <TableCell>${Number(course.price || 0).toFixed(2)}</TableCell>
                      <TableCell>{course.points_reward || 0}</TableCell>
                      <TableCell>{course.points_required || 0}</TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            course.is_active
                              ? "bg-success/10 text-success"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {course.is_active ? t.common.active : t.common.inactive}
                        </span>
                      </TableCell>
                      <TableCell className="text-end">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenDialog(course)}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteClick(course)}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingCourse ? t.adminCourses.editCourse : t.adminCourses.createCourse}
            </DialogTitle>
            <DialogDescription>
              {editingCourse ? t.adminCourses.editDesc : t.adminCourses.createDesc}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">{t.adminCourses.courseTitle} *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  placeholder={t.adminCourses.courseTitle}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">{t.adminCourses.description}</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  placeholder={t.adminCourses.description}
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="total_hours">{t.adminCourses.totalHours}</Label>
                  <Input
                    id="total_hours"
                    type="number"
                    min="0"
                    value={formData.total_hours}
                    onChange={(e) => handleInputChange("total_hours", parseInt(e.target.value) || 0)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="sessions_count">{t.adminCourses.sessionsCount}</Label>
                  <Input
                    id="sessions_count"
                    type="number"
                    min="0"
                    value={formData.sessions_count}
                    onChange={(e) => handleInputChange("sessions_count", parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="price">{t.adminCourses.price} ($)</Label>
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => handleInputChange("price", parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="points_reward">{t.adminCourses.pointsReward}</Label>
                  <Input
                    id="points_reward"
                    type="number"
                    min="0"
                    value={formData.points_reward}
                    onChange={(e) => handleInputChange("points_reward", parseInt(e.target.value) || 0)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="points_required">{t.adminCourses.pointsRequired}</Label>
                  <Input
                    id="points_required"
                    type="number"
                    min="0"
                    value={formData.points_required}
                    onChange={(e) => handleInputChange("points_required", parseInt(e.target.value) || 0)}
                  />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => handleInputChange("is_active", checked)}
                />
                <Label htmlFor="is_active">{t.adminCourses.isActive}</Label>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                {t.common.cancel}
              </Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="w-4 h-4 me-2 animate-spin" />}
                {editingCourse ? t.adminCourses.updateCourse : t.adminCourses.createCourseBtn}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.adminCourses.deleteCourse}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.adminCourses.deleteConfirm.replace("{title}", courseToDelete?.title || "")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t.common.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
