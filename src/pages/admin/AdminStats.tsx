import { useLanguage } from "@/contexts/LanguageContext";
import DashboardLayout from "@/components/layout/DashboardLayout";

export default function AdminStats() {
    const { t } = useLanguage();

    return (
        <DashboardLayout>
            <div className="space-y-8">
                <div>
                    <h1 className="text-3xl font-display font-bold mb-2">{t.nav.statistics}</h1>
                    <p className="text-muted-foreground">{t.adminStats.subtitle}</p>
                </div>
            </div>
        </DashboardLayout>
    );
}
