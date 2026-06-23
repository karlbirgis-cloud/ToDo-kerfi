"use client";

import Link from "next/link";
import { use, useMemo, useState } from "react";
import { MapPin, Plus, RotateCcw, Save, ZoomIn, ZoomOut } from "lucide-react";
import { AppShell, Breadcrumbs } from "@/components/app-shell";
import { Button, Card, EmptyState, PageHeader, StatusBadge } from "@/components/ui";
import { priorityLabels } from "@/lib/labels";
import { useAppData } from "@/lib/data-provider";
import type { AppData, Category, FloorPlan, Subcategory, TaskPriority } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function FloorPlanPage({ params }: { params: Promise<{ projectId: string; floorPlanId: string }> }) {
  const { projectId, floorPlanId } = use(params);
  const { data, createTask, createTaskPlanMarker } = useAppData();
  const project = data.projects.find((item) => item.id === projectId);
  const floorPlan = data.floor_plans.find((item) => item.id === floorPlanId && item.project_id === projectId);
  const projectLocations = data.locations.filter((location) => location.project_id === projectId).sort((a, b) => a.name.localeCompare(b.name, "is", { numeric: true }));
  const [selectedLocationId, setSelectedLocationId] = useState("");
  const effectiveLocationId = selectedLocationId || projectLocations[0]?.id || "";
  const projectUnits = data.units.filter((unit) => unit.location_id === effectiveLocationId).sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name, "is", { numeric: true }));
  const [selectedUnitId, setSelectedUnitId] = useState("");
  const effectiveUnitId = selectedUnitId && projectUnits.some((unit) => unit.id === selectedUnitId) ? selectedUnitId : projectUnits[0]?.id || "";
  const categories = useMemo(() => getCategoriesForUnit(data, effectiveUnitId), [data, effectiveUnitId]);
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const effectiveCategoryId = selectedCategoryId && categories.some((category) => category.id === selectedCategoryId) ? selectedCategoryId : categories[0]?.id || "";
  const subcategories = useMemo(() => getSubcategoriesForUnit(data, effectiveUnitId, effectiveCategoryId), [data, effectiveCategoryId, effectiveUnitId]);
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState("");
  const effectiveSubcategoryId = selectedSubcategoryId && subcategories.some((subcategory) => subcategory.id === selectedSubcategoryId) ? selectedSubcategoryId : subcategories[0]?.id || "";
  const [marker, setMarker] = useState<{ x: number; y: number } | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [responsiblePartyId, setResponsiblePartyId] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("medium");
  const [zoom, setZoom] = useState(1);
  const existingMarkers = data.task_plan_markers.filter((item) => item.floor_plan_id === floorPlanId);
  const isPdf = floorPlan ? isPdfFloorPlan(floorPlan) : false;

  if (!project || !floorPlan) {
    return (
      <AppShell>
        <EmptyState title="Grunnmynd fannst ekki" body="Veldu grunnmynd af verkefnissíðunni." />
      </AppShell>
    );
  }

  const canCreate = Boolean(marker && effectiveLocationId && effectiveUnitId && effectiveCategoryId && effectiveSubcategoryId && title.trim());
  const zoomLabel = `${Math.round(zoom * 100)}%`;

  return (
    <AppShell>
      <Breadcrumbs items={[{ label: "Verkefni", href: "/projects" }, { label: project.full_name, href: `/projects/${project.id}` }, { label: floorPlan.name }]} />
      <PageHeader title={floorPlan.name} kicker="Grunnmynd" />

      <div className="grid gap-4">
        <Card>
          <h2 className="mb-4 flex items-center gap-2 font-bold text-ink"><Plus className="h-4 w-4" /> Stofna atriði á punkti</h2>
          <form
            className="grid gap-3 lg:grid-cols-4"
            onSubmit={(event) => {
              event.preventDefault();
              if (!canCreate || !marker) return;
              const taskId = createTask({
                project_id: project.id,
                location_id: effectiveLocationId,
                unit_id: effectiveUnitId,
                category_id: effectiveCategoryId,
                subcategory_id: effectiveSubcategoryId,
                title: title.trim(),
                description: description.trim(),
                responsible_party_id: responsiblePartyId || undefined,
                priority
              });
              createTaskPlanMarker({ task_id: taskId, floor_plan_id: floorPlan.id, x_percent: marker.x, y_percent: marker.y });
              setMarker(null);
              setTitle("");
              setDescription("");
            }}
          >
            <p className={cn("rounded-md p-3 text-sm font-semibold lg:col-span-4", marker ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-900")}>
              {marker ? `Punktur valinn: ${marker.x.toFixed(1)}% / ${marker.y.toFixed(1)}%` : "Veldu punkt á grunnmyndinni fyrst."}
            </p>
            <SelectField label="Gata" value={effectiveLocationId} onChange={(value) => { setSelectedLocationId(value); setSelectedUnitId(""); setSelectedCategoryId(""); setSelectedSubcategoryId(""); }} options={projectLocations.map((location) => ({ value: location.id, label: location.name }))} />
            <SelectField label="Íbúð / rými" value={effectiveUnitId} onChange={(value) => { setSelectedUnitId(value); setSelectedCategoryId(""); setSelectedSubcategoryId(""); }} options={projectUnits.map((unit) => ({ value: unit.id, label: unit.name }))} />
            <SelectField label="Flokkur" value={effectiveCategoryId} onChange={(value) => { setSelectedCategoryId(value); setSelectedSubcategoryId(""); }} options={categories.map((category) => ({ value: category.id, label: category.name }))} />
            <SelectField label="Undirflokkur" value={effectiveSubcategoryId} onChange={setSelectedSubcategoryId} options={subcategories.map((subcategory) => ({ value: subcategory.id, label: subcategory.name }))} />
            <label className="grid gap-1 text-sm font-semibold text-slate-700">
              Titill
              <input value={title} onChange={(event) => setTitle(event.target.value)} className="touch-target rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-blueprint focus:ring-2 focus:ring-blueprint/20" required />
            </label>
            <label className="grid gap-1 text-sm font-semibold text-slate-700 lg:col-span-2">
              Lýsing
              <textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={3} className="rounded-md border border-slate-300 p-3 text-sm outline-none focus:border-blueprint focus:ring-2 focus:ring-blueprint/20" />
            </label>
            <SelectField label="Úthlutun á" value={responsiblePartyId} onChange={setResponsiblePartyId} options={[{ value: "", label: "Óúthlutað" }, ...data.responsible_parties.map((party) => ({ value: party.id, label: party.name }))]} required={false} />
            <SelectField label="Forgangur" value={priority} onChange={(value) => setPriority(value as TaskPriority)} options={Object.entries(priorityLabels).map(([value, label]) => ({ value, label }))} />
            <div className="flex items-end lg:col-span-2">
              <Button className="w-full" disabled={!canCreate}><Save className="h-4 w-4" /> Stofna atriði</Button>
            </div>
          </form>

          <div className="mt-5 grid gap-2">
            <h3 className="font-bold text-ink">Punktar á grunnmynd</h3>
            <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
              {existingMarkers.map((item) => {
                const task = data.tasks.find((taskItem) => taskItem.id === item.task_id);
                if (!task) return null;
                return (
                  <Link key={item.id} href={`/tasks/${task.id}`} className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm transition hover:border-slate-400 hover:bg-white">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <span className="font-bold text-ink">{task.title}</span>
                      <StatusBadge status={task.status} />
                    </div>
                    <span className="text-slate-600">{item.x_percent.toFixed(1)}% / {item.y_percent.toFixed(1)}%</span>
                  </Link>
                );
              })}
            </div>
            {existingMarkers.length === 0 ? <p className="rounded-md bg-slate-50 p-3 text-sm text-slate-600">Engir punktar eru komnir á þessa grunnmynd.</p> : null}
          </div>
        </Card>

        <Card className="p-0">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-4">
            <div>
              <h2 className="flex items-center gap-2 font-bold text-ink"><MapPin className="h-4 w-4" /> Smelltu á grunnmyndina til að setja punkt</h2>
              <p className="mt-1 text-sm text-slate-600">Notaðu zoom til að staðsetja punktinn nákvæmlega.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" className="bg-slate-700 hover:bg-slate-800" onClick={() => setZoom((current) => Math.max(0.5, current - 0.25))}>
                <ZoomOut className="h-4 w-4" /> Minnka
              </Button>
              <span className="min-w-16 text-center text-sm font-bold text-ink">{zoomLabel}</span>
              <Button type="button" className="bg-slate-700 hover:bg-slate-800" onClick={() => setZoom((current) => Math.min(3, current + 0.25))}>
                <ZoomIn className="h-4 w-4" /> Stækka
              </Button>
              <Button type="button" className="bg-slate-600 hover:bg-slate-700" onClick={() => setZoom(1)}>
                <RotateCcw className="h-4 w-4" /> 100%
              </Button>
            </div>
          </div>
          <div className="h-[calc(100vh-220px)] min-h-[620px] overflow-auto bg-slate-100 p-3">
            <div
              className={cn("relative mx-auto cursor-crosshair", isPdf ? "min-h-[720px]" : "")}
              style={{ width: `${zoom * 100}%`, height: isPdf ? `${Math.max(86, 86 * zoom)}vh` : undefined }}
              onClick={(event) => {
                const rect = event.currentTarget.getBoundingClientRect();
                const x = ((event.clientX - rect.left) / rect.width) * 100;
                const y = ((event.clientY - rect.top) / rect.height) * 100;
                setMarker({ x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) });
              }}
            >
              {isPdf ? (
                <iframe
                  src={`${floorPlan.image_url}#toolbar=0&navpanes=0&view=FitH`}
                  title={floorPlan.name}
                  className="pointer-events-none h-full w-full rounded-sm border-0 bg-white"
                />
              ) : (
                <img src={floorPlan.image_url} alt={floorPlan.name} className="block w-full max-w-none object-contain" />
              )}
              {existingMarkers.map((item) => {
                const task = data.tasks.find((taskItem) => taskItem.id === item.task_id);
                if (!task) return null;
                return (
                  <Link
                    key={item.id}
                    href={`/tasks/${task.id}`}
                    className={cn("absolute z-10 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-lg", getMarkerTone(task.status))}
                    style={{ left: `${item.x_percent}%`, top: `${item.y_percent}%` }}
                    title={task.title}
                    onClick={(event) => event.stopPropagation()}
                  />
                );
              })}
              {marker ? (
                <span
                  className="absolute z-20 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-red-600 shadow-lg ring-4 ring-red-200"
                  style={{ left: `${marker.x}%`, top: `${marker.y}%` }}
                />
              ) : null}
            </div>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}

function SelectField({ label, value, onChange, options, required = true }: { label: string; value: string; onChange: (value: string) => void; options: Array<{ value: string; label: string }>; required?: boolean }) {
  return (
    <label className="grid gap-1 text-sm font-semibold text-slate-700">
      {label}
      <select value={value} onChange={(event) => onChange(event.target.value)} className="touch-target rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-blueprint focus:ring-2 focus:ring-blueprint/20" required={required}>
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </label>
  );
}

function getCategoriesForUnit(data: AppData, unitId: string): Category[] {
  const linked = data.unit_categories
    .filter((item) => item.unit_id === unitId)
    .map((item) => data.categories.find((category) => category.id === item.category_id))
    .filter((category): category is Category => Boolean(category))
    .sort((a, b) => a.sort_order - b.sort_order);

  return linked.length > 0 ? linked : data.categories.filter((category) => category.is_active).sort((a, b) => a.sort_order - b.sort_order);
}

function getSubcategoriesForUnit(data: AppData, unitId: string, categoryId: string): Subcategory[] {
  const linked = data.unit_subcategories
    .filter((item) => item.unit_id === unitId && item.category_id === categoryId)
    .map((item) => data.subcategories.find((subcategory) => subcategory.id === item.subcategory_id))
    .filter((subcategory): subcategory is Subcategory => Boolean(subcategory))
    .sort((a, b) => a.sort_order - b.sort_order);

  return linked.length > 0 ? linked : data.subcategories.filter((subcategory) => subcategory.category_id === categoryId && subcategory.is_active).sort((a, b) => a.sort_order - b.sort_order);
}

function getMarkerTone(status: string) {
  if (status === "done") return "bg-emerald-500";
  if (status === "in_progress") return "bg-amber-500";
  return "bg-blue-500";
}

function isPdfFloorPlan(plan: FloorPlan) {
  return plan.mime_type === "application/pdf" || plan.storage_path.toLowerCase().endsWith(".pdf") || plan.image_url.toLowerCase().includes(".pdf");
}
