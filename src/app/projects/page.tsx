"use client";

import { Plus } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { ProjectCard } from "@/components/entity-cards";
import { LinkButton, PageHeader } from "@/components/ui";
import { useAppData } from "@/lib/data-provider";

export default function ProjectsPage() {
  const { data } = useAppData();
  return (
    <AppShell>
      <PageHeader title="Verkefni" kicker="Verkefnayfirlit" actions={<LinkButton href="/projects/new"><Plus className="h-4 w-4" /> Nýtt verkefni</LinkButton>} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data.projects.map((project) => <ProjectCard key={project.id} project={project} data={data} />)}
      </div>
    </AppShell>
  );
}
