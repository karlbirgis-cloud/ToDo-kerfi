"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Camera, Plus, Save, Trash2, X, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "./ui";
import { priorityLabels, statusLabels, unitTypeLabels } from "@/lib/labels";
import { useAppData } from "@/lib/data-provider";
import type { FloorPlan, TaskPriority, TaskStatus, UnitType } from "@/lib/types";
import { cn } from "@/lib/utils";

export function ProjectForm() {
  const router = useRouter();
  const { createProject } = useAppData();
  return (
    <form className="grid gap-3" onSubmit={(event) => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      const id = createProject({ project_number: String(form.get("project_number")), name: String(form.get("name")) });
      router.push(`/projects/${id}`);
    }}>
      <Field name="project_number" label="Verkefnanúmer" placeholder="010" required />
      <Field name="name" label="Heiti verkefnis" placeholder="Gjúkabryggja" required />
      <Button><Save className="h-4 w-4" /> Stofna verkefni</Button>
    </form>
  );
}

export function LocationForm({ projectId }: { projectId: string }) {
  const router = useRouter();
  const { createLocation } = useAppData();
  return (
    <form className="grid gap-3" onSubmit={(event) => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      const id = createLocation({ project_id: projectId, name: String(form.get("name")), description: String(form.get("description") ?? "") });
      router.push(`/projects/${projectId}/locations/${id}`);
    }}>
      <Field name="name" label="Gata / byggingarhluti" placeholder="Buðlabryggja 25-27" required />
      <Field name="description" label="Lýsing" placeholder="A-hluti eða áfangi" />
      <Button><Plus className="h-4 w-4" /> Bæta við götu</Button>
    </form>
  );
}

export function UnitForm({ projectId, locationId }: { projectId: string; locationId: string }) {
  const router = useRouter();
  const { createUnit } = useAppData();
  return (
    <form className="grid gap-3" onSubmit={(event) => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      const id = createUnit({ project_id: projectId, location_id: locationId, name: String(form.get("name")), unit_type: form.get("unit_type") as UnitType, floor: String(form.get("floor") ?? "") });
      router.push(`/projects/${projectId}/locations/${locationId}/units/${id}`);
    }}>
      <Field name="name" label="Íbúð / rými" placeholder="Íbúð 0203" required />
      <Select name="unit_type" label="Tegund" options={unitTypeLabels} />
      <Field name="floor" label="Hæð" placeholder="2. hæð" />
      <Button><Plus className="h-4 w-4" /> Stofna íbúð / rými</Button>
    </form>
  );
}

export function BulkUnitForm({ projectId, locationId }: { projectId: string; locationId: string }) {
  const { createUnitsBulk } = useAppData();
  const [message, setMessage] = useState("");
  return (
    <form className="grid gap-3" onSubmit={(event) => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      const names = String(form.get("names")).split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
      createUnitsBulk({ project_id: projectId, location_id: locationId, names, name: "", unit_type: form.get("unit_type") as UnitType, floor: String(form.get("floor") ?? "") });
      setMessage(`${names.length} rými stofnuð og default flokkar tengdir.`);
      event.currentTarget.reset();
    }}>
      <label className="grid gap-1 text-sm font-semibold text-slate-700">
        Listi yfir íbúðir / rými
        <textarea name="names" rows={7} className="rounded-md border border-slate-300 p-3 font-mono text-sm outline-none focus:border-blueprint focus:ring-2 focus:ring-blueprint/20" placeholder={"Íbúð 0101\nÍbúð 0102\nSameign\nTæknirými"} required />
      </label>
      <Select name="unit_type" label="Tegund fyrir listann" options={unitTypeLabels} />
      <Field name="floor" label="Hæð" placeholder="Valfrjálst" />
      <Button><Plus className="h-4 w-4" /> Stofna íbúðir / rými</Button>
      {message ? <p className="text-sm font-semibold text-emerald-700">{message}</p> : null}
    </form>
  );
}

