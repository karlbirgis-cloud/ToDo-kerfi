"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { PageHeader, Card, UserPill } from "@/components/ui";
import { statusLabels } from "@/lib/labels";
import { useAppData } from "@/lib/data-provider";
import type { AppData, Task, TaskStatus } from "@/lib/types";
import { cn, getTaskResponsiblePartyName, isOverdue, summarizeTasks } from "@/lib/utils";

type DashboardSortKey = "project" | "location" | "unit" | "title" | "description" | "category" | "subcategory" | "inspectionType" | "assignee" | "status";
type SortDirection = "asc" | "desc";

export default function DashboardPage() {
  const { data } = useAppData();
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [selectedLocationId, setSelectedLocationId] = useState("");
  const [selectedInspectionTypeId, setSelectedInspectionTypeId] = useState("");
  const [unitSearch, setUnitSearch] = useState("");
  const [showDone, setShowDone] = useState(false);
  const summary = summarizeTasks(data.tasks);
  const overdue = data.tasks.filter(isOverdue).length;
  const dashboardTasks = data.tasks
    .filter((task) => showDone || task.status === "open" || task.status === "in_progress")
    .sort((a, b) => {
      const statusOrder = { in_progress: 0, open: 1, done: 2 };
      return statusOrder[a.status] - statusOrder[b.status] || b.created_at.localeCompare(a.created_at);
    });
  const filteredDashboardTasks = dashboardTasks.filter((task) => {
    if (selectedProjectId && task.project_id !== selectedProjectId) return false;
    if (selectedLocationId && task.location_id !== selectedLocationId) return false;
    if (selectedInspectionTypeId === "none" && task.inspection_type_id) return false;
    if (selectedInspectionTypeId && selectedInspectionTypeId !== "none" && task.inspection_type_id !== selectedInspectionTypeId) return false;
    if (unitSearch.trim() && !taskMatchesUnitSearch(task, data, unitSearch)) return false;
    return true;
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
        <DashboardFilters
          data={data}
          selectedProjectId={selectedProjectId}
          selectedLocationId={selectedLocationId}
          selectedInspectionTypeId={selectedInspectionTypeId}
          unitSearch={unitSearch}
          showDone={showDone}
          onProjectChange={(projectId) => {
            setSelectedProjectId(projectId);
            setSelectedLocationId("");
          }}
          onLocationChange={setSelectedLocationId}
          onInspectionTypeChange={setSelectedInspectionTypeId}
          onUnitSearchChange={setUnitSearch}
          onShowDoneChange={setShowDone}
          onClear={() => {
            setSelectedProjectId("");
            setSelectedLocationId("");
            setSelectedInspectionTypeId("");
            setUnitSearch("");
            setShowDone(false);
          }}
        />
      </section>

      <section className="mt-4">
        <Card className="p-0">
          <div className="border-b border-slate-100 p-4">
            <h2 className="font-bold text-ink">Atriði eftir undirflokki</h2>
            <p className="mt-1 text-sm text-slate-600">Hver undirflokkur með sín atriði út frá völdum filterum.</p>
          </div>
          <SubcategoryTaskGroups tasks={filteredDashboardTasks} data={data} />
        </Card>
      </section>

      <section className="mt-6">
        <Card className="p-0">
          <div className="border-b border-slate-100 p-4">
            <h2 className="font-bold text-ink">{showDone ? "Öll valin atriði" : "Ókláruð og í vinnslu"}</h2>
            <p className="mt-1 text-sm text-slate-600">{filteredDashboardTasks.length} atriði út frá völdum filterum.</p>
          </div>
          <DashboardTaskTable tasks={filteredDashboardTasks} data={data} />
        </Card>
      </section>
    </AppShell>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: string }) {
  return <Card><p className={`text-3xl font-bold ${tone ?? "text-ink"}`}>{value}</p><p className="mt-1 text-sm font-medium text-slate-500">{label}</p></Card>;
}

function DashboardFilters({
  data,
  selectedProjectId,
  selectedLocationId,
  selectedInspectionTypeId,
  unitSearch,
  showDone,
  onProjectChange,
  onLocationChange,
  onInspectionTypeChange,
  onUnitSearchChange,
  onShowDoneChange,
  onClear
}: {
  data: AppData;
  selectedProjectId: string;
  selectedLocationId: string;
  selectedInspectionTypeId: string;
  unitSearch: string;
  showDone: boolean;
  onProjectChange: (projectId: string) => void;
  onLocationChange: (locationId: string) => void;
  onInspectionTypeChange: (inspectionTypeId: string) => void;
  onUnitSearchChange: (query: string) => void;
  onShowDoneChange: (showDone: boolean) => void;
  onClear: () => void;
}) {
  const projects = [...data.projects].sort((a, b) => a.full_name.localeCompare(b.full_name, "is", { sensitivity: "base", numeric: true }));
  const locations = data.locations
    .filter((location) => !selectedProjectId || location.project_id === selectedProjectId)
    .sort((a, b) => a.name.localeCompare(b.name, "is", { sensitivity: "base", numeric: true }));
  const inspectionTypes = [...data.inspection_types].sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name, "is", { sensitivity: "base" }));
  const hasActiveFilters = Boolean(selectedProjectId || selectedLocationId || selectedInspectionTypeId || unitSearch.trim() || showDone);

  return (
    <Card>
      <div className="grid gap-3 lg:grid-cols-[1fr_1fr_1fr_1fr_auto_auto] lg:items-end">
        <label className="grid gap-1 text-sm font-semibold text-slate-700">
          Filtera eftir verkefni
          <select
            value={selectedProjectId}
            onChange={(event) => onProjectChange(event.target.value)}
            className="touch-target rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-blueprint focus:ring-2 focus:ring-blueprint/20"
          >
            <option value="">Öll verkefni</option>
            {projects.map((project) => <option key={project.id} value={project.id}>{project.full_name}</option>)}
          </select>
        </label>
        <label className="grid gap-1 text-sm font-semibold text-slate-700">
          Filtera eftir götuheiti
          <select
            value={selectedLocationId}
            onChange={(event) => onLocationChange(event.target.value)}
            className="touch-target rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-blueprint focus:ring-2 focus:ring-blueprint/20"
          >
            <option value="">Allar götur</option>
            {locations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}
          </select>
        </label>
        <label className="grid gap-1 text-sm font-semibold text-slate-700">
          Leita eftir íbúðarnúmeri
          <input
            value={unitSearch}
            onChange={(event) => onUnitSearchChange(event.target.value)}
            placeholder="T.d. 0105"
            className="touch-target rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-blueprint focus:ring-2 focus:ring-blueprint/20"
          />
        </label>
        <label className="grid gap-1 text-sm font-semibold text-slate-700">
          Tegund úttektarlista
          <select
            value={selectedInspectionTypeId}
            onChange={(event) => onInspectionTypeChange(event.target.value)}
            className="touch-target rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-blueprint focus:ring-2 focus:ring-blueprint/20"
          >
            <option value="">Allar tegundir</option>
            <option value="none">Án tegundar</option>
            {inspectionTypes.map((inspectionType) => <option key={inspectionType.id} value={inspectionType.id}>{inspectionType.name}</option>)}
          </select>
        </label>
        <label className="touch-target flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-sm font-bold text-slate-700">
          <input
            type="checkbox"
            checked={showDone}
            onChange={(event) => onShowDoneChange(event.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-blueprint focus:ring-blueprint/30"
          />
          Sýna lokið
        </label>
        <button
          type="button"
          onClick={onClear}
          disabled={!hasActiveFilters}
          className="touch-target rounded-md border border-slate-300 bg-white px-4 text-sm font-bold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Hreinsa
        </button>
      </div>
    </Card>
  );
}

function taskMatchesUnitSearch(task: Task, data: AppData, query: string) {
  const unit = data.units.find((item) => item.id === task.unit_id);
  if (!unit) return false;

  const normalizedQuery = query.trim().toLocaleLowerCase("is");
  const normalizedUnitName = unit.name.toLocaleLowerCase("is");
  const queryDigits = normalizedQuery.match(/\d+/g)?.join("") ?? "";
  const unitDigits = unit.name.match(/\d+/g)?.join("") ?? "";

  return normalizedUnitName.includes(normalizedQuery) || Boolean(queryDigits && unitDigits.includes(queryDigits));
}

function DashboardTaskTable({
  tasks,
  data,
  showAssignee = true,
  secondaryColumn = "subcategory"
}: {
  tasks: Task[];
  data: AppData;
  showAssignee?: boolean;
  secondaryColumn?: "subcategory" | "assignee";
}) {
  const router = useRouter();
  const { updateTaskStatus } = useAppData();
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
        <table className={cn("w-full border-collapse text-left text-sm", showAssignee ? "min-w-[1440px]" : "min-w-[1240px]")}>
          <thead className="bg-slate-50 text-xs font-bold uppercase text-slate-500">
            <tr>
              <Th sortKey="project" activeSortKey={sortKey} direction={sortDirection} onSort={toggleSort}>Verkefni</Th>
              <Th sortKey="location" activeSortKey={sortKey} direction={sortDirection} onSort={toggleSort}>Gata</Th>
              <Th sortKey="unit" activeSortKey={sortKey} direction={sortDirection} onSort={toggleSort}>Íbúð</Th>
              <Th sortKey="title" activeSortKey={sortKey} direction={sortDirection} onSort={toggleSort}>Titill</Th>
              <Th sortKey="description" activeSortKey={sortKey} direction={sortDirection} onSort={toggleSort}>Lýsing</Th>
              <Th sortKey="category" activeSortKey={sortKey} direction={sortDirection} onSort={toggleSort}>Flokkur</Th>
              <Th sortKey={secondaryColumn} activeSortKey={sortKey} direction={sortDirection} onSort={toggleSort}>{secondaryColumn === "assignee" ? "Ábyrgðaraðili" : "Undirflokkur"}</Th>
              <Th sortKey="inspectionType" activeSortKey={sortKey} direction={sortDirection} onSort={toggleSort}>Tegund</Th>
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
                  className={cn("cursor-pointer border-l-4 transition focus:outline-none", getDashboardStatusTone(task.status))}
                >
                  <Td className="font-semibold text-ink">{row.project}</Td>
                  <Td>{row.location}</Td>
                  <Td>{row.unit}</Td>
                  <Td className="font-bold text-ink">{task.title}</Td>
                  <Td className="max-w-sm text-slate-600"><span className="line-clamp-2">{task.description || "-"}</span></Td>
                  <Td>{row.category}</Td>
                  <Td>{secondaryColumn === "assignee" ? <UserPill name={row.assignee} /> : row.subcategory}</Td>
                  <Td>{row.inspectionType}</Td>
                  {showAssignee ? <Td><UserPill name={row.assignee} /></Td> : null}
                  <Td>
                    <DashboardStatusSelect
                      task={task}
                      onChange={(status) => updateTaskStatus(task.id, status)}
                    />
                  </Td>
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
            <div
              key={task.id}
              role="link"
              tabIndex={0}
              onClick={() => router.push(`/tasks/${task.id}`)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") router.push(`/tasks/${task.id}`);
              }}
              className={cn("rounded-md border border-l-4 p-3 text-left shadow-sm", getDashboardStatusTone(task.status))}
            >
              <div className="flex flex-wrap gap-2">
                <DashboardStatusSelect
                  task={task}
                  onChange={(status) => updateTaskStatus(task.id, status)}
                />
                {showAssignee ? <UserPill name={row.assignee} /> : null}
              </div>
              <h3 className="mt-3 font-bold text-ink">{task.title}</h3>
              <p className="mt-1 line-clamp-2 text-sm text-slate-600">{task.description || "-"}</p>
              <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <Detail label="Verkefni" value={row.project} />
                <Detail label="Gata" value={row.location} />
                <Detail label="Íbúð" value={row.unit} />
                <Detail label="Flokkur" value={row.category} />
                <Detail label="Tegund" value={row.inspectionType} />
                {secondaryColumn === "assignee" ? <Detail label="Ábyrgðaraðili" value={row.assignee ?? "Óúthlutað"} /> : <Detail label="Undirflokkur" value={row.subcategory} />}
              </dl>
            </div>
          );
        })}
      </div>
    </>
  );
}

