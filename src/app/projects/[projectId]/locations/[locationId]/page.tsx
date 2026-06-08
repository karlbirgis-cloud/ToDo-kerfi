"use client";

import { use } from "react";
import { Plus } from "lucide-react";
import { AppShell, Breadcrumbs } from "@/components/app-shell";
import { UnitCard } from "@/components/entity-cards";
import { BulkUnitForm, UnitForm } from "@/components/forms";
import { Card, EmptyState, PageHeader } from "@/components/ui";
import { useAppData } from "@/lib/data-provider";

export default function LocationPage({ params }: { params: Promise<{ projectId: string; locationId: string }> }) {
  const { projectId, locationId } = use(params);
  const { data } = useAppData();
  const project = data.projects.find((item) => item.id === projectId);
  const location = data.locations.find((item) => item.id === locationId);
  const units = data.units.filter((item) => item.location_id === locationId);
  if (!project || !location) return <AppShell><EmptyState title="Staðsetning fannst ekki" body="Veldu götu úr verkefnissíðu." /></AppShell>;
  return (
    <AppShell>
      <Breadcrumbs items={[{ label: "Verkefni", href: "/projects" }, { label: project.full_name, href: `/projects/${project.id}` }, { label: location.name }]} />
      <PageHeader title={location.name} kicker="Íbúðir / rými" />
      <div className="grid gap-4 xl:grid-cols-[1fr_390px]">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {units.map((unit) => <UnitCard key={unit.id} unit={unit} data={data} />)}
          {units.length === 0 ? <EmptyState title="Engin rými" body="Stofnaðu íbúð, sameign eða tæknirými. Flokkar stofnast sjálfkrafa." /> : null}
        </div>
        <div className="grid gap-4">
          <Card>
            <h2 className="mb-4 flex items-center gap-2 font-bold"><Plus className="h-4 w-4" /> Bæta við íbúð / rými</h2>
            <UnitForm projectId={project.id} locationId={location.id} />
          </Card>
          <Card>
            <h2 className="mb-4 font-bold">Bulk stofnun íbúða / rýma</h2>
            <BulkUnitForm projectId={project.id} locationId={location.id} />
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
