"use client";

import Link from "next/link";
import { use, useState } from "react";
import { FileImage, MapPinned, Plus, Upload } from "lucide-react";
import { AppShell, Breadcrumbs } from "@/components/app-shell";
import { LocationCard } from "@/components/entity-cards";
import { LocationForm } from "@/components/forms";
import { Button, Card, EmptyState, PageHeader } from "@/components/ui";
import { useAppData } from "@/lib/data-provider";
import { formatDate } from "@/lib/utils";
import type { AppData, Project } from "@/lib/types";

export default function ProjectPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = use(params);
  const { data } = useAppData();
  const project = data.projects.find((item) => item.id === projectId);
  if (!project) return <AppShell><EmptyState title="Verkefni fannst ekki" body="Athugaðu slóðina eða veldu verkefni úr yfirliti." /></AppShell>;
  const locations = data.locations.filter((item) => item.project_id === project.id);
  return (
    <AppShell>
      <Breadcrumbs items={[{ label: "Verkefni", href: "/projects" }, { label: project.full_name }]} />
      <PageHeader title={project.full_name} kicker="Götur / byggingarhlutar" />
      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <div className="grid gap-4 sm:grid-cols-2">
          {locations.map((location) => <LocationCard key={location.id} location={location} data={data} />)}
          {locations.length === 0 ? <EmptyState title="Engar götur" body="Bættu við fyrstu götu eða byggingarhluta fyrir verkefnið." /> : null}
        </div>
        <div className="grid gap-4">
          <Card>
            <h2 className="mb-4 flex items-center gap-2 font-bold"><Plus className="h-4 w-4" /> Bæta við götu</h2>
            <LocationForm projectId={project.id} />
          </Card>
          <FloorPlanPanel project={project} data={data} />
        </div>
      </div>
    </AppShell>
  );
}

function FloorPlanPanel({ project, data }: { project: Project; data: AppData }) {
  const { addFloorPlan } = useAppData();
  const [name, setName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const floorPlans = data.floor_plans
    .filter((plan) => plan.project_id === project.id)
    .sort((a, b) => a.name.localeCompare(b.name, "is", { sensitivity: "base", numeric: true }));

  return (
    <Card>
      <h2 className="mb-4 flex items-center gap-2 font-bold"><MapPinned className="h-4 w-4" /> Grunnmyndir</h2>
      <form
        className="grid gap-3"
        onSubmit={async (event) => {
          event.preventDefault();
          if (!file) return;
          setIsUploading(true);
          try {
            await addFloorPlan(project.id, name, file);
            setName("");
            setFile(null);
            event.currentTarget.reset();
          } finally {
            setIsUploading(false);
          }
        }}
      >
        <label className="grid gap-1 text-sm font-semibold text-slate-700">
          Heiti grunnmyndar
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="T.d. Kjallari, 1. hæð, 2. hæð"
            className="touch-target rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-blueprint focus:ring-2 focus:ring-blueprint/20"
          />
        </label>
        <label className="grid gap-1 text-sm font-semibold text-slate-700">
          Mynd / teikning
          <input
            type="file"
            accept="image/*"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            className="rounded-md border border-slate-300 bg-white p-2 text-sm"
            required
          />
        </label>
        <Button disabled={!file || isUploading}><Upload className="h-4 w-4" /> {isUploading ? "Hleð upp..." : "Hlaða upp grunnmynd"}</Button>
      </form>

      <div className="mt-5 grid gap-2">
        {floorPlans.map((plan) => (
          <Link key={plan.id} href={`/projects/${project.id}/floor-plans/${plan.id}`} className="flex items-center justify-between gap-3 rounded-md border border-slate-200 bg-slate-50 p-3 transition hover:border-slate-400 hover:bg-white">
            <span className="flex items-center gap-2 font-bold text-ink"><FileImage className="h-4 w-4 text-blueprint" /> {plan.name}</span>
            <span className="text-xs font-semibold text-slate-500">{formatDate(plan.created_at)}</span>
          </Link>
        ))}
        {floorPlans.length === 0 ? <p className="rounded-md bg-slate-50 p-3 text-sm text-slate-600">Engar grunnmyndir hafa verið skráðar fyrir verkefnið.</p> : null}
      </div>
    </Card>
  );
}
