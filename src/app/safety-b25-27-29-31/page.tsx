"use client";

import { useRouter } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { Card, PageHeader, UserPill } from "@/components/ui";
import { statusLabels } from "@/lib/labels";
import { useAppData } from "@/lib/data-provider";
import type { AppData, Task, TaskStatus } from "@/lib/types";
import { cn, getTaskResponsiblePartyName } from "@/lib/utils";

const PROJECT_NAME = "Bryggjuhverfi";
const LOCATION_NAMES = ["Buðlabryggja 25-27", "Buðlabryggja 29-31"];
const INSPECTION_TYPE_NAME = "Öryggisúttekt";

export default function SafetyB25Page() {
  const { data } = useAppData();
  const tasks = getSafetyTasks(data);

  return (
    <AppShell>
      <PageHeader title="Öryggisúttekt B25-27 og 29-31" kicker="Tímabundið yfirlit" />
      <Card className="p-0">
        <div className="border-b border-slate-100 p-4">
          <h2 className="font-bold text-ink">Atriði eftir götu og undirflokki</h2>
          <p className="mt-1 text-sm text-slate-600">
            {tasks.length} opin atriði í {PROJECT_NAME}, Buðlabryggju 25-27 og 29-31, merkt {INSPECTION_TYPE_NAME}.
          </p>
        </div>
        <LocationSections tasks={tasks} data={data} />
      </Card>
    </AppShell>
  );
}

function getSafetyTasks(data: AppData) {
  const projectIds = new Set(
    data.projects
      .filter((project) => normalize(project.name) === normalize(PROJECT_NAME) || normalize(project.full_name).includes(normalize(PROJECT_NAME)))
      .map((project) => project.id)
  );
  const locationIds = new Set(
    data.locations
      .filter((location) => projectIds.has(location.project_id) && LOCATION_NAMES.some((name) => normalize(location.name) === normalize(name)))
      .map((location) => location.id)
  );
  const inspectionTypeIds = new Set(
    data.inspection_types
      .filter((inspectionType) => normalize(inspectionType.name) === normalize(INSPECTION_TYPE_NAME))
      .map((inspectionType) => inspectionType.id)
  );

  return data.tasks
    .filter((task) => projectIds.has(task.project_id))
    .filter((task) => locationIds.has(task.location_id))
    .filter((task) => Boolean(task.inspection_type_id && inspectionTypeIds.has(task.inspection_type_id)))
    .filter((task) => task.status !== "done")
    .sort(sortTasks);
}

function LocationSections({ tasks, data }: { tasks: Task[]; data: AppData }) {
  return (
    <div className="grid gap-6 p-4">
      {LOCATION_NAMES.map((locationName) => {
        const locationTasks = tasks.filter((task) => normalize(getTaskRow(task, data).location) === normalize(locationName));

        return (
          <section key={locationName} className="overflow-hidden rounded-md border border-slate-200 bg-white">
            <div className="flex flex-col gap-1 border-b border-slate-100 bg-slate-900 px-4 py-3 text-white sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-lg font-bold">{locationName}</h2>
              <span className="text-sm font-semibold text-slate-200">{locationTasks.length} opin atriði</span>
            </div>
            <SubcategoryGroups tasks={locationTasks} data={data} />
          </section>
        );
      })}
    </div>
  );
}

function SubcategoryGroups({ tasks, data }: { tasks: Task[]; data: AppData }) {
  const groups = data.subcategories
    .map((subcategory) => ({
      subcategory,
      category: data.categories.find((category) => category.id === subcategory.category_id),
      tasks: tasks.filter((task) => task.subcategory_id === subcategory.id)
    }))
    .filter((group) => group.tasks.length > 0)
    .sort((a, b) => {
      const categorySort = (a.category?.name ?? "").localeCompare(b.category?.name ?? "", "is", { sensitivity: "base", numeric: true });
      return categorySort || a.subcategory.name.localeCompare(b.subcategory.name, "is", { sensitivity: "base", numeric: true });
    });

  const uncategorizedTasks = tasks.filter((task) => !task.subcategory_id || !data.subcategories.some((subcategory) => subcategory.id === task.subcategory_id));

  if (groups.length === 0 && uncategorizedTasks.length === 0) {
    return <div className="p-6 text-sm text-slate-600">Engin opin atriði fundust fyrir þessa götu.</div>;
  }

  return (
    <div className="grid gap-5 p-4">
      {groups.map((group) => (
        <section key={group.subcategory.id} className="overflow-hidden rounded-md border border-slate-200">
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 bg-slate-50 px-4 py-3">
            <div>
              <h3 className="font-bold text-ink">{group.subcategory.name}</h3>
              {group.category ? <p className="mt-0.5 text-xs font-semibold uppercase text-slate-500">{group.category.name}</p> : null}
            </div>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-600 ring-1 ring-slate-200">{group.tasks.length} atriði</span>
          </div>
          <SafetyTaskTable tasks={group.tasks} data={data} />
        </section>
      ))}

      {uncategorizedTasks.length > 0 ? (
        <section className="overflow-hidden rounded-md border border-slate-200">
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 bg-slate-50 px-4 py-3">
            <h3 className="font-bold text-ink">Án undirflokks</h3>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-600 ring-1 ring-slate-200">{uncategorizedTasks.length} atriði</span>
          </div>
          <SafetyTaskTable tasks={uncategorizedTasks} data={data} />
        </section>
      ) : null}
    </div>
  );
}