export function TaskForm({ projectId, locationId, unitId, categoryId, subcategoryId }: { projectId: string; locationId: string; unitId: string; categoryId: string; subcategoryId: string }) {
  const router = useRouter();
  const { data, createTask, flushPendingCloudSave } = useAppData();
  const [errorMessage, setErrorMessage] = useState("");
  return (
    <form className="grid gap-3" onSubmit={async (event) => {
      event.preventDefault();
      const form = new FormData(event.currentTarget);
      const id = createTask({
        project_id: projectId,
        location_id: locationId,
        unit_id: unitId,
        category_id: categoryId,
        subcategory_id: subcategoryId,
        title: String(form.get("title")),
        description: String(form.get("description") ?? ""),
        responsible_party_id: String(form.get("responsible_party_id") ?? ""),
        priority: form.get("priority") as TaskPriority,
        due_date: String(form.get("due_date") ?? "")
      });
      try {
        await flushPendingCloudSave();
        router.push(`/tasks/${id}`);
      } catch (error) {
        console.error(error);
        setErrorMessage("Ekki tókst að vista atriðið í skýið. Athugaðu sambandið og reyndu aftur.");
      }
    }}>
      <Field name="title" label="Titill" placeholder="Lagfæra skemmd á vegg" required />
      <label className="grid gap-1 text-sm font-semibold text-slate-700">
        Lýsing
        <textarea name="description" rows={4} className="rounded-md border border-slate-300 p-3 text-sm outline-none focus:border-blueprint focus:ring-2 focus:ring-blueprint/20" />
      </label>
      <Select name="responsible_party_id" label="Úthluta á" options={{ "": "Óúthlutað", ...Object.fromEntries(data.responsible_parties.map((party) => [party.id, party.name])) }} />
      <Select name="priority" label="Forgangur" options={priorityLabels} />
      <Field name="due_date" type="date" label="Skiladagur" />
      <label className="grid gap-1 text-sm font-semibold text-slate-700">
        Myndir
        <span className="touch-target flex items-center gap-2 rounded-md border border-dashed border-slate-300 bg-slate-50 px-3 text-sm text-slate-500"><Camera className="h-4 w-4" /> Myndaupphleðsla vistast á atriðasíðu</span>
      </label>
      <Button><Save className="h-4 w-4" /> Stofna atriði</Button>
      {errorMessage ? <p className="rounded-md bg-red-50 p-3 text-sm font-semibold text-red-800">{errorMessage}</p> : null}
    </form>
  );
}

