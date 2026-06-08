"use client";

import { AppShell } from "@/components/app-shell";
import { PageHeader, Card, ProgressBar } from "@/components/ui";
import { useAppData } from "@/lib/data-provider";
import { isOverdue, summarizeTasks, tasksFor } from "@/lib/utils";

export default function DashboardPage() {
  const { data } = useAppData();
  const summary = summarizeTasks(data.tasks);
  const overdue = data.tasks.filter(isOverdue).length;
  return (
    <AppShell>
      <PageHeader title="Dashboard" kicker="Yfirlit" />
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <Stat label="Opin atriði" value={summary.open} />
        <Stat label="Í vinnslu" value={summary.in_progress} />
        <Stat label="Föst atriði" value={summary.blocked} tone="text-red-700" />
        <Stat label="Lokið" value={summary.done} tone="text-emerald-700" />
        <Stat label="Fram yfir skiladag" value={overdue} tone="text-orange-700" />
      </section>
      <section className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 font-bold text-ink">Framvinda verkefna</h2>
          <div className="grid gap-4">
            {data.projects.map((project) => {
              const projectSummary = summarizeTasks(tasksFor(data, { project_id: project.id }));
              return (
                <div key={project.id}>
                  <div className="mb-2 flex justify-between text-sm font-semibold"><span>{project.full_name}</span><span>{projectSummary.progress}%</span></div>
                  <ProgressBar value={projectSummary.progress} />
                </div>
              );
            })}
          </div>
        </Card>
        <Card>
          <h2 className="mb-4 font-bold text-ink">Atriði eftir ábyrgðaraðila</h2>
          <div className="grid gap-3">
            {data.profiles.map((profile) => {
              const items = data.tasks.filter((task) => task.assigned_to_user_id === profile.id);
              return <div key={profile.id} className="flex items-center justify-between rounded-md bg-slate-50 p-3 text-sm"><span className="font-semibold">{profile.name}</span><span>{items.length} atriði</span></div>;
            })}
          </div>
        </Card>
      </section>
    </AppShell>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: string }) {
  return <Card><p className={`text-3xl font-bold ${tone ?? "text-ink"}`}>{value}</p><p className="mt-1 text-sm font-medium text-slate-500">{label}</p></Card>;
}
