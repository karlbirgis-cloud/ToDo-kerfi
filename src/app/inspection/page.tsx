"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, ArrowUpRight, Check, ClipboardCheck, ClipboardList, ListChecks, MapPin, MinusCircle, Save } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { TaskCard } from "@/components/task-card";
import { Button, Card, EmptyState, PageHeader, ProgressBar } from "@/components/ui";
import { useAppData } from "@/lib/data-provider";
import { cn, percent, summarizeTasks, tasksFor } from "@/lib/utils";
import type { AppData, InspectionChecklistItem, InspectionRunItemStatus } from "@/lib/types";

export default function InspectionPage() {
  const { data, completeTask, flushPendingCloudSave, getOrCreateInspectionRun, updateInspectionRunItem } = useAppData();
  const [inspectionTypeId, setInspectionTypeId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [locationId, setLocationId] = useState("");
  const [unitId, setUnitId] = useState("");
  const [runId, setRunId] = useState("");
  const [openIssueItemId, setOpenIssueItemId] = useState("");

  const inspectionTypes = useMemo(
    () => data.inspection_types.filter((item) => item.is_active).sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name, "is", { numeric: true })),
    [data.inspection_types]
  );
  const template = useMemo(
    () => data.inspection_templates.find((item) => item.inspection_type_id === inspectionTypeId && item.is_active),
    [data.inspection_templates, inspectionTypeId]
  );
  const projects = useMemo(
    () => data.projects.filter((project) => project.status !== "done").sort((a, b) => a.full_name.localeCompare(b.full_name, "is", { numeric: true })),
    [data.projects]
  );
  const locations = useMemo(
    () => data.locations.filter((location) => location.project_id === projectId).sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name, "is", { numeric: true })),
    [data.locations, projectId]
  );
  const units = useMemo(
    () => data.units.filter((unit) => unit.location_id === locationId).sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name, "is", { numeric: true })),
    [data.units, locationId]
  );

  useEffect(() => {
    const preferred = inspectionTypes.find((item) => item.name.toLowerCase().includes("afhendingu")) ?? inspectionTypes[0];
    if (!inspectionTypeId && preferred) setInspectionTypeId(preferred.id);
    if (inspectionTypeId && !inspectionTypes.some((item) => item.id === inspectionTypeId)) setInspectionTypeId(preferred?.id ?? "");
  }, [inspectionTypeId, inspectionTypes]);

  useEffect(() => {
    if (!projectId && projects[0]) setProjectId(projects[0].id);
    if (projectId && !projects.some((project) => project.id === projectId)) setProjectId(projects[0]?.id ?? "");
  }, [projectId, projects]);

  useEffect(() => {
    if (!locations.some((location) => location.id === locationId)) setLocationId(locations[0]?.id ?? "");
  }, [locationId, locations]);

  useEffect(() => {
    if (!units.some((unit) => unit.id === unitId)) setUnitId(units[0]?.id ?? "");
  }, [unitId, units]);

  useEffect(() => {
    if (!template || !inspectionTypeId || !projectId || !locationId || !unitId) {
      if (runId) setRunId("");
      return;
    }

    const nextRunId = getOrCreateInspectionRun({
      inspection_type_id: inspectionTypeId,
      template_id: template.id,
      project_id: projectId,
      location_id: locationId,
      unit_id: unitId
    });
    if (nextRunId !== runId) setRunId(nextRunId);
  }, [getOrCreateInspectionRun, inspectionTypeId, locationId, projectId, runId, template, unitId]);

  const project = data.projects.find((item) => item.id === projectId);
  const location = data.locations.find((item) => item.id === locationId);
  const unit = data.units.find((item) => item.id === unitId);
  const checklistItems = template
    ? data.inspection_checklist_items.filter((item) => item.template_id === template.id).sort((a, b) => a.sort_order - b.sort_order)
    : [];
  const runItems = data.inspection_run_items.filter((item) => item.run_id === runId);
  const runItemIds = new Set(runItems.map((item) => item.id));
  const issueTasks = data.tasks
    .filter((task) => task.inspection_run_item_id && runItemIds.has(task.inspection_run_item_id) && task.status !== "done")
    .sort((a, b) => a.title.localeCompare(b.title, "is", { numeric: true }));
  const unitTasks = unit ? tasksFor(data, { unit_id: unit.id }) : [];
  const summary = summarizeTasks(unitTasks);
  const checklistSummary = summarizeChecklist(checklistItems.length, runItems);
  const groupedItems = groupChecklistItems(checklistItems);

  async function markItem(checklistItemId: string, status: InspectionRunItemStatus) {
    if (!runId) return;
    updateInspectionRunItem(runId, checklistItemId, status);
    setOpenIssueItemId("");
    await flushPendingCloudSave().catch(() => undefined);
  }

  return (
    <AppShell>
      <PageHeader title="Úttekt" kicker="Loka skoðun og athugasemdir" />

      <div className="grid gap-4 lg:grid-cols-[380px_1fr]">
        <div className="grid gap-4 lg:sticky lg:top-24 lg:self-start">
          <Card>
            <div className="mb-4 flex items-center gap-2 font-bold text-ink">
              <MapPin className="h-4 w-4" /> Veldu skoðun
            </div>
            <div className="grid gap-3">
              <InspectionSelect
                label="Tegund úttektar"
                value={inspectionTypeId}
                onChange={(value) => {
                  setInspectionTypeId(value);
                  setRunId("");
                  setOpenIssueItemId("");
                }}
                options={inspectionTypes.map((item) => ({ value: item.id, label: item.name }))}
                placeholder="Engin tegund"
              />
              <InspectionSelect
                label="Verkefni"
                value={projectId}
                onChange={(value) => {
                  setProjectId(value);
                  setLocationId("");
                  setUnitId("");
                  setRunId("");
                  setOpenIssueItemId("");
                }}
                options={projects.map((item) => ({ value: item.id, label: item.full_name }))}
                placeholder="Ekkert verkefni"
              />
              <InspectionSelect
                label="Gata / byggingarhluti"
                value={locationId}
                onChange={(value) => {
                  setLocationId(value);
                  setUnitId("");
                  setRunId("");
                  setOpenIssueItemId("");
                }}
                options={locations.map((item) => ({ value: item.id, label: item.name }))}
                placeholder="Engin gata"
                disabled={!projectId}
              />
              <InspectionSelect
                label="Íbúð / rými"
                value={unitId}
                onChange={(value) => {
                  setUnitId(value);
                  setRunId("");
                  setOpenIssueItemId("");
                }}
                options={units.map((item) => ({ value: item.id, label: item.name }))}
                placeholder="Ekkert rými"
                disabled={!locationId}
              />
            </div>
          </Card>

          {unit ? (
            <Card>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-500">{project?.full_name} · {location?.name}</p>
                  <h2 className="mt-1 text-xl font-bold text-ink">{unit.name}</h2>
                </div>
                <Link href={`/projects/${projectId}/locations/${locationId}/units/${unitId}`} className="touch-target inline-flex items-center justify-center rounded-md border border-slate-200 px-3 text-sm font-bold text-slate-700">
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <Metric label="Opið" value={summary.open} tone="text-blue-800" />
                <Metric label="Í vinnslu" value={summary.in_progress} tone="text-amber-700" />
                <Metric label="Lokið" value={summary.done} tone="text-emerald-700" />
              </div>
              <div className="mt-4">
                <div className="mb-2 flex items-center justify-between text-sm font-semibold text-slate-600">
                  <span>Framvinda atriða</span>
                  <span>{summary.progress}%</span>
                </div>
                <ProgressBar value={summary.progress} />
              </div>
            </Card>
          ) : null}

          {runId ? (
            <Card>
              <h2 className="flex items-center gap-2 font-bold text-ink"><ClipboardList className="h-4 w-4" /> Framvinda skoðunar</h2>
              <div className="mt-4 grid grid-cols-2 gap-2 text-center">
                <Metric label="Í lagi" value={checklistSummary.ok} tone="text-emerald-700" />
                <Metric label="Athugasemdir" value={checklistSummary.issue} tone="text-red-700" />
                <Metric label="Á ekki við" value={checklistSummary.notApplicable} tone="text-slate-700" />
                <Metric label="Óskoðað" value={checklistSummary.unchecked} tone="text-amber-700" />
              </div>
              <div className="mt-4">
                <div className="mb-2 flex items-center justify-between text-sm font-semibold text-slate-600">
                  <span>Tékklisti</span>
                  <span>{checklistSummary.progress}%</span>
                </div>
                <ProgressBar value={checklistSummary.progress} />
              </div>
            </Card>
          ) : null}
        </div>

        <div className="grid gap-4">
          {!unit ? (
            <EmptyState title="Veldu rými til að byrja" body="Veldu verkefni, götu og íbúð eða rými til að opna loka skoðunina." />
          ) : !template ? (
            <EmptyState title="Ekkert sniðmát tengt tegundinni" body="Þessi tegund úttektar er til, en er ekki með tékklista ennþá." />
          ) : (
            <>
              <Card>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="flex items-center gap-2 text-lg font-bold text-ink">
                      <ClipboardCheck className="h-5 w-5" /> {template.name}
                    </h2>
                    <p className="mt-1 text-sm font-semibold text-slate-500">{checklistItems.length} atriði · {project?.full_name} · {location?.name} · {unit.name}</p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-bold text-slate-700 ring-1 ring-slate-200">{checklistSummary.progress}% lokið</span>
                </div>
              </Card>

              <section className="grid gap-4">
                {groupedItems.map(([section, items]) => (
                  <div key={section} className="overflow-hidden rounded-lg border border-slate-200 bg-white/95 shadow-soft">
                    <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
                      <h2 className="font-bold text-ink">{section}</h2>
                    </div>
                    <div className="divide-y divide-slate-100">
                      {items.map((item) => {
                        const runItem = runItems.find((candidate) => candidate.checklist_item_id === item.id);
                        const task = runItem?.task_id ? data.tasks.find((candidate) => candidate.id === runItem.task_id) : undefined;
                        const status = runItem?.status ?? "unchecked";

                        return (
                          <ChecklistRow
                            key={item.id}
                            data={data}
                            item={item}
                            runId={runId}
                            status={status}
                            taskId={task?.id}
                            isIssueOpen={openIssueItemId === item.id}
                            onMark={markItem}
                            onOpenIssue={() => setOpenIssueItemId((current) => current === item.id ? "" : item.id)}
                            onSavedIssue={() => {
                              setOpenIssueItemId("");
                              flushPendingCloudSave().catch(() => undefined);
                            }}
                          />
                        );
                      })}
                    </div>
                  </div>
                ))}
              </section>

              <section>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h2 className="flex items-center gap-2 font-bold text-ink">
                    <ListChecks className="h-4 w-4" /> Opin atriði úr skoðun
                  </h2>
                  <span className="rounded-full bg-white px-3 py-1 text-sm font-bold text-slate-700 ring-1 ring-slate-200">{issueTasks.length}</span>
                </div>
                {issueTasks.length > 0 ? (
                  <div className="grid gap-3 md:grid-cols-2">
                    {issueTasks.map((task) => (
                      <TaskCard key={task.id} task={task} data={data} onDone={() => completeTask(task.id)} />
                    ))}
                  </div>
                ) : (
                  <EmptyState title="Engin opin afhendingaratriði" body="Athugasemdir sem stofnast úr tékklistanum birtast hér." />
                )}
              </section>
            </>
          )}
        </div>
      </div>
    </AppShell>
  );
}

