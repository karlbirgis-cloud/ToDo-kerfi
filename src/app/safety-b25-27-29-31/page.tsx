"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Printer } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button, Card, PageHeader, UserPill } from "@/components/ui";
import { statusLabels } from "@/lib/labels";
import { useAppData } from "@/lib/data-provider";
import type { AppData, Task, TaskStatus } from "@/lib/types";
import { cn, formatDate, getTaskResponsiblePartyName } from "@/lib/utils";

const PROJECT_NAME = "Bryggjuhverfi";
const LOCATION_NAMES = ["Buðlabryggja 25-27", "Buðlabryggja 29-31"];
const INSPECTION_TYPE_NAME = "Öryggisúttekt";

type PrintGroup = {
  categoryName?: string;
  locationName: string;
  subcategoryName: string;
  tasks: Task[];
};

export default function SafetyB25Page() {
  const { data } = useAppData();
  const [printGroup, setPrintGroup] = useState<PrintGroup | null>(null);
  const tasks = getSafetyTasks(data);

  function printTasks(group: PrintGroup) {
    setPrintGroup(group);
    window.setTimeout(() => window.print(), 50);
  }

  return (
    <AppShell>
      <div className="no-print">
        <PageHeader title="Öryggisúttekt B25-27 og 29-31" kicker="Tímabundið yfirlit" />
        <Card className="p-0">
          <div className="border-b border-slate-100 p-4">
            <h2 className="font-bold text-ink">Atriði eftir götu og undirflokki</h2>
            <p className="mt-1 text-sm text-slate-600">
              {tasks.length} opin atriði í {PROJECT_NAME}, Buðlabryggju 25-27 og 29-31, merkt {INSPECTION_TYPE_NAME}.
            </p>
          </div>
          <LocationSections tasks={tasks} data={data} onPrint={printTasks} />
        </Card>
      </div>

      {printGroup ? <PrintableGroup group={printGroup} data={data} /> : null}
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

function LocationSections({ tasks, data, onPrint }: { tasks: Task[]; data: AppData; onPrint(group: PrintGroup): void }) {
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
            <SubcategoryGroups tasks={locationTasks} data={data} locationName={locationName} onPrint={onPrint} />
          </section>
        );
      })}
    </div>
  );
}

function SubcategoryGroups({
  tasks,
  data,
  locationName,
  onPrint
}: {
  tasks: Task[];
  data: AppData;
  locationName: string;
  onPrint(group: PrintGroup): void;
}) {
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
          <div className="flex flex-col gap-3 border-b border-slate-100 bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-bold text-ink">{group.subcategory.name}</h3>
              {group.category ? <p className="mt-0.5 text-xs font-semibold uppercase text-slate-500">{group.category.name}</p> : null}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-600 ring-1 ring-slate-200">{group.tasks.length} atriði</span>
              <Button
                type="button"
                className="bg-blueprint hover:bg-blue-700"
                onClick={() => onPrint({
                  categoryName: group.category?.name,
                  locationName,
                  subcategoryName: group.subcategory.name,
                  tasks: group.tasks
                })}
              >
                <Printer className="h-4 w-4" /> Prenta PDF
              </Button>
            </div>
          </div>
          <SafetyTaskTable tasks={group.tasks} data={data} />
        </section>
      ))}

      {uncategorizedTasks.length > 0 ? (
        <section className="overflow-hidden rounded-md border border-slate-200">
          <div className="flex flex-col gap-3 border-b border-slate-100 bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="font-bold text-ink">Án undirflokks</h3>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-600 ring-1 ring-slate-200">{uncategorizedTasks.length} atriði</span>
              <Button
                type="button"
                className="bg-blueprint hover:bg-blue-700"
                onClick={() => onPrint({
                  locationName,
                  subcategoryName: "Án undirflokks",
                  tasks: uncategorizedTasks
                })}
              >
                <Printer className="h-4 w-4" /> Prenta PDF
              </Button>
            </div>
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

function PrintableGroup({ group, data }: { group: PrintGroup; data: AppData }) {
  const generatedAt = new Intl.DateTimeFormat("is-IS", { dateStyle: "medium", timeStyle: "short" }).format(new Date());

  return (
    <section className="print-only print-report bg-white p-6 text-ink">
      <div className="border-b border-slate-300 pb-4">
        <p className="text-sm font-bold uppercase text-slate-500">PDF skýrsla</p>
        <h1 className="mt-1 text-2xl font-bold">Öryggisúttekt B25-27 og 29-31</h1>
        <p className="mt-2 text-sm text-slate-700">{group.locationName} · {group.subcategoryName}</p>
        {group.categoryName ? <p className="mt-1 text-sm text-slate-600">Flokkur: {group.categoryName}</p> : null}
        <p className="mt-1 text-sm text-slate-600">Útbúin: {generatedAt} · {group.tasks.length} atriði</p>
      </div>

      <div className="mt-5 grid gap-4">
        {group.tasks.map((task, index) => {
          const row = getTaskRow(task, data);
          return (
            <article key={task.id} className="print-break-inside-avoid rounded-md border border-slate-300 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase text-slate-500">Atriði {index + 1}</p>
                  <h2 className="mt-1 text-lg font-bold text-ink">{task.title}</h2>
                </div>
                <span className="rounded-full border border-slate-300 px-3 py-1 text-xs font-bold text-slate-700">{statusLabels[task.status]}</span>
              </div>
              <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
                <PrintDetail label="Íbúð / rými" value={row.unit} />
                <PrintDetail label="Ábyrgðaraðili" value={row.assignee ?? "Óúthlutað"} />
                <PrintDetail label="Stofnað" value={formatDate(task.created_at)} />
                <PrintDetail label="Skiladagur" value={formatDate(task.due_date)} />
              </dl>
              <div className="mt-3 rounded-md bg-slate-50 p-3 text-sm">
                <p className="font-bold text-slate-900">Lýsing</p>
                <p className="mt-1 whitespace-pre-wrap text-slate-700">{task.description || "Engin lýsing skráð."}</p>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function PrintDetail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-semibold text-slate-500">{label}</dt>
      <dd className="mt-0.5 font-bold text-slate-800">{value}</dd>
    </div>
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
