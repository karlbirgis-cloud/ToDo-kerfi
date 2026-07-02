"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BarChart3, ClipboardCheck, FileText, FolderKanban, HardHat, Home, LogOut, Menu, ShieldCheck, UserCheck } from "lucide-react";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth-provider";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/safety-b25-27-29-31", label: "Öryggisúttekt B25-27 og 29-31", mobileLabel: "Öryggi", icon: ClipboardCheck },
  { href: "/dashboard", label: "Dashboard", mobileLabel: "Yfirlit", icon: BarChart3 },
  { href: "/inspection", label: "Úttekt", mobileLabel: "Úttekt", icon: ClipboardCheck },
  { href: "/reports", label: "Skýrslur", mobileLabel: "Skýrslur", icon: FileText },
  { href: "/projects", label: "Verkefni", mobileLabel: "Verkefni", icon: FolderKanban },
  { href: "/my-tasks", label: "Mín atriði", mobileLabel: "Mín atriði", icon: UserCheck },
  { href: "/admin", label: "Admin", mobileLabel: "Admin", icon: ShieldCheck }
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { session, user, isLoading, signOut } = useAuth();
  const isLogin = pathname === "/login";
  const isWidePage = pathname.startsWith("/dashboard") || pathname.startsWith("/reports") || pathname.startsWith("/safety-b25-27-29-31");

  useEffect(() => {
    if (isLogin) return;
    if (!isLoading && !session) router.replace("/login");
  }, [isLoading, isLogin, session, router]);

  if (isLogin) return <>{children}</>;

  if (isLoading) {
    return <div className="grid min-h-screen place-items-center text-sm font-semibold text-slate-500">Hleð innskráningu...</div>;
  }

  if (!session) return null;

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className={cn("mx-auto flex h-16 items-center justify-between px-4", isWidePage ? "max-w-[1600px]" : "max-w-7xl")}>
          <Link href="/dashboard" className="flex items-center gap-2 font-bold text-ink">
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-ink text-white"><HardHat className="h-5 w-5" /></span>
            <span>Verklisti</span>
          </Link>
          <nav className="hidden gap-1 md:flex">
            {nav.map((item) => {
              const active = pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href} className={cn("flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100", active && "bg-slate-900 text-white hover:bg-slate-900")}>
                  <Icon className="h-4 w-4" /> {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="hidden items-center gap-3 md:flex">
            <span className="max-w-48 truncate text-sm font-semibold text-slate-600">{user?.email}</span>
            <button
              className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100"
              onClick={async () => {
                await signOut();
                router.replace("/login");
              }}
            >
              <LogOut className="h-4 w-4" /> Útskrá
            </button>
          </div>
          <Menu className="h-6 w-6 text-slate-500 md:hidden" />
        </div>
      </header>
      <main className={cn("mx-auto px-4 py-5 sm:py-8", isWidePage ? "max-w-[1600px]" : "max-w-7xl")}>{children}</main>
      <nav
        className="fixed bottom-0 left-0 right-0 z-30 flex gap-1 overflow-x-auto border-t border-slate-200 bg-white px-2 pt-2 shadow-[0_-8px_24px_rgba(15,23,42,0.08)] md:hidden"
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 0.5rem)" }}
      >
        {nav.map((item) => {
          const active = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-label={item.label}
              title={item.label}
              className={cn(
                "flex min-w-[74px] shrink-0 flex-col items-center justify-center gap-1 rounded-md px-2 py-1.5 text-[11px] font-semibold leading-tight text-slate-600",
                active && "bg-blueprint/10 text-blueprint"
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span className="max-w-full truncate whitespace-nowrap">{item.mobileLabel}</span>
            </Link>
          );
        })}
        <button
          className="flex min-w-[74px] shrink-0 flex-col items-center justify-center gap-1 rounded-md px-2 py-1.5 text-[11px] font-semibold leading-tight text-slate-600"
          onClick={async () => {
            await signOut();
            router.replace("/login");
          }}
        >
          <LogOut className="h-5 w-5 shrink-0" />
          <span className="max-w-full truncate whitespace-nowrap">Útskrá</span>
        </button>
      </nav>
      <div className="h-24 md:hidden" />
    </div>
  );
}

export function Breadcrumbs({ items }: { items: Array<{ label: string; href?: string }> }) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2 text-sm text-slate-600">
      <Link href="/dashboard" className="inline-flex items-center gap-1 font-medium hover:text-ink"><Home className="h-3.5 w-3.5" /> Heim</Link>
      {items.map((item) => (
        <span key={`${item.href}-${item.label}`} className="flex items-center gap-2">
          <span className="text-slate-300">/</span>
          {item.href ? <Link className="font-medium hover:text-ink" href={item.href}>{item.label}</Link> : <span className="font-semibold text-ink">{item.label}</span>}
        </span>
      ))}
    </div>
  );
}
