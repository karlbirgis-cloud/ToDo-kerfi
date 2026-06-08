"use client";

import { use } from "react";
import { AppShell, Breadcrumbs } from "@/components/app-shell";
import { SubcategoryCard } from "@/components/entity-cards";
import { EmptyState, PageHeader } from "@/components/ui";
import { useAppData } from "@/lib/data-provider";

export default function CategoryPage({ params }: { params: Promise<{ projectId: string; locationId: string; unitId: string; categoryId: string }> }) {
  const { projectId, locationId, unitId, categoryId } = use(params);
  const { data } = useAppData();
  const project = data.projects.find((item) => item.id === projectId);
  const location = data.locations.find((item) => item.id === locationId);
  const unit = data.units.find((item) => item.id === unitId);
  const category = data.categories.find((item) => item.id === categoryId);
  if (!project || !location || !unit || !category) return <AppShell><EmptyState title="Flokkur fannst ekki" body="Veldu flokk úr rýmissíðu." /></AppShell>;
  const subcategories = data.unit_subcategories
    .filter((item) => item.unit_id === unit.id && item.category_id === category.id)
    .map((item) => data.subcategories.find((subcategory) => subcategory.id === item.subcategory_id))
    .filter(Boolean)
    .sort((a, b) => a!.sort_order - b!.sort_order);
  return (
    <AppShell>
      <Breadcrumbs items={[{ label: project.full_name, href: `/projects/${project.id}` }, { label: location.name, href: `/projects/${project.id}/locations/${location.id}` }, { label: unit.name, href: `/projects/${project.id}/locations/${location.id}/units/${unit.id}` }, { label: category.name }]} />
      <PageHeader title={category.name} kicker="Undirflokkar" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {subcategories.map((subcategory) => subcategory ? <SubcategoryCard key={subcategory.id} subcategory={subcategory} unit={unit} data={data} /> : null)}
      </div>
    </AppShell>
  );
}