function DashboardStatusSelect({ task, onChange }: { task: Task; onChange: (status: TaskStatus) => void }) {
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
          getDashboardStatusSelectTone(task.status)
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

function getDashboardStatusTone(status: TaskStatus) {
  const tones: Record<TaskStatus, string> = {
    open: "border-l-blue-500 bg-blue-50/60 hover:bg-blue-100/70 focus:bg-blue-100/70",
    in_progress: "border-l-amber-500 bg-amber-50/70 hover:bg-amber-100/75 focus:bg-amber-100/75",
    done: "border-l-emerald-500 bg-emerald-50/60 hover:bg-emerald-100/70 focus:bg-emerald-100/70"
  };

  return tones[status];
}

function getDashboardStatusSelectTone(status: TaskStatus) {
  const tones: Record<TaskStatus, string> = {
    open: "border-blue-200 bg-blue-50 text-blue-900 hover:border-blue-400 focus:border-blue-500 focus:ring-blue-200",
    in_progress: "border-amber-200 bg-amber-50 text-amber-950 hover:border-amber-400 focus:border-amber-500 focus:ring-amber-200",
    done: "border-emerald-200 bg-emerald-50 text-emerald-900 hover:border-emerald-400 focus:border-emerald-500 focus:ring-emerald-200"
  };

  return tones[status];
}

function SubcategoryTaskGroups({ tasks, data }: { tasks: Task[]; data: AppData }) {
  const groups = data.subcategories
    .map((subcategory) => ({
      subcategory,
      category: data.categories.find((category) => category.id === subcategory.category_id),
      tasks: tasks.filter((task) => task.subcategory_id === subcategory.id)
    }))
    .filter((group) => group.tasks.length > 0)
    .sort((a, b) => {
      const categorySort = (a.category?.name ?? "").localeCompare(b.category?.name ?? "", "is", { sensitivity: "base" });
      return categorySort || a.subcategory.name.localeCompare(b.subcategory.name, "is", { sensitivity: "base" });
    });

  const uncategorizedTasks = tasks.filter((task) => !task.subcategory_id || !data.subcategories.some((subcategory) => subcategory.id === task.subcategory_id));

  if (groups.length === 0 && uncategorizedTasks.length === 0) {
    return <div className="p-6 text-sm text-slate-600">Engin atriði fundust út frá völdum filterum.</div>;
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
          <DashboardTaskTable tasks={group.tasks} data={data} showAssignee={false} secondaryColumn="assignee" />
        </section>
      ))}

      {uncategorizedTasks.length > 0 ? (
        <section className="overflow-hidden rounded-md border border-slate-200">
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 bg-slate-50 px-4 py-3">
            <h3 className="font-bold text-ink">Án undirflokks</h3>
            <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-600 ring-1 ring-slate-200">{uncategorizedTasks.length} atriði</span>
          </div>
          <DashboardTaskTable tasks={uncategorizedTasks} data={data} showAssignee={false} secondaryColumn="assignee" />
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
    inspectionType: row.inspectionType,
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
    inspectionType: data.inspection_types.find((inspectionType) => inspectionType.id === task.inspection_type_id)?.name ?? "Án tegundar",
    assignee: getTaskResponsiblePartyName(data, task)
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
