"use client";

import Link from "next/link";
import { Building2, ClipboardList, MapPinned } from "lucide-react";
import { Card, ProgressBar } from "./ui";
import { summarizeTasks, tasksFor, cn } from "@/lib/utils";
import { unitTypeLabels } from "@/lib/labels";
import type { AppData, Category, Location, Project, Subcategory, Unit } from "@/lib/types";

export function ProjectCard({ project, data }: { project: Project; data: AppData }) {
  const locations = data.locations.filter((item) => item.project_id === project.id);
  const units = data.units.filter((item) => item.project_id === project.id);
  const summary = summarizeTasks(tasksFor(data, { project_id: project.id }));
  return (
    <Link href={`/projects/${project.id}`}>
      <Card className="h-full transition hover:-translate-y-0.5 hover:border-slate-400">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-blueprint">{project.project_number}</p>
            <h2 className="text-lg font-bold text-ink">{project.name}</h2>
          </div>
          <Building2 className="h-6 w-6 text-slate-400" />
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
          <Metric label="Götur" value={locations.length} />
          <Metric label="Rými" value={units.length} />
          <Metric label="Opin" value={summary.open} />
          <Metric label="Lokið" value={summary.done} />
          <Metric label="Framv." value={`${summary.progress}%`} />
        </div>
        <div className="mt-4"><ProgressBar value={summary.progress} /></div>
      </Card>
    </Link>
  );
}

export function LocationCard({ location, data }: { location: Location; data: AppData }) {
  const units = data.units.filter((item) => item.location_id === location.id);
  const summary = summarizeTasks(tasksFor(data, { location_id: location.id }));
  return (
    <Link href={`/projects/${location.project_id}/locations/${location.id}`}>
      <Card className="h-full transition hover:-translate-y-0.5 hover:border-slate-400">
        <MapPinned className="mb-3 h-6 w-6 text-blueprint" />
        <h2 className="font-bold text-ink">{location.name}</h2>
        <p className="mt-1 text-sm text-slate-500">{units.length} íbúðir / rými</p>
        <Stats summary={summary} />
      </Card>
    </Link>
  );
}

export function UnitCard({ unit, data }: { unit: Unit; data: AppData }) {
  const summary = summarizeTasks(tasksFor(data, { unit_id: unit.id }));
  return (
    <Link href={`/projects/${unit.project_id}/locations/${unit.location_id}/units/${unit.id}`}>
      <Card className="h-full transition hover:-translate-y-0.5 hover:border-slate-400">
        <h2 className="font-bold text-ink">{unit.name}</h2>
        <p className="mt-1 text-sm text-slate-500">{unitTypeLabels[unit.unit_type]}{unit.floor ? ` · ${unit.floor}` : ""}</p>
        <Stats summary={summary} />
      </Card>
    </Link>
  );
}

export function CategoryCard({ category, unit, data }: { category: Category; unit: Unit; data: AppData }) {
  const summary = summarizeTasks(tasksFor(data, { unit_id: unit.id, category_id: category.id }));
  return (
    <Link href={`/projects/${unit.project_id}/locations/${unit.location_id}/units/${unit.id}/categories/${category.id}`}>
      <Card className="h-full transition hover:-translate-y-0.5 hover:border-slate-400">
        <ClipboardList className="mb-3 h-6 w-6 text-slate-500" />
        <h2 className="font-bold text-ink">{category.name}</h2>
        <Stats summary={summary} />
      </Card>
    </Link>
  );
}

export function SubcategoryCard({ subcategory, unit, data }: { subcategory: Subcategory; unit: Unit; data: AppData }) {
  const summary = summarizeTasks(tasksFor(data, { unit_id: unit.id, subcategory_id: subcategory.id }));
  return (
    <Link href={`/projects/${unit.project_id}/locations/${unit.location_id}/units/${unit.id}/categories/${subcategory.category_id}/subcategories/${subcategory.id}`}>
      <Card className="h-full transition hover:-translate-y-0.5 hover:border-slate-400">
        <h2 className="font-bold text-ink">{subcategory.name}</h2>
        <Stats summary={summary} />
      </Card>
    </Link>
  );
}

function Metric({ label, value, tone }: { label: string; value: string | number; tone?: string }) {
  return (
    <div className="rounded-md bg-slate-50 p-2">
      <p className={cn("text-base font-bold text-ink", tone)}>{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  );
}

function Stats({ summary }: { summary: ReturnType<typeof summarizeTasks> }) {
  return (
    <>
      <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
        <Metric label="Opin" value={summary.open} />
        <Metric label="Vinnslu" value={summary.in_progress} />
        <Metric label="Lokið" value={summary.done} />
      </div>
      <div className="mt-4 flex items-center gap-3">
        <div className="flex-1"><ProgressBar value={summary.progress} /></div>
        <span className="text-sm font-bold text-ink">{summary.progress}%</span>
      </div>
    </>
  );
}
