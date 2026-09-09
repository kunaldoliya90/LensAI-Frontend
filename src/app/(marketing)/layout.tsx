import { SiteFooter } from "@/features/marketing/components/SiteFooter";
import { SiteNav } from "@/features/marketing/components/SiteNav";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteNav />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
