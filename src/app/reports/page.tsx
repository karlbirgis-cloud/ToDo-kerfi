"use client";

import { useMemo, useState } from "react";
import { Camera, FileText, MapPin, Printer } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button, Card, EmptyState, PageHeader, PriorityBadge, StatusBadge, UserPill } from "@/components/ui";
import { useAppData } from "@/lib/data-provider";
import type { AppData, FloorPlan, Task, TaskPlanMarker, TaskStatus } from "@/lib/types";
import { cn, formatDate, getTaskResponsiblePartyName } from "@/lib/utils";

type StatusFilter = "active" | "all" | TaskStatus;

const statusFilterLabels: Record<StatusFilter, string> = {
  active: "Ólokið og í vinnslu",
  all: "Allar stöður",
  open: "Ólokið",
  in_progress: "Í vinnslu",
  done: "Lokið"
};

export default function ReportsPage() {
  const { data } = useAppData();
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [selectedLocationId, setSelectedLocationId] = useState("");
  const [selectedAssigneeId, setSelectedAssigneeId] = useState("");
  const [unitSearch, setUnitSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("active");
  const [includeImages, setIncludeImages] = useState(true);
  const [includeFloorPlans, setIncludeFloorPlans] = useState(true);
  const [includeComments, setIncludeComments] = useState(true);

  const projectOptions = useMemo(() => getProjectOptions(data), [data]);
  const locationOptions = useMemo(() => getLocationOptions(data, selectedProjectId), [data, selectedProjectId]);
  const assigneeOptions = useMemo(() => getAssigneeOptions(data), [data]);
  const tasks = useMemo(
    () => getReportTasks(data, {
      projectId: selectedProjectId,
      locationId: selectedLocationId,
      assigneeId: selectedAssigneeId,
      unitSearch,
      statusFilter
    }),
    [data, selectedAssigneeId, selectedLocationId, selectedProjectId, statusFilter, unitSearch]
  );
  const reportTitle = getReportTitle(data, selectedProjectId, selectedLocationId, selectedAssigneeId, unitSearch);
  const reportSubtitle = `${statusFilterLabels[statusFilter]} · ${tasks.length} atriði`;

  return (
    <AppShell>
      <div className="no-print">
        <PageHeader title="Skýrslur" kicker="PDF yfirlit" />
        <Card>
          <div className="grid gap-3 xl:grid-cols-[1fr_1fr_1fr_1fr_auto_auto] xl:items-end">
            <label className="grid gap-1 text-sm font-semibold text-slate-700">
              Verkefni
              <select
                value={selectedProjectId}
                onChange={(event) => {
                  setSelectedProjectId(event.target.value);
                  setSelectedLocationId("");
                }}
                className="touch-target rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-blueprint focus:ring-2 focus:ring-blueprint/20"
              >
                <option value="">Öll verkefni</option>
                {projectOptions.map((project) => <option key={project.id} value={project.id}>{project.label}</option>)}
              </select>
            </label>

            <label className="grid gap-1 text-sm font-semibold text-slate-700">
              Götuheiti
              <select
                value={selectedLocationId}
                onChange={(event) => setSelectedLocationId(event.target.value)}
                className="touch-target rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-blueprint focus:ring-2 focus:ring-blueprint/20"
              >
                <option value="">Allar götur</option>
                {locationOptions.map((location) => <option key={location.id} value={location.id}>{location.label}</option>)}
              </select>
            </label>

            <label className="grid gap-1 text-sm font-semibold text-slate-700">
              Ábyrgðaraðili
              <select
                value={selectedAssigneeId}
                onChange={(event) => setSelectedAssigneeId(event.target.value)}
                className="touch-target rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-blueprint focus:ring-2 focus:ring-blueprint/20"
              >
                <option value="">Allir ábyrgðaraðilar</option>
                {assigneeOptions.map((assignee) => <option key={assignee.id} value={assignee.id}>{assignee.label}</option>)}
              </select>
            </label>

            <label className="grid gap-1 text-sm font-semibold text-slate-700">
              Íbúð / rými
              <input
                value={unitSearch}
                onChange={(event) => setUnitSearch(event.target.value)}
                placeholder="T.d. 0105"
                className="touch-target rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-blueprint focus:ring-2 focus:ring-blueprint/20"
              />
            </label>

            <label className="grid gap-1 text-sm font-semibold text-slate-700">
              Staða
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
                className="touch-target rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-blueprint focus:ring-2 focus:ring-blueprint/20"
              >
                {Object.entries(statusFilterLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>

            <div className="grid gap-2">
              <label className="touch-target flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-sm font-bold text-slate-700">
                <input
                  type="checkbox"
                  checked={includeFloorPlans}
                  onChange={(event) => setIncludeFloorPlans(event.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-blueprint focus:ring-blueprint/30"
                />
                Grunnmyndir
              </label>
              <label className="touch-target flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-sm font-bold text-slate-700">
                <input
                  type="checkbox"
                  checked={includeImages}
                  onChange={(event) => setIncludeImages(event.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-blueprint focus:ring-blueprint/30"
                />
                Myndir
              </label>
              <label className="touch-target flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-sm font-bold text-slate-700">
                <input
                  type="checkbox"
                  checked={includeComments}
                  onChange={(event) => setIncludeComments(event.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-blueprint focus:ring-blueprint/30"
                />
                Athugasemdir
              </label>
            </div>

            <Button onClick={() => window.print()} disabled={tasks.length === 0}>
              <Printer className="h-4 w-4" /> Vista sem PDF
            </Button>
          </div>
        </Card>
      </div>

      <section className="print-report mt-5 rounded-lg border border-slate-200 bg-white/95 p-5 shadow-soft print:mt-0">
        <ReportHeader title={reportTitle} subtitle={reportSubtitle} />

        {tasks.length === 0 ? (
          <EmptyState title="Engin atriði í skýrslu" body="Breyttu vali eða stöðu til að sjá atriði í skýrslunni." />
        ) : (
          <div className="mt-5 grid gap-4">
            {tasks.map((task) => (
              <ReportTask
                key={task.id}
                task={task}
                data={data}
                includeFloorPlans={includeFloorPlans}
                includeImages={includeImages}
                includeComments={includeComments}
              />
            ))}
          </div>
        )}
      </section>
    </AppShell>
  );
}

function ReportHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <p className="flex items-center gap-2 text-sm font-bold uppercase text-slate-500"><FileText className="h-4 w-4" /> Skýrsla</p>
        <h1 className="mt-1 text-2xl font-bold text-ink">{title}</h1>
        <p className="mt-1 text-sm text-slate-600">{subtitle}</p>
      </div>
      <div className="text-sm font-semibold text-slate-600">
        <p>Útbúin: {formatDate(new Date().toISOString())}</p>
      </div>
    </div>
  );
}

function ReportTask({ task, data, includeFloorPlans, includeImages, includeComments }: { task: Task; data: AppData; includeFloorPlans: boolean; includeImages: boolean; includeComments: boolean }) {
  const row = getTaskReportRow(task, data);
  const images = imagesForTask(data, task.id);
  const comments = data.task_comments.filter((comment) => comment.task_id === task.id);
  const planMarker = data.task_plan_markers.find((marker) => marker.task_id === task.id);
  const floorPlan = planMarker ? data.floor_plans.find((plan) => plan.id === planMarker.floor_plan_id) : undefined;

  return (
    <article className={cn("print-break-inside-avoid rounded-md border p-4", getTaskBorderTone(task.status))}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-ink">{task.title}</h2>
          <p className="mt-1 text-sm text-slate-600">{row.project} · {row.location} · {row.unit}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusBadge status={task.status} />
          <PriorityBadge priority={task.priority} />
          <UserPill name={row.assignee} />
        </div>
      </div>

      <div className="mt-4 rounded-md bg-slate-50 p-3 text-sm text-slate-700">
        <p className="font-bold text-slate-900">Lýsing</p>
        <p className="mt-1 whitespace-pre-wrap">{task.description || "Engin lýsing skráð."}</p>
      </div>

      {includeFloorPlans && planMarker && floorPlan ? (
        <ReportFloorPlanMarker floorPlan={floorPlan} marker={planMarker} taskTitle={task.title} />
      ) : null}

      {includeImages && images.length > 0 ? (
        <div className="mt-4">
          <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-ink"><Camera className="h-4 w-4" /> Myndir ({images.length})</h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {images.map((image) => (
              <a key={image.id} href={image.image_url} target="_blank" rel="noopener noreferrer" title="Opna mynd í nýjum glugga" className="block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={image.image_url} alt={`Mynd fyrir ${task.title}`} className="h-44 w-full rounded-md border border-slate-200 bg-slate-100 object-contain transition hover:opacity-90" />
              </a>
            ))}
          </div>
        </div>
      ) : null}

      {includeComments && comments.length > 0 ? (
        <div className="mt-4">
          <h3 className="mb-2 text-sm font-bold text-ink">Athugasemdir ({comments.length})</h3>
          <div className="grid gap-2">
            {comments.map((comment) => {
              const author = data.profiles.find((profile) => profile.id === comment.user_id);
              return (
                <div key={comment.id} className="rounded-md border border-slate-200 bg-white p-3 text-sm">
                  <p className="font-bold text-slate-800">{author?.name ?? "Óþekktur notandi"} · {formatDate(comment.created_at)}</p>
                  <p className="mt-1 text-slate-700">{comment.comment}</p>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </article>
  );
}

function ReportFloorPlanMarker({ floorPlan, marker, taskTitle }: { floorPlan: FloorPlan; marker: TaskPlanMarker; taskTitle: string }) {
  const isPdf = isPdfFloorPlan(floorPlan);

  return (
    <div className="mt-4 print-break-inside-avoid">
      <h3 className="mb-2 flex items-center gap-2 text-sm font-bold text-ink"><MapPin className="h-4 w-4" /> Staðsetning á grunnmynd</h3>
      <div className="overflow-hidden rounded-md border border-slate-200 bg-slate-100 p-2">
        <div className={cn("relative mx-auto max-w-full", isPdf ? "h-80 w-full" : "w-fit")}>
          {isPdf ? (
            <iframe
              src={`${floorPlan.image_url}#toolbar=0&navpanes=0&view=FitH`}
              title={`Grunnmynd fyrir ${taskTitle}`}
              className="pointer-events-none h-full w-full rounded-sm border-0 bg-white"
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={floorPlan.image_url} alt={`Grunnmynd fyrir ${taskTitle}`} className="block max-h-80 max-w-full object-contain" />
          )}
          <span
            className="absolute h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-red-600 shadow-lg ring-4 ring-red-200"
            style={{ left: `${marker.x_percent}%`, top: `${marker.y_percent}%` }}
          />
        </div>
        <div className="-mx-2 mt-2 border-t border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-ink">{floorPlan.name}</div>
      </div>
    </div>
  );
}

function getProjectOptions(data: AppData) {
  return data.projects
    .map((project) => ({ id: project.id, label: project.full_name }))
    .sort((a, b) => a.label.localeCompare(b.label, "is", { sensitivity: "base", numeric: true }));
}

function getLocationOptions(data: AppData, projectId: string) {
  return data.locations
    .filter((location) => !projectId || location.project_id === projectId)
    .map((location) => {
      const project = data.projects.find((item) => item.id === location.project_id);
      return { id: location.id, label: projectId ? location.name : `${location.name} · ${project?.full_name ?? "-"}` };
    })
    .sort((a, b) => a.label.localeCompare(b.label, "is", { sensitivity: "base", numeric: true }));
}

function getAssigneeOptions(data: AppData) {
  return [
    { id: "unassigned", label: "Óúthlutað" },
    ...data.responsible_parties
      .map((party) => ({ id: party.id, label: party.name }))
      .sort((a, b) => a.label.localeCompare(b.label, "is", { sensitivity: "base" }))
  ];
}

function getReportTasks(
  data: AppData,
  filters: {
    projectId: string;
    locationId: string;
    assigneeId: string;
    unitSearch: string;
    statusFilter: StatusFilter;
  }
) {
  return data.tasks
    .filter((task) => {
      const { projectId, locationId, assigneeId, unitSearch, statusFilter } = filters;
      if (statusFilter === "active" && task.status === "done") return false;
      if (statusFilter !== "active" && statusFilter !== "all" && task.status !== statusFilter) return false;
      if (projectId && task.project_id !== projectId) return false;
      if (locationId && task.location_id !== locationId) return false;
      const responsiblePartyId = task.responsible_party_id ?? task.assigned_to_user_id;
      if (assigneeId === "unassigned" && responsiblePartyId) return false;
      if (assigneeId && assigneeId !== "unassigned" && responsiblePartyId !== assigneeId) return false;
      if (unitSearch.trim() && !taskMatchesUnitSearch(task, data, unitSearch)) return false;
      return true;
    })
    .sort((a, b) => {
      const statusOrder: Record<TaskStatus, number> = { in_progress: 0, open: 1, done: 2 };
      return statusOrder[a.status] - statusOrder[b.status] || getTaskReportRow(a, data).location.localeCompare(getTaskReportRow(b, data).location, "is", { numeric: true }) || a.title.localeCompare(b.title, "is");
    });
}

function getReportTitle(data: AppData, projectId: string, locationId: string, assigneeId: string, unitSearch: string) {
  const parts = [
    data.projects.find((project) => project.id === projectId)?.full_name,
    data.locations.find((location) => location.id === locationId)?.name,
    assigneeId === "unassigned" ? "Óúthlutað" : data.responsible_parties.find((party) => party.id === assigneeId)?.name,
    unitSearch.trim() ? `Íbúð/rými: ${unitSearch.trim()}` : undefined
  ].filter(Boolean);

  return parts.length > 0 ? `Skýrsla: ${parts.join(" · ")}` : "Skýrsla: Öll atriði";
}

function getTaskReportRow(task: Task, data: AppData) {
  return {
    project: data.projects.find((project) => project.id === task.project_id)?.full_name ?? "-",
    location: data.locations.find((location) => location.id === task.location_id)?.name ?? "-",
    unit: data.units.find((unit) => unit.id === task.unit_id)?.name ?? "-",
    category: data.categories.find((category) => category.id === task.category_id)?.name ?? "-",
    subcategory: data.subcategories.find((subcategory) => subcategory.id === task.subcategory_id)?.name ?? "-",
    assignee: getTaskResponsiblePartyName(data, task)
  };
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

function imagesForTask(data: AppData, taskId: string) {
  return data.task_images.filter((image) => image.task_id === taskId);
}

function isPdfFloorPlan(plan: FloorPlan) {
  return plan.mime_type === "application/pdf" || plan.storage_path.toLowerCase().endsWith(".pdf") || plan.image_url.toLowerCase().includes(".pdf");
}

function getTaskBorderTone(status: TaskStatus) {
  const tones: Record<TaskStatus, string> = {
    open: "border-l-4 border-l-blue-500",
    in_progress: "border-l-4 border-l-amber-500",
    done: "border-l-4 border-l-emerald-500"
  };

  return tones[status];
}
