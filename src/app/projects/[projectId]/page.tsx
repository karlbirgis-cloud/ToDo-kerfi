"use client";

import { use } from "react";
import { Plus } from "lucide-react";
import { AppShell, Breadcrumbs } from "@/components/app-shell";
import { LocationCard } from "@/components/entity-cards";
import { LocationForm } from "@/components/forms";
import { Card, EmptyState, PageHeader } from "@/components/ui";
import { useAppData } from "@/lib/data-provider";

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
        <Card>
          <h2 className="mb-4 flex items-center gap-2 font-bold"><Plus className="h-4 w-4" /> Bæta við götu</h2>
          <LocationForm projectId={project.id} />
        </Card>
      </div>
    </AppShell>
  );
}
