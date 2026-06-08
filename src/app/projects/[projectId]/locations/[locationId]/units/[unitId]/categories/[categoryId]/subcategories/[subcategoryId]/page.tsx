"use client";

import { use, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { AppShell, Breadcrumbs } from "@/components/app-shell";
import { TaskCard } from "@/components/task-card";
import { TaskForm } from "@/components/forms";
import { Card, EmptyState, FloatingAdd, PageHeader, SearchInput } from "@/components/ui";
import { useAppData } from "@/lib/data-provider";
import { isOverdue } from "@/lib/utils";
import type { TaskStatus } from "@/lib/types";

const filters: Array<{ label: string; value: "all" | "mine" | "overdue" | TaskStatus }> = [
  { label: "Öll", value: "all" },
  { label: "Ólokið", value: "open" },
  { label: "Í vinnslu", value: "in_progress" },
  { label: "Lokið", value: "done" },
  { label: "Mín atriði", value: "mine" },
  { label: "Fram yfir skiladag", value: "overdue" }
];

export default function SubcategoryPage({ params }: { params: Promise<{ projectId: string; locationId: string; unitId: string; categoryId: string; subcategoryId: string }> }) {
  const { projectId, locationId, unitId, categoryId, subcategoryId } = use(params);
  const { data, currentUserId, completeTask } = useAppData();
  const [filter, setFilter] = useState<(typeof filters)[number]["value"]>("all");
  const [query, setQuery] = useState("");
  const project = data.projects.find((item) => item.id === projectId);
  const location = data.locations.find((item) => item.id === locationId);
  const unit = data.units.find((item) => item.id === unitId);
  const category = data.categories.find((item) => item.id === categoryId);
  const subcategory = data.subcategories.find((item) => item.id === subcategoryId);
  const tasks = useMemo(() => data.tasks.filter((task) => {
    if (task.subcategory_id !== subcategoryId || task.unit_id !== unitId) return false;
    if (filter === "mine" && task.assigned_to_user_id !== currentUserId) return false;
    if (filter === "overdue" && !isOverdue(task)) return false;
    if (["open", "in_progress", "done"].includes(filter) && task.status !== filter) return false;
    const assignee = data.profiles.find((profile) => profile.id === task.assigned_to_user_id)?.name ?? "";
    const haystack = `${task.title} ${task.description ?? ""} ${assignee}`.toLowerCase();
    return haystack.includes(query.toLowerCase());
  }), [data, subcategoryId, unitId, filter, query, currentUserId]);
  if (!project || !location || !unit || !category || !subcategory) return <AppShell><EmptyState title="Undirflokkur fannst ekki" body="Veldu undirflokk úr flokkasíðu." /></AppShell>;
  return (
    <AppShell>
      <Breadcrumbs items={[{ label: project.full_name, href: `/projects/${project.id}` }, { label: location.name, href: `/projects/${project.id}/locations/${location.id}` }, { label: unit.name, href: `/projects/${project.id}/locations/${location.id}/units/${unit.id}` }, { label: category.name, href: `/projects/${project.id}/locations/${location.id}/units/${unit.id}/categories/${category.id}` }, { label: subcategory.name }]} />
      <PageHeader title={subcategory.name} kicker="Atriðalisti" />
      <div className="grid gap-4 xl:grid-cols-[1fr_390px]">
        <section>
          <div className="mb-4 grid gap-3">
            <SearchInput placeholder="Leita í titli, lýsingu eða ábyrgðaraðila" value={query} onChange={(event) => setQuery(event.target.value)} />
            <div className="flex gap-2 overflow-x-auto pb-1">
              {filters.map((item) => (
                <button key={item.value} onClick={() => setFilter(item.value)} className={`touch-target shrink-0 rounded-md px-3 text-sm font-bold ${filter === item.value ? "bg-ink text-white" : "bg-white text-slate-700 ring-1 ring-slate-200"}`}>{item.label}</button>
              ))}
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {tasks.map((task) => <TaskCard key={task.id} task={task} data={data} onDone={() => completeTask(task.id)} />)}
            {tasks.length === 0 ? <EmptyState title="Engin atriði" body="Búðu til fyrsta atriðið fyrir þennan undirflokk." /> : null}
          </div>
        </section>
        <Card>
          <h2 className="mb-4 flex items-center gap-2 font-bold"><Plus className="h-4 w-4" /> Nýtt atriði</h2>
          <TaskForm projectId={project.id} locationId={location.id} unitId={unit.id} categoryId={category.id} subcategoryId={subcategory.id} />
        </Card>
      </div>
      <FloatingAdd href="#new-task" label="Nýtt atriði" />
    </AppShell>
  );
}
