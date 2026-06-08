"use client";

import { AppShell, Breadcrumbs } from "@/components/app-shell";
import { ProjectForm } from "@/components/forms";
import { Card, PageHeader } from "@/components/ui";
import { useAppData } from "@/lib/data-provider";

export default function AdminProjectsPage() {
  const { data } = useAppData();
  return (
    <AppShell>
      <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Verkefni" }]} />
      <PageHeader title="Admin verkefni" />
      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <Card><div className="grid gap-2">{data.projects.map((project) => <div key={project.id} className="rounded-md bg-slate-50 p-3 font-semibold">{project.full_name}</div>)}</div></Card>
        <Card><ProjectForm /></Card>
      </div>
    </AppShell>
  );
}