function SafetyTaskTable({ tasks, data }: { tasks: Task[]; data: AppData }) {
  const router = useRouter();
  const { updateTaskStatus } = useAppData();

  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[980px] border-collapse text-left text-sm">
          <thead className="bg-white text-xs font-bold uppercase text-slate-500">
            <tr>
              <Th>Íbúð / rými</Th>
              <Th>Titill</Th>
              <Th>Lýsing</Th>
              <Th>Flokkur</Th>
              <Th>Ábyrgðaraðili</Th>
              <Th>Staða</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {tasks.map((task) => {
              const row = getTaskRow(task, data);
              return (
                <tr
                  key={task.id}
                  role="link"
                  tabIndex={0}
                  onClick={() => router.push(`/tasks/${task.id}`)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") router.push(`/tasks/${task.id}`);
                  }}
                  className={cn("cursor-pointer border-l-4 transition hover:bg-blue-50/50 focus:bg-blue-50 focus:outline-none", getStatusTone(task.status))}
                >
                  <Td>{row.unit}</Td>
                  <Td className="font-bold text-ink">{task.title}</Td>
                  <Td className="max-w-sm text-slate-600"><span className="line-clamp-2">{task.description || "-"}</span></Td>
                  <Td>{row.category}</Td>
                  <Td><UserPill name={row.assignee} /></Td>
                  <Td>
                    <SafetyStatusSelect task={task} onChange={(status) => updateTaskStatus(task.id, status)} />
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="grid gap-3 p-3 md:hidden">
        {tasks.map((task) => {
          const row = getTaskRow(task, data);
          return (
            <div
              key={task.id}
              role="link"
              tabIndex={0}
              onClick={() => router.push(`/tasks/${task.id}`)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") router.push(`/tasks/${task.id}`);
              }}
              className={cn("rounded-md border border-l-4 bg-white p-3 text-left shadow-sm", getStatusTone(task.status))}
            >
              <div className="flex flex-wrap gap-2">
                <SafetyStatusSelect task={task} onChange={(status) => updateTaskStatus(task.id, status)} />
                <UserPill name={row.assignee} />
              </div>
              <h3 className="mt-3 font-bold text-ink">{task.title}</h3>
              <p className="mt-1 line-clamp-2 text-sm text-slate-600">{task.description || "-"}</p>
              <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <Detail label="Íbúð" value={row.unit} />
                <Detail label="Flokkur" value={row.category} />
              </dl>
            </div>
          );
        })}
      </div>
    </>
  );
}

function SafetyStatusSelect({ task, onChange }: { task: Task; onChange: (status: TaskStatus) => void }) {
  return (
    <label
      className="inline-grid gap-1 text-xs font-semibold text-slate-600"
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}
    >
      <span className="sr-only">Staða</span>
      <select
        value={task.status}
        onChange={(event) => onChange(event.target.value as TaskStatus)}
        className={cn(
          "h-9 rounded-md border px-2 text-sm font-semibold outline-none transition focus:ring-2",
          getStatusSelectTone(task.status)
        )}
        aria-label={`Staða fyrir ${task.title}`}
      >
        {Object.entries(statusLabels).map(([value, label]) => (
          <option key={value} value={value}>{label}</option>
        ))}
      </select>
    </label>
  );
}

function getTaskRow(task: Task, data: AppData) {
  return {
    location: data.locations.find((location) => location.id === task.location_id)?.name ?? "-",
    unit: data.units.find((unit) => unit.id === task.unit_id)?.name ?? "-",
    category: data.categories.find((category) => category.id === task.category_id)?.name ?? "-",
    assignee: getTaskResponsiblePartyName(data, task)
  };
}

function sortTasks(a: Task, b: Task) {
  const statusOrder: Record<TaskStatus, number> = { in_progress: 0, open: 1, done: 2 };
  return statusOrder[a.status] - statusOrder[b.status] || b.created_at.localeCompare(a.created_at);
}

function getStatusTone(status: TaskStatus) {
  const tones: Record<TaskStatus, string> = {
    open: "border-l-blue-500",
    in_progress: "border-l-amber-500",
    done: "border-l-emerald-500"
  };

  return tones[status];
}

function getStatusSelectTone(status: TaskStatus) {
  const tones: Record<TaskStatus, string> = {
    open: "border-blue-200 bg-blue-50 text-blue-900 hover:border-blue-400 focus:border-blue-500 focus:ring-blue-200",
    in_progress: "border-amber-200 bg-amber-50 text-amber-950 hover:border-amber-400 focus:border-amber-500 focus:ring-amber-200",
    done: "border-emerald-200 bg-emerald-50 text-emerald-900 hover:border-emerald-400 focus:border-emerald-500 focus:ring-emerald-200"
  };

  return tones[status];
}

function normalize(value: string) {
  return value.trim().toLocaleLowerCase("is");
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