function ChecklistRow({
  data,
  isIssueOpen,
  item,
  onMark,
  onOpenIssue,
  onSavedIssue,
  runId,
  status,
  taskId
}: {
  data: AppData;
  isIssueOpen: boolean;
  item: InspectionChecklistItem;
  onMark(checklistItemId: string, status: InspectionRunItemStatus): void;
  onOpenIssue(): void;
  onSavedIssue(): void;
  runId: string;
  status: InspectionRunItemStatus;
  taskId?: string;
}) {
  return (
    <div className={cn("grid gap-3 p-4", status === "issue" && "bg-red-50/45", status === "ok" && "bg-emerald-50/35")}>
      <div className="grid gap-3 xl:grid-cols-[1fr_auto] xl:items-start">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-bold text-ink">{item.title}</h3>
            <StatusPill status={status} />
            {taskId ? (
              <Link href={`/tasks/${taskId}`} className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs font-bold text-blueprint ring-1 ring-blue-100">
                Opna atriði <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            ) : null}
          </div>
          <p className="mt-1 text-sm text-slate-600">{item.description}</p>
        </div>
        <div className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap xl:justify-end">
          <button
            type="button"
            onClick={() => onMark(item.id, "ok")}
            className={cn("touch-target inline-flex items-center justify-center gap-1 rounded-md border px-3 text-sm font-bold transition", status === "ok" ? "border-emerald-300 bg-emerald-100 text-emerald-900" : "border-slate-200 bg-white text-slate-700 hover:bg-emerald-50")}
          >
            <Check className="h-4 w-4" /> Í lagi
          </button>
          <button
            type="button"
            onClick={onOpenIssue}
            className={cn("touch-target inline-flex items-center justify-center gap-1 rounded-md border px-3 text-sm font-bold transition", status === "issue" ? "border-red-300 bg-red-100 text-red-900" : "border-slate-200 bg-white text-slate-700 hover:bg-red-50")}
          >
            <AlertTriangle className="h-4 w-4" /> Athugasemd
          </button>
          <button
            type="button"
            onClick={() => onMark(item.id, "not_applicable")}
            className={cn("touch-target inline-flex items-center justify-center gap-1 rounded-md border px-3 text-sm font-bold transition", status === "not_applicable" ? "border-slate-400 bg-slate-200 text-slate-900" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50")}
          >
            <MinusCircle className="h-4 w-4" /> Á ekki við
          </button>
        </div>
      </div>
      {isIssueOpen ? <IssueForm data={data} item={item} runId={runId} onSaved={onSavedIssue} /> : null}
    </div>
  );
}

function IssueForm({ data, item, onSaved, runId }: { data: AppData; item: InspectionChecklistItem; onSaved(): void; runId: string }) {
  const { createInspectionIssue } = useAppData();
  const activeCategories = data.categories.filter((category) => category.is_active).sort((a, b) => a.sort_order - b.sort_order);
  const initialCategoryId = item.category_id && activeCategories.some((category) => category.id === item.category_id) ? item.category_id : activeCategories[0]?.id ?? "";
  const [categoryId, setCategoryId] = useState(initialCategoryId);
  const subcategories = data.subcategories
    .filter((subcategory) => subcategory.category_id === categoryId && subcategory.is_active)
    .sort((a, b) => a.sort_order - b.sort_order);
  const initialSubcategoryId = item.subcategory_id && subcategories.some((subcategory) => subcategory.id === item.subcategory_id) ? item.subcategory_id : subcategories[0]?.id ?? "";
  const [subcategoryId, setSubcategoryId] = useState(initialSubcategoryId);
  const [description, setDescription] = useState("");
  const [responsiblePartyId, setResponsiblePartyId] = useState("");

  useEffect(() => {
    if (!subcategories.some((subcategory) => subcategory.id === subcategoryId)) {
      setSubcategoryId(subcategories[0]?.id ?? "");
    }
  }, [subcategoryId, subcategories]);

  return (
    <form
      className="grid gap-3 rounded-md border border-red-100 bg-white p-3"
      onSubmit={(event) => {
        event.preventDefault();
        if (!categoryId || !subcategoryId || !description.trim()) return;
        createInspectionIssue({
          run_id: runId,
          checklist_item_id: item.id,
          title: item.title,
          description: description.trim(),
          category_id: categoryId,
          subcategory_id: subcategoryId,
          responsible_party_id: responsiblePartyId || undefined
        });
        onSaved();
      }}
    >
      <label className="grid gap-1 text-sm font-semibold text-slate-700">
        Lýsing athugasemdar
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          rows={3}
          className="rounded-md border border-slate-300 p-3 text-sm outline-none focus:border-blueprint focus:ring-2 focus:ring-blueprint/20"
          placeholder="Skrifaðu hvað þarf að laga áður en íbúð er afhent"
          required
        />
      </label>
      <div className="grid gap-3 md:grid-cols-3">
        <label className="grid gap-1 text-sm font-semibold text-slate-700">
          Flokkur
          <select
            value={categoryId}
            onChange={(event) => {
              const nextCategoryId = event.target.value;
              const nextSubcategoryId = data.subcategories
                .filter((subcategory) => subcategory.category_id === nextCategoryId && subcategory.is_active)
                .sort((a, b) => a.sort_order - b.sort_order)[0]?.id ?? "";
              setCategoryId(nextCategoryId);
              setSubcategoryId(nextSubcategoryId);
            }}
            className="touch-target rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-blueprint focus:ring-2 focus:ring-blueprint/20"
            required
          >
            {activeCategories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
          </select>
        </label>
        <label className="grid gap-1 text-sm font-semibold text-slate-700">
          Undirflokkur
          <select
            value={subcategoryId}
            onChange={(event) => setSubcategoryId(event.target.value)}
            className="touch-target rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-blueprint focus:ring-2 focus:ring-blueprint/20"
            required
          >
            {subcategories.map((subcategory) => <option key={subcategory.id} value={subcategory.id}>{subcategory.name}</option>)}
          </select>
        </label>
        <label className="grid gap-1 text-sm font-semibold text-slate-700">
          Úthlutun á
          <select
            value={responsiblePartyId}
            onChange={(event) => setResponsiblePartyId(event.target.value)}
            className="touch-target rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-blueprint focus:ring-2 focus:ring-blueprint/20"
          >
            <option value="">Óúthlutað</option>
            {data.responsible_parties.map((party) => <option key={party.id} value={party.id}>{party.name}</option>)}
          </select>
        </label>
      </div>
      <Button disabled={!categoryId || !subcategoryId || !description.trim()}><Save className="h-4 w-4" /> Stofna athugasemd</Button>
    </form>
  );
}

function InspectionSelect({
  label,
  value,
  onChange,
  options,
  placeholder,
  disabled
}: {
  label: string;
  value: string;
  onChange(value: string): void;
  options: Array<{ value: string; label: string }>;
  placeholder: string;
  disabled?: boolean;
}) {
  return (
    <label className="grid gap-1 text-sm font-semibold text-slate-700">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        className="touch-target rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-blueprint focus:ring-2 focus:ring-blueprint/20 disabled:bg-slate-100 disabled:text-slate-400"
      >
        <option value="">{placeholder}</option>
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </label>
  );
}

function Metric({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
      <p className={`text-2xl font-bold ${tone}`}>{value}</p>
      <p className="text-xs font-semibold text-slate-500">{label}</p>
    </div>
  );
}

function StatusPill({ status }: { status: InspectionRunItemStatus }) {
  const labels: Record<InspectionRunItemStatus, string> = {
    unchecked: "Óskoðað",
    ok: "Í lagi",
    issue: "Athugasemd",
    not_applicable: "Á ekki við"
  };
  const tones: Record<InspectionRunItemStatus, string> = {
    unchecked: "bg-amber-50 text-amber-800 ring-amber-200",
    ok: "bg-emerald-50 text-emerald-800 ring-emerald-200",
    issue: "bg-red-50 text-red-800 ring-red-200",
    not_applicable: "bg-slate-100 text-slate-700 ring-slate-200"
  };

  return <span className={cn("rounded-full px-2.5 py-1 text-xs font-bold ring-1", tones[status])}>{labels[status]}</span>;
}

function groupChecklistItems(items: InspectionChecklistItem[]) {
  const groups = new Map<string, InspectionChecklistItem[]>();
  items.forEach((item) => {
    const group = groups.get(item.section) ?? [];
    group.push(item);
    groups.set(item.section, group);
  });
  return Array.from(groups.entries());
}

function summarizeChecklist(total: number, runItems: Array<{ status: InspectionRunItemStatus }>) {
  const ok = runItems.filter((item) => item.status === "ok").length;
  const issue = runItems.filter((item) => item.status === "issue").length;
  const notApplicable = runItems.filter((item) => item.status === "not_applicable").length;
  const checked = ok + issue + notApplicable;

  return {
    ok,
    issue,
    notApplicable,
    unchecked: Math.max(0, total - checked),
    progress: percent(checked, total)
  };
}
