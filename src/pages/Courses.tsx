import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { BookOpen, Clock, Users, Tag, Check, Info, Wallet, CreditCard, Send } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import CourseDetailsModal from "@/components/courses/CourseDetailsModal";

interface Course {
  id: string;
  title: string;
  description: string;
  total_hours: number;
  sessions_count: number;
  price: number;
  price_syp: number;
  image_url: string | null;
}

interface Offer {
  id: string;
  course_id: string;
  discount_percentage: number;
  max_students: number | null;
  used_count: number;
}

interface Enrollment {
  course_id: string;
}

export default function Courses() {
  const { user, profile, refreshProfile } = useAuth();
  const { t } = useLanguage();
  const [courses, setCourses] = useState<Course[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState<string | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      const { data: coursesData } = await supabase
        .from("courses")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (coursesData) {
        setCourses(coursesData);
      }

      const { data: offersData } = await supabase
        .from("offers")
        .select("*")
        .eq("is_active", true);

      if (offersData) {
        setOffers(offersData);
      }

      if (user) {
        const { data: enrollmentData } = await supabase
          .from("enrollments")
          .select("course_id")
          .eq("user_id", user.id);

        if (enrollmentData) {
          setEnrollments(enrollmentData);
        }
      }
    } catch (error) {
      console.error("Error fetching courses:", error);
    } finally {
      setLoading(false);
    }
  };

  const getOfferForCourse = (courseId: string) => {
    return offers.find(
      (o) =>
        o.course_id === courseId &&
        (o.max_students === null || o.used_count < o.max_students)
    );
  };

  const isEnrolled = (courseId: string) => {
    return enrollments.some((e) => e.course_id === courseId);
  };

  const handleEnrollClick = (course: Course) => {
    setSelectedCourse(course);
    setPaymentModalOpen(true);
  };

  const handleEnroll = async (course: Course, paymentMethod?: string) => {
    if (!user) return;

    setEnrolling(course.id);

    try {
      const { data: batches } = await supabase
        .from("batches")
        .select("*")
        .eq("course_id", course.id)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1);

      const batchId = batches?.[0]?.id || null;

      const { error: enrollError } = await supabase.from("enrollments").insert({
        user_id: user.id,
        course_id: course.id,
        batch_id: batchId,
        payment_method: paymentMethod || "cash",
      });

      if (enrollError) throw enrollError;

      toast({
        title: t.courses.enrollSuccess,
        description: t.courses.enrollSuccessDesc.replace("{course}", course.title),
      });

      const { data: enrollmentData } = await supabase
        .from("enrollments")
        .select("course_id")
        .eq("user_id", user.id);

      if (enrollmentData) {
        setEnrollments(enrollmentData);
      }
    } catch (error: any) {
      toast({
        title: t.courses.enrollFailed,
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    } finally {
      setEnrolling(null);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-pulse text-muted-foreground">{t.common.loading}</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-display font-bold mb-2">{t.courses.title}</h1>
          <p className="text-muted-foreground">
            {t.courses.subtitle}
          </p>
        </div>

        {/* Courses grid */}
        {courses.length === 0 ? (
          <Card className="border-0 shadow-md">
            <CardContent className="p-12 text-center">
              <BookOpen className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">{t.courses.noCourses}</h3>
              <p className="text-muted-foreground">
                {t.courses.noCoursesDesc}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => {
              const offer = getOfferForCourse(course.id);
              const enrolled = isEnrolled(course.id);
              const discountedPrice = offer
                ? course.price * (1 - offer.discount_percentage / 100)
                : course.price;

              return (
                <Card
                  key={course.id}
                  className="border-0 shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden group"
                >
                  {/* Course image placeholder */}
                  <div
                    className="h-40 gradient-hero flex items-center justify-center cursor-pointer overflow-hidden p-0"
                    onClick={() => {
                      setSelectedCourse(course);
                      setIsModalOpen(true);
                    }}
                  >
                    {course.image_url ? (
                      <img
                        src={course.image_url}
                        alt={course.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    ) : (
                      <BookOpen className="w-16 h-16 text-primary-foreground/50 group-hover:scale-110 transition-transform" />
                    )}
                  </div>

                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-lg line-clamp-2">
                        {course.title}
                      </CardTitle>
                      {offer && (
                        <Badge className="gradient-accent text-accent-foreground shrink-0">
                          {offer.discount_percentage}% {t.courses.off}
                        </Badge>
                      )}
                    </div>
                    <CardDescription className="line-clamp-2">
                      {course.description}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Course info */}
                    <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {course.total_hours} {t.common.hours}
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {course.sessions_count} {t.common.sessions}
                      </div>
                    </div>

                    {/* Pricing */}
                    <div className="flex flex-col gap-1">
                      <div className="flex items-baseline gap-2">
                        {offer ? (
                          <>
                            <span className="text-2xl font-bold">
                              ${discountedPrice.toFixed(0)}
                            </span>
                            <span className="text-lg text-muted-foreground line-through">
                              ${course.price}
                            </span>
                          </>
                        ) : (
                          <span className="text-2xl font-bold">${course.price}</span>
                        )}
                      </div>
                      <div className="text-sm font-medium text-muted-foreground">
                        {Number(course.price_syp || 0).toLocaleString()} ل.س
                      </div>
                    </div>

                    {offer && offer.max_students && (
                      <div className="flex items-center gap-1 text-sm text-warning">
                        <Tag className="w-4 h-4" />
                        {offer.max_students - offer.used_count} spots left
                      </div>
                    )}

                    {/* Actions */}
                    <div className="space-y-2 pt-2">
                      <Button
                        variant="outline"
                        className="w-full mb-1"
                        onClick={() => {
                          setSelectedCourse(course);
                          setIsModalOpen(true);
                        }}
                      >
                        <Info className="w-4 h-4 me-2" />
                        {t.comments.viewDetails}
                      </Button>

                      {enrolled ? (
                        <Button className="w-full" disabled variant="secondary">
                          <Check className="w-4 h-4 me-2" />
                          {t.courses.enrolled}
                        </Button>
                      ) : (
                        <Button
                          className="w-full gradient-primary hover:opacity-90"
                          onClick={() => handleEnrollClick(course)}
                          disabled={enrolling === course.id}
                        >
                          {enrolling === course.id
                            ? t.courses.enrolling
                            : `${t.courses.enroll} - $${discountedPrice.toFixed(0)}`}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <CourseDetailsModal
        course={selectedCourse}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />

      {/* Payment Selection Modal */}
      <Dialog open={paymentModalOpen} onOpenChange={setPaymentModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t.courses.selectPaymentMethod}</DialogTitle>
            <DialogDescription>
              {selectedCourse?.title}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <RadioGroup
              defaultValue="shamiCash"
              onValueChange={setSelectedPaymentMethod}
              className="grid gap-3"
            >
              <div className="flex items-center space-x-3 space-x-reverse border p-4 rounded-xl hover:bg-muted/50 transition-colors cursor-pointer group">
                <RadioGroupItem value="shamiCash" id="shamiCash" />
                <Label
                  htmlFor="shamiCash"
                  className="flex flex-1 items-center gap-3 cursor-pointer justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      <Wallet className="w-5 h-5" />
                    </div>
                    <span className="font-medium">{t.courses.paymentMethods.shamiCash}</span>
                  </div>
                </Label>
              </div>

              <div className="flex items-center space-x-3 space-x-reverse border p-4 rounded-xl hover:bg-muted/50 transition-colors cursor-pointer group">
                <RadioGroupItem value="syriatelCash" id="syriatelCash" />
                <Label
                  htmlFor="syriatelCash"
                  className="flex flex-1 items-center gap-3 cursor-pointer justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <span className="font-medium">{t.courses.paymentMethods.syriatelCash}</span>
                  </div>
                </Label>
              </div>

              <div className="flex items-center space-x-3 space-x-reverse border p-4 rounded-xl hover:bg-muted/50 transition-colors cursor-pointer group">
                <RadioGroupItem value="alHaram" id="alHaram" />
                <Label
                  htmlFor="alHaram"
                  className="flex flex-1 items-center gap-3 cursor-pointer justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      <Send className="w-5 h-5" />
                    </div>
                    <span className="font-medium">{t.courses.paymentMethods.alHaram}</span>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPaymentModalOpen(false)}
            >
              {t.common.cancel}
            </Button>
            <Button
              onClick={() => {
                if (selectedCourse) {
                  handleEnroll(selectedCourse, selectedPaymentMethod || "shamiCash");
                  setPaymentModalOpen(false);
                }
              }}
              className="gradient-primary"
            >
              {t.courses.enroll}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}

