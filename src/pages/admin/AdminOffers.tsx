import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Plus, Pencil, Trash2, Tag, Loader2, BookOpen } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

type Offer = Tables<"offers">;
type Course = Tables<"courses">;

interface OfferFormData {
    course_id: string;
    discount_percentage: number;
    max_students: number | null;
    is_active: boolean;
    expires_at: string | null;
}

const defaultFormData: OfferFormData = {
    course_id: "",
    discount_percentage: 0,
    max_students: null,
    is_active: true,
    expires_at: null,
};

export default function AdminOffers() {
    const { t } = useLanguage();
    const [offers, setOffers] = useState<(Offer & { courses: Course })[]>([]);
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [editingOffer, setEditingOffer] = useState<Offer | null>(null);
    const [offerToDelete, setOfferToDelete] = useState<Offer | null>(null);
    const [formData, setFormData] = useState<OfferFormData>(defaultFormData);
    const { toast } = useToast();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [offersResult, coursesResult] = await Promise.all([
                supabase
                    .from("offers")
                    .select("*, courses(*)")
                    .order("created_at", { ascending: false }),
                supabase.from("courses").select("*").eq("is_active", true),
            ]);

            if (offersResult.error) throw offersResult.error;
            if (coursesResult.error) throw coursesResult.error;

            setOffers(offersResult.data as (Offer & { courses: Course })[] || []);
            setCourses(coursesResult.data || []);
        } catch (error) {
            console.error("Error fetching data:", error);
            toast({
                title: t.common.error,
                description: "Failed to load offers or courses.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleOpenDialog = (offer?: Offer & { courses: Course }) => {
        if (offer) {
            setEditingOffer(offer);
            setFormData({
                course_id: offer.course_id,
                discount_percentage: offer.discount_percentage,
                max_students: offer.max_students,
                is_active: offer.is_active ?? true,
                expires_at: offer.expires_at,
            });
        } else {
            setEditingOffer(null);
            setFormData({
                ...defaultFormData,
                course_id: courses.length > 0 ? courses[0].id : "",
            });
        }
        setDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setDialogOpen(false);
        setEditingOffer(null);
        setFormData(defaultFormData);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.course_id || formData.course_id === "") {
            toast({
                title: t.adminOffers.validationError,
                description: t.adminOffers.selectCourseError,
                variant: "destructive",
            });
            return;
        }

        if (formData.discount_percentage <= 0) {
            toast({
                title: t.adminOffers.validationError,
                description: t.adminOffers.discountError,
                variant: "destructive",
            });
            return;
        }

        setSaving(true);
        try {
            if (editingOffer) {
                const { error } = await supabase
                    .from("offers")
                    .update({
                        course_id: formData.course_id,
                        discount_percentage: formData.discount_percentage,
                        max_students: formData.max_students,
                        is_active: formData.is_active,
                        expires_at: formData.expires_at,
                    })
                    .eq("id", editingOffer.id);

                if (error) throw error;

                toast({
                    title: t.common.success,
                    description: t.adminOffers.updateSuccess,
                });
            } else {
                const { error } = await supabase.from("offers").insert({
                    course_id: formData.course_id,
                    discount_percentage: formData.discount_percentage,
                    max_students: formData.max_students,
                    is_active: formData.is_active,
                    expires_at: formData.expires_at,
                });

                if (error) throw error;

                toast({
                    title: t.common.success,
                    description: t.adminOffers.createSuccess,
                });
            }

            handleCloseDialog();
            fetchData();
        } catch (error) {
            console.error("Error saving offer:", error);
            toast({
                title: t.common.error,
                description: t.adminOffers.saveError,
                variant: "destructive",
            });
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteClick = (offer: Offer) => {
        setOfferToDelete(offer);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!offerToDelete) return;

        try {
            const { error } = await supabase
                .from("offers")
                .delete()
                .eq("id", offerToDelete.id);

            if (error) throw error;

            toast({
                title: t.common.success,
                description: t.adminOffers.deleteSuccess,
            });

            fetchData();
        } catch (error) {
            console.error("Error deleting offer:", error);
            toast({
                title: t.common.error,
                description: t.adminOffers.deleteError,
                variant: "destructive",
            });
        } finally {
            setDeleteDialogOpen(false);
            setOfferToDelete(null);
        }
    };

    const handleInputChange = (field: keyof OfferFormData, value: any) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    return (
        <DashboardLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-display font-bold mb-2">{t.nav.offers}</h1>
                        <p className="text-muted-foreground">{t.adminOffers.subtitle}</p>
                    </div>
                    <Button onClick={() => handleOpenDialog()} className="gap-2 gradient-accent text-accent-foreground">
                        <Plus className="w-4 h-4" />
                        {t.adminOffers.addOffer}
                    </Button>
                </div>

                <Card className="border-0 shadow-md">
                    <CardContent className="p-0">
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                            </div>
                        ) : offers.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <Tag className="w-12 h-12 text-muted-foreground mb-4" />
                                <p className="text-lg font-medium mb-2">{t.adminOffers.noOffers}</p>
                                <p className="text-muted-foreground mb-4">{t.adminOffers.noOffersDesc}</p>
                                <Button onClick={() => handleOpenDialog()} className="gap-2">
                                    <Plus className="w-4 h-4" />
                                    {t.adminOffers.addOffer}
                                </Button>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>{t.adminOffers.course}</TableHead>
                                        <TableHead>{t.adminOffers.discount}</TableHead>
                                        <TableHead>{t.adminOffers.originalPrice}</TableHead>
                                        <TableHead>{t.adminOffers.offerPrice}</TableHead>
                                        <TableHead>{t.adminOffers.usage}</TableHead>
                                        <TableHead>{t.adminOffers.expiryDate}</TableHead>
                                        <TableHead>{t.common.status}</TableHead>
                                        <TableHead className="text-end">{t.common.actions}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {offers.map((offer) => {
                                        const originalPrice = offer.courses.price || 0;
                                        const discountedPrice = originalPrice * (1 - offer.discount_percentage / 100);
                                        return (
                                            <TableRow key={offer.id}>
                                                <TableCell className="font-medium">{offer.courses.title}</TableCell>
                                                <TableCell>
                                                    <Badge variant="secondary" className="bg-accent/10 text-accent">
                                                        {offer.discount_percentage}% {t.courses.off}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-muted-foreground line-through">${originalPrice.toFixed(2)}</TableCell>
                                                <TableCell className="font-bold text-primary">${discountedPrice.toFixed(2)}</TableCell>
                                                <TableCell>
                                                    {offer.used_count || 0} / {offer.max_students || "\u221E"}
                                                </TableCell>
                                                <TableCell className="text-sm">
                                                    {offer.expires_at
                                                        ? new Date(offer.expires_at).toLocaleString()
                                                        : t.adminOffers.unlimited}
                                                </TableCell>
                                                <TableCell>
                                                    <span
                                                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${offer.is_active
                                                            ? "bg-success/10 text-success"
                                                            : "bg-muted text-muted-foreground"
                                                            }`}
                                                    >
                                                        {offer.is_active ? t.common.active : t.common.inactive}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-end">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => handleOpenDialog(offer)}
                                                        >
                                                            <Pencil className="w-4 h-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => handleDeleteClick(offer)}
                                                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Create/Edit Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>
                            {editingOffer ? t.adminOffers.editTitle : t.adminOffers.createTitle}
                        </DialogTitle>
                        <DialogDescription>
                            {t.adminOffers.dialogDesc}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit}>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="course">{t.adminOffers.selectCourse}</Label>
                                <Select
                                    value={formData.course_id}
                                    onValueChange={(value) => handleInputChange("course_id", value)}
                                    disabled={!!editingOffer}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder={t.adminOffers.selectPlaceholder} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {courses.length === 0 ? (
                                            <SelectItem value="none" disabled>
                                                {t.adminOffers.noCourses}
                                            </SelectItem>
                                        ) : (
                                            courses.map((course) => (
                                                <SelectItem key={course.id} value={course.id}>
                                                    {course.title} (${course.price})
                                                </SelectItem>
                                            ))
                                        )}
                                    </SelectContent>
                                </Select>
                                {courses.length === 0 && (
                                    <p className="text-[10px] text-destructive font-medium mt-1">
                                        {t.adminOffers.mustCreateCourse}
                                    </p>
                                )}
                                {!editingOffer && courses.length > 0 && (
                                    <p className="text-[10px] text-muted-foreground">
                                        {t.adminOffers.courseHint.split("{link}").map((part, i, arr) => (
                                            <span key={i}>
                                                {part}
                                                {i < arr.length - 1 && (
                                                    <a href="/admin/courses" className="text-primary hover:underline">
                                                        {t.nav.courses}
                                                    </a>
                                                )}
                                            </span>
                                        ))}
                                    </p>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="discount">{t.adminOffers.discountLabel}</Label>
                                    <Input
                                        id="discount"
                                        type="number"
                                        min="1"
                                        max="100"
                                        value={formData.discount_percentage}
                                        onChange={(e) => handleInputChange("discount_percentage", parseInt(e.target.value) || 0)}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="max_students">{t.adminOffers.maxStudents}</Label>
                                    <Input
                                        id="max_students"
                                        type="number"
                                        min="1"
                                        placeholder={t.adminOffers.unlimited}
                                        value={formData.max_students || ""}
                                        onChange={(e) => handleInputChange("max_students", parseInt(e.target.value) || null)}
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <Switch
                                    id="offer_active"
                                    checked={formData.is_active}
                                    onCheckedChange={(checked) => handleInputChange("is_active", checked)}
                                />
                                <Label htmlFor="offer_active">{t.adminOffers.isActive}</Label>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="expires_at">{t.adminOffers.expiryDate}</Label>
                                <Input
                                    id="expires_at"
                                    type="datetime-local"
                                    value={formData.expires_at ? formData.expires_at.slice(0, 16) : ""}
                                    onChange={(e) => handleInputChange("expires_at", e.target.value || null)}
                                />
                                <p className="text-[10px] text-muted-foreground">
                                    {t.adminOffers.dialogDesc}
                                </p>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={handleCloseDialog}>
                                {t.common.cancel}
                            </Button>
                            <Button type="submit" disabled={saving} className="gradient-primary">
                                {saving && <Loader2 className="w-4 h-4 me-2 animate-spin" />}
                                {editingOffer ? t.adminOffers.updateBtn : t.adminOffers.createBtn}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>{t.adminOffers.deleteTitle}</AlertDialogTitle>
                        <AlertDialogDescription>
                            {t.adminOffers.deleteConfirm}
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
