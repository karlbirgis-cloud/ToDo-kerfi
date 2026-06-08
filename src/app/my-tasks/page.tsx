"use client";

import { AppShell } from "@/components/app-shell";
import { TaskCard } from "@/components/task-card";
import { EmptyState, PageHeader } from "@/components/ui";
import { useAppData } from "@/lib/data-provider";

export default function MyTasksPage() {
  const { data, currentUserId, completeTask } = useAppData();
  const tasks = data.tasks.filter((task) => task.assigned_to_user_id === currentUserId);
  const grouped = data.projects.map((project) => ({ project, tasks: tasks.filter((task) => task.project_id === project.id) })).filter((group) => group.tasks.length > 0);
  return (
    <AppShell>
      <PageHeader title="Mín atriði" kicker="Úthlutað á mig" />
      <div className="grid gap-6">
        {grouped.map((group) => (
          <section key={group.project.id}>
            <h2 className="mb-3 text-lg font-bold text-ink">{group.project.full_name}</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {group.tasks.map((task) => <TaskCard key={task.id} task={task} data={data} onDone={() => completeTask(task.id)} />)}
            </div>
          </section>
        ))}
        {grouped.length === 0 ? <EmptyState title="Engin atriði á þig" body="Þegar verkstjóri úthlutar atriðum birtast þau hér." /> : null}
      </div>
    </AppShell>
  );
}
