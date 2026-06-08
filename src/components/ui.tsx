import Link from "next/link";
import { CheckCircle2, Circle, Clock, HardHat, Loader2, Plus, Search, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";
import { priorityLabels, priorityTone, statusLabels, statusTone } from "@/lib/labels";
import type { TaskPriority, TaskStatus } from "@/lib/types";

export function Button({ className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cn(
        "touch-target inline-flex items-center justify-center gap-2 rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-55",
        className
      )}
      {...props}
    />
  );
}

export function LinkButton({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) {
  return (
    <Link href={href} className={cn("touch-target inline-flex items-center justify-center gap-2 rounded-md bg-ink px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-slate-800", className)}>
      {children}
    </Link>
  );
}

export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("rounded-lg border border-slate-200 bg-white/95 p-4 shadow-soft", className)}>{children}</div>;
}

export function PageHeader({ title, kicker, actions }: { title: string; kicker?: string; actions?: React.ReactNode }) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {kicker ? <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">{kicker}</p> : null}
        <h1 className="text-2xl font-bold text-ink sm:text-3xl">{title}</h1>
      </div>
      {actions}
    </div>
  );
}

export function ProgressBar({ value }: { value: number }) {
  const tone = value >= 75 ? "bg-emerald-500" : value >= 35 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="h-2.5 overflow-hidden rounded-full bg-slate-200" aria-label={`${value}% lokið`}>
      <div className={cn("h-full rounded-full transition-all", tone)} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}

export function StatusBadge({ status }: { status: TaskStatus }) {
  const icons = { open: Circle, in_progress: Clock, done: CheckCircle2 };
  const Icon = icons[status];
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ring-1", statusTone[status])}>
      <Icon className="h-3.5 w-3.5" /> {statusLabels[status]}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  return <span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1", priorityTone[priority])}>{priorityLabels[priority]}</span>;
}

export function SearchInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="relative block">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input className="touch-target w-full rounded-md border border-slate-300 bg-white pl-10 pr-3 text-sm outline-none focus:border-blueprint focus:ring-2 focus:ring-blueprint/20" {...props} />
    </label>
  );
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <Card className="flex min-h-48 flex-col items-center justify-center text-center">
      <HardHat className="mb-3 h-10 w-10 text-slate-400" />
      <h2 className="font-semibold text-ink">{title}</h2>
      <p className="mt-1 max-w-md text-sm text-slate-600">{body}</p>
    </Card>
  );
}

export function LoadingState() {
  return (
    <div className="flex min-h-48 items-center justify-center text-slate-500">
      <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Hleð...
    </div>
  );
}

export function FloatingAdd({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} aria-label={label} className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-blueprint text-white shadow-xl sm:hidden">
      <Plus className="h-6 w-6" />
    </Link>
  );
}

export function UserPill({ name }: { name?: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
      <UserRound className="h-3.5 w-3.5" /> {name ?? "Óúthlutað"}
    </span>
  );
}
