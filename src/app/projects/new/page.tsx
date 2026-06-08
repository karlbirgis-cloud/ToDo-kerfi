"use client";

import { AppShell, Breadcrumbs } from "@/components/app-shell";
import { ProjectForm } from "@/components/forms";
import { Card, PageHeader } from "@/components/ui";

export default function NewProjectPage() {
  return (
    <AppShell>
      <Breadcrumbs items={[{ label: "Verkefni", href: "/projects" }, { label: "Nýtt verkefni" }]} />
      <PageHeader title="Nýtt verkefni" kicker="Stofnun" />
      <Card className="max-w-2xl"><ProjectForm /></Card>
    </AppShell>
  );
}
