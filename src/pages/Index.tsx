import * as React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import ThemeToggle from "@/components/ThemeToggle";
import { GraduationCap, BookOpen, Star, Users, ArrowRight, ArrowLeft, Play, FileText, Sparkles, Award, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, } from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import img1 from "../../public/images/course-web.png";
import img2 from "../../public/images/course-mobile.png";
import img3 from "../../public/images/course-UIUX.png";

import logo from "../../public/logos/logo1.png";
import logo2 from "../../public/logos/logo2.png";

export default function Index() {
  const { user, isAdmin } = useAuth();
  const { t, dir, language } = useLanguage();
  const ArrowIcon = dir === "rtl" ? ArrowLeft : ArrowRight;
  const slides = [
    {
      title: language === "ar" ? "تطوير مواقع ويب" : "Web Development",
      subtitle: language === "ar" ? "ابدأ رحلتك في عالم البرمجة" : "Start your journey in the world of programming",
      description: language === "ar" ? "تعلم بناء تطبيقات ويب متكاملة من الصفر حتى الاحتراف باستخدام أحدث التقنيات العالمية." : "Learn to build complete web applications from scratch to professional level using latest global technologies.",
      image: img1,
      gradient: "from-blue-600/20 to-cyan-600/20"
    },
    {
      title: language === "ar" ? "تطوير تطبيقات موبايل" : "Mobile App Development",
      subtitle: language === "ar" ? "صمم تطبيقاتك المفضلة" : "Design your favorite apps",
      description: language === "ar" ? "احترف تطوير تطبيقات الهواتف الذكية لنظامي Android و iOS باستخدام أحدث لغات البرمجة." : "Master smart phone app development for Android and iOS using modern programming languages.",
      image: img2,
      gradient: "from-purple-600/20 to-pink-600/20"
    },
    {
      title: language === "ar" ? "UI/UX Designer" : "UI/UX Designer",
      subtitle: language === "ar" ? "جمال التصميم وسهولة الاستخدام" : "Design Beauty & Ease of Use",
      description: language === "ar" ? "تعلم فن تصميم واجهات المستخدم وتجربة المستخدم لخلق منتجات رقمية مبهرة وجذابة." : "Learn the art of UI/UX design to create stunning and engaging digital products.",
      image: img3,
      gradient: "from-emerald-600/20 to-teal-600/20"
    },
    {
      title: language === "ar" ? "كورس ICDL كامل" : "Full ICDL Course",
      subtitle: language === "ar" ? "إتقان المهارات الحاسوبية" : "Master Computer Skills",
      description: language === "ar" ? "احصل على المهارات الأساسية في الحاسوب والبرامج المكتبية بشهادة معترف بها دولياً." : "Gain essential computer and office software skills with an internationally recognized certificate.",
      image: "/images/hero.png",
      gradient: "from-amber-600/20 to-orange-600/20"
    }
  ];

  const features = [
    {
      icon: BookOpen,
      title: t.landing.features.premiumCourses,
      description: t.landing.features.premiumCoursesDesc,
      gradient: "from-blue-500 to-cyan-500"
    },
    {
      icon: Star,
      title: t.landing.features.earnPoints,
      description: t.landing.features.earnPointsDesc,
      gradient: "from-amber-400 to-orange-500"
    },
    {
      icon: Users,
      title: t.landing.features.joinBatches,
      description: t.landing.features.joinBatchesDesc,
      gradient: "from-purple-500 to-pink-500"
    },
  ];

  const featuredCourses = [
    {
      title: language === "ar" ? "تطوير الويب الشامل" : "Full Stack Web Development",
      category: language === "ar" ? "مسار الويب" : "Web Development",
      image: "/images/course-web.png"
    },
    {
      title: language === "ar" ? "تطوير تطبيقات الموبايل" : "Mobile App Development",
      category: language === "ar" ? "مسار الموبايل" : "Mobile Development",
      image: "/images/course-mobile.png"
    },
    {
      title: language === "ar" ? "الذكاء الاصطناعي" : "Artificial Intelligence",
      category: language === "ar" ? "مسار البيانات" : "Data Science",
      image: "/images/course-ai.png"
    }
  ];

  const [api, setApi] = React.useState<any>();
  const [current, setCurrent] = React.useState(0);
  React.useEffect(() => {
    if (!api) return;

    setCurrent(api.selectedScrollSnap());
    api.on("select", () => {
      setCurrent(api.selectedScrollSnap());
    });
  }, [api]);

  return (
    <div className="min-h-screen bg-background" dir={dir}>
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 glass-gooey transition-all duration-500 pt-2">
        <div className="container mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-2 group cursor-pointer">
            <Link to="/">
              {/* Mobile Logo */}
              <img src={logo2} alt="Devixa Logo" className="h-24 w-auto object-contain hover:scale-105 transition-transform block md:hidden" />
              {/* Desktop Logo */}
              <img src={logo} alt="Devixa Logo" className="h-32 w-44 object-contain hover:scale-105 transition-transform hidden md:block" />
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <LanguageSwitcher />
            {user ? (
              <Link to={isAdmin ? "/admin" : "/dashboard"}>
                <Button variant="default" className="rounded-full px-6 shadow-glow">
                  {t.landing.goToDashboard}
                </Button>
              </Link>
            ) : (
              <Link to="/auth">
                <Button variant="default" className="rounded-full px-6 shadow-glow">
                  {t.common.signIn}
                </Button>
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Slider Section */}
      <section className="relative min-h-[90vh] flex items-center overflow-hidden bg-background">
        <Carousel
          setApi={setApi}
          className="w-full h-full pt-20"
          opts={{
            align: "start",
            loop: true,
            direction: dir,
          }}
          plugins={[
            Autoplay({
              delay: 3000,
              stopOnInteraction: false,
            }),
          ]}
        >
          <CarouselContent className="h-full">
            {slides.map((slide, index) => (
              <CarouselItem key={index} className="basis-full h-full">
                <div className="container mx-auto px-6 grid md:grid-cols-2 gap-12 items-center min-h-[75vh] py-10 relative">
                  <div className={cn(
                    "absolute -z-10 w-full h-full blur-[120px] opacity-20",
                    slide.gradient
                  )} />

                  <div className="space-y-8 animate-fade-in">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border-primary/20 text-primary font-semibold text-sm animate-bounce shadow-glow">
                      {t.landing.firstTwoFree}
                    </div>
                    <div className="space-y-4">
                      <h2 className="text-xl md:text-2xl font-display font-bold text-accent uppercase tracking-wider">{slide.subtitle}</h2>
                      <h1 className="text-5xl lg:text-[4.5rem] font-display font-black leading-[1.1] tracking-tight text-foreground">
                        {slide.title}
                      </h1>
                    </div>
                    <p className="text-xl text-muted-foreground max-w-lg leading-relaxed">
                      {slide.description}
                    </p>
                    <div className="flex flex-wrap gap-4 pt-4">
                      <Link to="/auth?signup=true">
                        <Button size="lg" className="rounded-full px-8 text-lg h-14 shadow-glow group gradient-primary border-none text-white transition-all hover:scale-105">
                          {t.landing.registerNow}
                          <ArrowIcon className="w-5 h-5 ms-2 group-hover:translate-x-1 transition-transform" />
                        </Button>
                      </Link>
                      <Link to="/courses">
                        <Button size="lg" variant="outline" className="rounded-full px-8 text-lg h-14 glass text-foreground border-border/40 hover:bg-accent/10 transition-all hover:scale-105">
                          <Play className="w-5 h-5 me-2 fill-primary text-primary" />
                          {t.landing.startLearning}
                        </Button>
                      </Link>
                    </div>
                  </div>

                  <div className="relative animate-float block">
                    <div className="absolute -inset-10 bg-primary/20 blur-[100px] rounded-full animate-pulse" />
                    <div className="relative rounded-[2.5rem] overflow-hidden border border-white/20 shadow-2xl glass-dark group aspect-[16/10]">
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
                      <img
                        src={slide.image}
                        alt={slide.title}
                        className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
                      />
                      <div className="absolute bottom-6 left-6 right-6 p-6 glass rounded-2xl border-white/10 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                        <p className="text-white text-sm font-medium">{t.landing.joinPlatformDesc}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>

          <div className="absolute inset-y-0 left-4 lg:left-8 flex items-center z-30">
            <CarouselPrevious className="static h-12 w-12 rounded-full border-border bg-background/50 text-foreground hover:bg-accent/20 transition-all hover:scale-110 shadow-lg" />
          </div>
          <div className="absolute inset-y-0 right-4 lg:right-8 flex items-center z-30">
            <CarouselNext className="static h-12 w-12 rounded-full border-border bg-background/50 text-foreground hover:bg-accent/20 transition-all hover:scale-110 shadow-lg" />
          </div>

          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-3 z-30">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => api?.scrollTo(index)}
                className={cn(
                  "w-3 h-3 rounded-full transition-all duration-300",
                  current === index
                    ? "bg-primary w-8 shadow-glow"
                    : "bg-primary/20 hover:bg-primary/40"
                )}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </Carousel>
      </section>

      {/* Featured Courses */}
      <section className="py-24 bg-secondary/10 min-h-screen">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
            <div className="space-y-4">
              <h2 className="text-4xl font-display font-bold">{t.landing.featuredCourses}</h2>
              <p className="text-muted-foreground max-w-md">{t.landing.featuredCoursesDesc}</p>
            </div>
            <Link to="/courses">
              <Button variant="link" className="text-primary font-bold gap-2 text-lg">
                {t.common.viewAll} <ArrowIcon className="w-5 h-5" />
              </Button>
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {featuredCourses.map((course, i) => (
              <div
                key={i}
                className="group relative bg-card rounded-3xl overflow-hidden shadow-lg hover-lift hover-glow border border-transparent"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="h-52 overflow-hidden">
                  <img src={course.image} alt={course.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                </div>
                <div className="p-8 space-y-4">
                  <div className="text-sm font-bold text-primary uppercase tracking-wider">{course.category}</div>
                  <h3 className="text-2xl font-display font-bold">{course.title}</h3>
                  <div className="flex items-center justify-between pt-4">
                    <Button variant="ghost" className="p-0 h-auto hover:bg-transparent text-muted-foreground group-hover:text-primary transition-colors">
                      <FileText className="w-4 h-4 me-2" />
                      {t.landing.getMaterials}
                    </Button>
                    <Link to="/courses">
                      <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
                        <ChevronRight className={`w-5 h-5 ${dir === 'rtl' ? 'rotate-180' : ''}`} />
                      </div>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-32 relative overflow-hidden">
        <div className="container mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-20 space-y-4">
            <div className="text-primary font-bold tracking-widest uppercase text-sm">{t.landing.features.premiumCourses}</div>
            <h2 className="text-4xl md:text-5xl font-display font-bold"> {t.common.brandName2}</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-12">
            {features.map((feature, i) => (
              <div
                key={i}
                className="relative p-10 rounded-3xl glass hover-glow transition-all group animate-slide-up"
                style={{ animationDelay: `${i * 150}ms` }}
              >
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-8 shadow-lg group-hover:rotate-6 transition-transform`}>
                  <feature.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-display font-bold mb-4">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed text-lg">{feature.description}</p>
                <div className="absolute top-6 right-6 text-primary/10 font-display font-black text-6xl group-hover:text-primary/20 transition-colors">0{i + 1}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="container mx-auto px-6 py-20">
        <div className="relative rounded-[3rem] overflow-hidden gradient-hero p-12 md:p-24 text-center text-white">
          <div className="absolute inset-0 bg-black/10 backdrop-blur-sm" />
          <div className="relative z-10 max-w-3xl mx-auto space-y-8 animate-scale-in">
            <Award className="w-16 h-16 mx-auto opacity-80" />
            <h2 className="text-4xl md:text-6xl font-display font-black leading-tight">
              {t.landing.joinPlatform}
            </h2>
            <p className="text-xl text-white/80">
              {t.landing.joinPlatformDesc}
            </p>
            <div className="pt-4">
              <Link to="/auth?signup=true">
                <Button size="lg" variant="secondary" className="rounded-full px-12 text-xl h-16 font-bold shadow-2xl hover:scale-105 transition-transform">
                  {t.landing.registerNow}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border/40">
        <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-primary" />
            <span className="font-display font-bold text-xl">{t.common.brandName}</span>
          </div>
          <div className="text-muted-foreground text-sm">
            © {new Date().getFullYear()} {t.common.brandName}. {t.auth.copyright}
          </div>
        </div>
      </footer>
    </div>
  );
}
