"use client";

import { useRouter } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { PageHeader, Card, ProgressBar, StatusBadge, UserPill } from "@/components/ui";
import { useAppData } from "@/lib/data-provider";
import type { AppData, Task } from "@/lib/types";
import { cn, isOverdue, summarizeTasks, tasksFor } from "@/lib/utils";

export default function DashboardPage() {
  const { data } = useAppData();
  const summary = summarizeTasks(data.tasks);
  const overdue = data.tasks.filter(isOverdue).length;
  const activeTasks = data.tasks
    .filter((task) => task.status === "open" || task.status === "in_progress")
    .sort((a, b) => {
      const statusOrder = { in_progress: 0, open: 1, done: 2 };
      return statusOrder[a.status] - statusOrder[b.status] || b.created_at.localeCompare(a.created_at);
    });

  return (
    <AppShell>
      <PageHeader title="Dashboard" kicker="Yfirlit" />
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Opin atriði" value={summary.open} />
        <Stat label="Í vinnslu" value={summary.in_progress} />
        <Stat label="Lokið" value={summary.done} tone="text-emerald-700" />
        <Stat label="Fram yfir skiladag" value={overdue} tone="text-orange-700" />
      </section>

      <section className="mt-6">
        <Card className="p-0">
          <div className="border-b border-slate-100 p-4">
            <h2 className="font-bold text-ink">Ókláruð og í vinnslu</h2>
            <p className="mt-1 text-sm text-slate-600">{activeTasks.length} atriði sem þarf að fylgja eftir.</p>
          </div>
          <DashboardTaskTable tasks={activeTasks} data={data} />
        </Card>
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

function DashboardTaskTable({ tasks, data }: { tasks: Task[]; data: AppData }) {
  const router = useRouter();

  if (tasks.length === 0) {
    return <div className="p-6 text-sm text-slate-600">Engin ókláruð atriði eða atriði í vinnslu.</div>;
  }

  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[1180px] border-collapse text-left text-sm">
          <thead className="bg-slate-50 text-xs font-bold uppercase text-slate-500">
            <tr>
              <Th>Verkefni</Th>
              <Th>Gata</Th>
              <Th>Íbúð</Th>
              <Th>Titill</Th>
              <Th>Lýsing</Th>
              <Th>Flokkur</Th>
              <Th>Undirflokkur</Th>
              <Th>Úthlutun á</Th>
              <Th>Staða</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {tasks.map((task) => {
              const row = getDashboardTaskRow(task, data);
              return (
                <tr
                  key={task.id}
                  role="link"
                  tabIndex={0}
                  onClick={() => router.push(`/tasks/${task.id}`)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") router.push(`/tasks/${task.id}`);
                  }}
                  className="cursor-pointer transition hover:bg-blue-50/55 focus:bg-blue-50 focus:outline-none"
                >
                  <Td className="font-semibold text-ink">{row.project}</Td>
                  <Td>{row.location}</Td>
                  <Td>{row.unit}</Td>
                  <Td className="font-bold text-ink">{task.title}</Td>
                  <Td className="max-w-sm text-slate-600"><span className="line-clamp-2">{task.description || "-"}</span></Td>
                  <Td>{row.category}</Td>
                  <Td>{row.subcategory}</Td>
                  <Td><UserPill name={row.assignee} /></Td>
                  <Td><StatusBadge status={task.status} /></Td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="grid gap-3 p-3 md:hidden">
        {tasks.map((task) => {
          const row = getDashboardTaskRow(task, data);
          return (
            <button
              key={task.id}
              onClick={() => router.push(`/tasks/${task.id}`)}
              className="rounded-md border border-slate-200 bg-white p-3 text-left shadow-sm"
            >
              <div className="flex flex-wrap gap-2">
                <StatusBadge status={task.status} />
                <UserPill name={row.assignee} />
              </div>
              <h3 className="mt-3 font-bold text-ink">{task.title}</h3>
              <p className="mt-1 line-clamp-2 text-sm text-slate-600">{task.description || "-"}</p>
              <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <Detail label="Verkefni" value={row.project} />
                <Detail label="Gata" value={row.location} />
                <Detail label="Íbúð" value={row.unit} />
                <Detail label="Flokkur" value={row.category} />
                <Detail label="Undirflokkur" value={row.subcategory} />
              </dl>
            </button>
          );
        })}
      </div>
    </>
  );
}

function getDashboardTaskRow(task: Task, data: AppData) {
  return {
    project: data.projects.find((project) => project.id === task.project_id)?.full_name ?? "-",
    location: data.locations.find((location) => location.id === task.location_id)?.name ?? "-",
    unit: data.units.find((unit) => unit.id === task.unit_id)?.name ?? "-",
    category: data.categories.find((category) => category.id === task.category_id)?.name ?? "-",
    subcategory: data.subcategories.find((subcategory) => subcategory.id === task.subcategory_id)?.name ?? "-",
    assignee: data.profiles.find((profile) => profile.id === task.assigned_to_user_id)?.name
  };
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-3">{children}</th>;
}

function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={cn("px-4 py-3 align-top text-slate-700", className)}>{children}</td>;
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-semibold text-slate-500">{label}</dt>
      <dd className="mt-0.5 font-bold text-slate-800">{value}</dd>
    </div>
  );
}
