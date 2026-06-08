"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { PageHeader, Card, StatusBadge, UserPill } from "@/components/ui";
import { statusLabels } from "@/lib/labels";
import { useAppData } from "@/lib/data-provider";
import type { AppData, Task } from "@/lib/types";
import { cn, isOverdue, summarizeTasks } from "@/lib/utils";

type DashboardSortKey = "project" | "location" | "unit" | "title" | "description" | "category" | "subcategory" | "assignee" | "status";
type SortDirection = "asc" | "desc";

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

      <section className="mt-6">
        <Card className="p-0">
          <div className="border-b border-slate-100 p-4">
            <h2 className="font-bold text-ink">Atriði eftir ábyrgðaraðila</h2>
            <p className="mt-1 text-sm text-slate-600">Hver ábyrgðaraðili með sín ókláruðu og virku atriði.</p>
          </div>
          <AssigneeTaskGroups tasks={activeTasks} data={data} />
        </Card>
      </section>
    </AppShell>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: string }) {
  return <Card><p className={`text-3xl font-bold ${tone ?? "text-ink"}`}>{value}</p><p className="mt-1 text-sm font-medium text-slate-500">{label}</p></Card>;
}

function DashboardTaskTable({ tasks, data, showAssignee = true }: { tasks: Task[]; data: AppData; showAssignee?: boolean }) {
  const router = useRouter();
  const [sortKey, setSortKey] = useState<DashboardSortKey>("status");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  const sortedTasks = useMemo(() => {
    return [...tasks].sort((a, b) => {
      const aValue = getSortValue(a, data, sortKey);
      const bValue = getSortValue(b, data, sortKey);
      const result = aValue.localeCompare(bValue, "is", { sensitivity: "base", numeric: true });
      return sortDirection === "asc" ? result : -result;
    });
  }, [data, sortDirection, sortKey, tasks]);

  function toggleSort(nextKey: DashboardSortKey) {
    if (nextKey === sortKey) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }

    setSortKey(nextKey);
    setSortDirection("asc");
  }

  if (tasks.length === 0) {
    return <div className="p-6 text-sm text-slate-600">Engin ókláruð atriði eða atriði í vinnslu.</div>;
  }

  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className={cn("w-full border-collapse text-left text-sm", showAssignee ? "min-w-[1320px]" : "min-w-[1120px]")}>
          <thead className="bg-slate-50 text-xs font-bold uppercase text-slate-500">
            <tr>
              <Th sortKey="project" activeSortKey={sortKey} direction={sortDirection} onSort={toggleSort}>Verkefni</Th>
              <Th sortKey="location" activeSortKey={sortKey} direction={sortDirection} onSort={toggleSort}>Gata</Th>
              <Th sortKey="unit" activeSortKey={sortKey} direction={sortDirection} onSort={toggleSort}>Íbúð</Th>
              <Th sortKey="title" activeSortKey={sortKey} direction={sortDirection} onSort={toggleSort}>Titill</Th>
              <Th sortKey="description" activeSortKey={sortKey} direction={sortDirection} onSort={toggleSort}>Lýsing</Th>
              <Th sortKey="category" activeSortKey={sortKey} direction={sortDirection} onSort={toggleSort}>Flokkur</Th>
              <Th sortKey="subcategory" activeSortKey={sortKey} direction={sortDirection} onSort={toggleSort}>Undirflokkur</Th>
              {showAssignee ? <Th sortKey="assignee" activeSortKey={sortKey} direction={sortDirection} onSort={toggleSort}>Úthlutun á</Th> : null}
              <Th sortKey="status" activeSortKey={sortKey} direction={sortDirection} onSort={toggleSort}>Staða</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {sortedTasks.map((task) => {
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
                  {showAssignee ? <Td><UserPill name={row.assignee} /></Td> : null}
                  <Td><StatusBadge status={task.status} /></Td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="grid gap-3 p-3 md:hidden">
        {sortedTasks.map((task) => {
          const row = getDashboardTaskRow(task, data);
          return (
            <button
              key={task.id}
              onClick={() => router.push(`/tasks/${task.id}`)}
              className="rounded-md border border-slate-200 bg-white p-3 text-left shadow-sm"
            >
              <div className="flex flex-wrap gap-2">
                <StatusBadge status={task.status} />
                {showAssignee ? <UserPill name={row.assignee} /> : null}
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

function AssigneeTaskGroups({ tasks, data }: { tasks: Task[]; data: AppData }) {
  const groups = data.profiles
    .map((profile) => ({
      profile,
      tasks: tasks.filter((task) => task.assigned_to_user_id === profile.id)
    }))
    .filter((group) => group.tasks.length > 0)
    .sort((a, b) => a.profile.name.localeCompare(b.profile.name, "is", { sensitivity: "base" }));

  const unassignedTasks = tasks.filter((task) => !task.assigned_to_user_id);

  if (groups.length === 0 && unassignedTasks.length === 0) {
    return <div className="p-6 text-sm text-slate-600">Engin ókláruð atriði eru úthlutuð eins og er.</div>;
  }

  return (
    <div className="grid gap-5 p-4">
      {groups.map((group) => (
        <section key={group.profile.id} className="overflow-hidden rounded-md border border-slate-200">
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 bg-slate-50 px-4 py-3">
            <h3 className="font-bold text-ink">{group.profile.name}</h3>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-600 ring-1 ring-slate-200">{group.tasks.length} atriði</span>
          </div>
          <DashboardTaskTable tasks={group.tasks} data={data} showAssignee={false} />
        </section>
      ))}

      {unassignedTasks.length > 0 ? (
        <section className="overflow-hidden rounded-md border border-slate-200">
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 bg-slate-50 px-4 py-3">
            <h3 className="font-bold text-ink">Óúthlutað</h3>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-600 ring-1 ring-slate-200">{unassignedTasks.length} atriði</span>
          </div>
          <DashboardTaskTable tasks={unassignedTasks} data={data} showAssignee={false} />
        </section>
      ) : null}
    </div>
  );
}

function getSortValue(task: Task, data: AppData, sortKey: DashboardSortKey) {
  const row = getDashboardTaskRow(task, data);
  const values: Record<DashboardSortKey, string> = {
    project: row.project,
    location: row.location,
    unit: row.unit,
    title: task.title,
    description: task.description ?? "",
    category: row.category,
    subcategory: row.subcategory,
    assignee: row.assignee ?? "Óúthlutað",
    status: statusLabels[task.status]
  };

  return values[sortKey];
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

function Th({
  children,
  sortKey,
  activeSortKey,
  direction,
  onSort
}: {
  children: React.ReactNode;
  sortKey: DashboardSortKey;
  activeSortKey: DashboardSortKey;
  direction: SortDirection;
  onSort: (key: DashboardSortKey) => void;
}) {
  const isActive = sortKey === activeSortKey;

  return (
    <th className="px-4 py-3">
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={cn("flex w-full items-center gap-1 text-left uppercase hover:text-ink", isActive && "text-ink")}
      >
        {children}
        <span className="text-[10px]">{isActive ? (direction === "asc" ? "A-Ö" : "Ö-A") : ""}</span>
      </button>
    </th>
  );
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