export function UnitTaskForm({ projectId, locationId, unitId }: { projectId: string; locationId: string; unitId: string }) {
  const router = useRouter();
  const { data, createTask, createTaskPlanMarker, addTaskImages, flushPendingCloudSave } = useAppData();
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [selectedFloorPlanId, setSelectedFloorPlanId] = useState("");
  const [planMarker, setPlanMarker] = useState<{ x: number; y: number } | null>(null);
  const [planZoom, setPlanZoom] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const projectFloorPlans = data.floor_plans
    .filter((plan) => plan.project_id === projectId)
    .sort((a, b) => a.name.localeCompare(b.name, "is", { sensitivity: "base", numeric: true }));
  const selectedFloorPlan = projectFloorPlans.find((plan) => plan.id === selectedFloorPlanId);
  const selectedFloorPlanIsPdf = selectedFloorPlan ? isPdfFloorPlan(selectedFloorPlan) : false;
  const unitCategories = data.unit_categories
    .filter((item) => item.unit_id === unitId)
    .map((item) => data.categories.find((category) => category.id === item.category_id))
    .filter((category): category is NonNullable<typeof category> => Boolean(category))
    .sort((a, b) => a.sort_order - b.sort_order);
  const [categoryId, setCategoryId] = useState(unitCategories[0]?.id ?? "");
  const unitSubcategories = data.unit_subcategories
    .filter((item) => item.unit_id === unitId && item.category_id === categoryId)
    .map((item) => data.subcategories.find((subcategory) => subcategory.id === item.subcategory_id))
    .filter((subcategory): subcategory is NonNullable<typeof subcategory> => Boolean(subcategory))
    .sort((a, b) => a.sort_order - b.sort_order);

  return (
    <form
      id="new-task"
      className="grid gap-3"
      onSubmit={async (event) => {
        event.preventDefault();
        setIsSubmitting(true);
        const form = new FormData(event.currentTarget);
        const selectedSubcategoryId = String(form.get("subcategory_id") ?? "");
        if (!categoryId || !selectedSubcategoryId) {
          setIsSubmitting(false);
          return;
        }

        try {
          setErrorMessage("");
          const id = createTask({
            project_id: projectId,
            location_id: locationId,
            unit_id: unitId,
            category_id: categoryId,
            subcategory_id: selectedSubcategoryId,
            title: String(form.get("title")),
            description: String(form.get("description") ?? ""),
            responsible_party_id: String(form.get("responsible_party_id") ?? ""),
            priority: "medium"
          });
          if (selectedFloorPlan && planMarker) {
            createTaskPlanMarker({
              task_id: id,
              floor_plan_id: selectedFloorPlan.id,
              x_percent: planMarker.x,
              y_percent: planMarker.y
            });
          }
          if (imageFiles.length > 0) await addTaskImages(id, imageFiles);
          await flushPendingCloudSave();
          router.push(`/tasks/${id}`);
        } catch (error) {
          console.error(error);
          setErrorMessage("Ekki tókst að vista atriðið eða myndirnar. Athugaðu sambandið og reyndu aftur.");
        } finally {
          setIsSubmitting(false);
        }
      }}
    >
      <Field name="title" label="Titill" placeholder="T.d. laga rispu á hurð" required />
      <label className="grid gap-1 text-sm font-semibold text-slate-700">
        Lýsing
        <textarea name="description" rows={4} className="rounded-md border border-slate-300 p-3 text-sm outline-none focus:border-blueprint focus:ring-2 focus:ring-blueprint/20" placeholder="Stutt lýsing á því sem þarf að klára" />
      </label>
      <label className="grid gap-1 text-sm font-semibold text-slate-700">
        Flokkur
        <select
          name="category_id"
          value={categoryId}
          onChange={(event) => setCategoryId(event.target.value)}
          className="touch-target rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-blueprint focus:ring-2 focus:ring-blueprint/20"
          required
        >
          {unitCategories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
        </select>
      </label>
      <Select name="subcategory_id" label="Undirflokkur" options={Object.fromEntries(unitSubcategories.map((subcategory) => [subcategory.id, subcategory.name]))} required />
      <Select name="responsible_party_id" label="Úthlutun á" options={{ "": "Óúthlutað", ...Object.fromEntries(data.responsible_parties.map((party) => [party.id, party.name])) }} />
      {projectFloorPlans.length > 0 ? (
        <div className="grid gap-3 rounded-md border border-slate-200 bg-slate-50 p-3">
          <div className="flex flex-wrap items-end gap-3">
            <label className="grid min-w-64 flex-1 gap-1 text-sm font-semibold text-slate-700">
              Staðsetning á grunnmynd
              <select
                value={selectedFloorPlanId}
                onChange={(event) => {
                  setSelectedFloorPlanId(event.target.value);
                  setPlanMarker(null);
                }}
                className="touch-target rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-blueprint focus:ring-2 focus:ring-blueprint/20"
              >
                <option value="">Engin grunnmynd valin</option>
                {projectFloorPlans.map((plan) => <option key={plan.id} value={plan.id}>{plan.name}</option>)}
              </select>
            </label>
            <div className="flex flex-wrap items-center gap-2">
              <Button type="button" className="bg-slate-700 hover:bg-slate-800" disabled={!selectedFloorPlan} onClick={() => setPlanZoom((current) => Math.max(0.5, current - 0.25))}>
                <ZoomOut className="h-4 w-4" /> Minnka
              </Button>
              <span className="flex h-11 min-w-16 items-center justify-center rounded-md border border-slate-200 bg-white text-sm font-bold text-ink">{Math.round(planZoom * 100)}%</span>
              <Button type="button" className="bg-slate-700 hover:bg-slate-800" disabled={!selectedFloorPlan} onClick={() => setPlanZoom((current) => Math.min(3, current + 0.25))}>
                <ZoomIn className="h-4 w-4" /> Stækka
              </Button>
              {planMarker ? (
                <Button type="button" className="bg-slate-600 hover:bg-slate-700" onClick={() => setPlanMarker(null)}>
                  <X className="h-4 w-4" /> Hreinsa
                </Button>
              ) : null}
            </div>
          </div>

          {selectedFloorPlan ? (
            <>
              <p className={cn("rounded-md p-3 text-sm font-semibold", planMarker ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-900")}>
                {planMarker ? `Punktur valinn: ${planMarker.x.toFixed(1)}% / ${planMarker.y.toFixed(1)}%` : "Smelltu á grunnmyndina til að merkja staðsetningu."}
              </p>
              <div className="h-[420px] overflow-auto rounded-md border border-slate-200 bg-slate-100 p-3">
                <div
                  className={cn("relative mx-auto cursor-crosshair", selectedFloorPlanIsPdf ? "min-h-[420px]" : "")}
                  style={{ width: `${planZoom * 100}%`, height: selectedFloorPlanIsPdf ? `${Math.max(420, 420 * planZoom)}px` : undefined }}
                  onClick={(event) => {
                    const rect = event.currentTarget.getBoundingClientRect();
                    const x = ((event.clientX - rect.left) / rect.width) * 100;
                    const y = ((event.clientY - rect.top) / rect.height) * 100;
                    setPlanMarker({ x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) });
                  }}
                >
                  {selectedFloorPlanIsPdf ? (
                    <iframe
                      src={`${selectedFloorPlan.image_url}#toolbar=0&navpanes=0&view=FitH`}
                      title={selectedFloorPlan.name}
                      className="pointer-events-none h-full w-full rounded-sm border-0 bg-white"
                    />
                  ) : (
                    <img src={selectedFloorPlan.image_url} alt={selectedFloorPlan.name} className="block w-full max-w-none object-contain" />
                  )}
                  {planMarker ? (
                    <span
                      className="absolute z-20 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-red-600 shadow-lg ring-4 ring-red-200"
                      style={{ left: `${planMarker.x}%`, top: `${planMarker.y}%` }}
                    />
                  ) : null}
                </div>
              </div>
            </>
          ) : null}
        </div>
      ) : null}
      <label className="grid gap-2 text-sm font-semibold text-slate-700">
        Myndir
        <span className="touch-target flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-slate-300 bg-slate-50 px-3 text-sm font-bold text-slate-700 transition hover:border-blueprint hover:bg-blue-50">
          <Camera className="h-4 w-4" /> Bæta við mynd
          <input
            className="sr-only"
            type="file"
            accept="image/*"
            capture="environment"
            multiple
            onChange={(event) => {
              const files = Array.from(event.target.files ?? []);
              setImageFiles(files);
              setImagePreviews((current) => {
                current.forEach((preview) => URL.revokeObjectURL(preview));
                return files.map((file) => URL.createObjectURL(file));
              });
            }}
          />
        </span>
      </label>
      {imagePreviews.length > 0 ? (
        <div className="grid grid-cols-3 gap-2">
          {imagePreviews.map((preview, index) => (
            <img key={preview} src={preview} alt={`Mynd ${index + 1}`} className="aspect-square rounded-md border border-slate-200 bg-slate-100 object-contain" />
          ))}
        </div>
      ) : null}
      <Button disabled={!categoryId || unitSubcategories.length === 0 || isSubmitting}><Save className="h-4 w-4" /> {isSubmitting ? "Vista..." : "Stofna atriði"}</Button>
      {errorMessage ? <p className="rounded-md bg-red-50 p-3 text-sm font-semibold text-red-800">{errorMessage}</p> : null}
    </form>
  );
}

export function TaskEditControls({ taskId, currentStatus }: { taskId: string; currentStatus: TaskStatus }) {
  const { updateTaskStatus, deleteTask } = useAppData();
  const router = useRouter();

  function handleDelete() {
    const confirmed = window.confirm("Ertu viss um að þú viljir eyða þessu atriði? Þessi aðgerð verður ekki afturkölluð.");
    if (!confirmed) return;

    deleteTask(taskId);
    router.push("/projects");
  }

  return (
    <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
      <Select value={currentStatus} onChange={(event) => updateTaskStatus(taskId, event.target.value as TaskStatus)} name="status" label="Staða" options={statusLabels} />
      <Button className="bg-red-700 hover:bg-red-800" onClick={handleDelete}><Trash2 className="h-4 w-4" /> Eyða</Button>
    </div>
  );
}

function Field(props: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  const { label, className, ...rest } = props;
  return (
    <label className="grid gap-1 text-sm font-semibold text-slate-700">
      {label}
      <input className={`touch-target rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-blueprint focus:ring-2 focus:ring-blueprint/20 ${className ?? ""}`} {...rest} />
    </label>
  );
}

function Select({ label, options, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { label: string; options: Record<string, string> }) {
  return (
    <label className="grid gap-1 text-sm font-semibold text-slate-700">
      {label}
      <select className="touch-target rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-blueprint focus:ring-2 focus:ring-blueprint/20" {...props}>
        {Object.entries(options).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
      </select>
    </label>
  );
}

function isPdfFloorPlan(plan: FloorPlan) {
  return plan.mime_type === "application/pdf" || plan.storage_path.toLowerCase().endsWith(".pdf") || plan.image_url.toLowerCase().includes(".pdf");
}
