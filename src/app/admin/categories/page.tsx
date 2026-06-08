"use client";

import { AppShell, Breadcrumbs } from "@/components/app-shell";
import { Card, PageHeader } from "@/components/ui";
import { useAppData } from "@/lib/data-provider";

export default function AdminCategoriesPage() {
  const { data } = useAppData();
  return (
    <AppShell>
      <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Flokkar" }]} />
      <PageHeader title="Flokkar og undirflokkar" />
      <div className="grid gap-4 md:grid-cols-2">
        {data.categories.map((category) => (
          <Card key={category.id}>
            <div className="flex items-center justify-between"><h2 className="font-bold">{category.name}</h2><span className="text-xs font-bold text-emerald-700">{category.is_active ? "Virkur" : "Óvirkur"}</span></div>
            <ul className="mt-3 grid gap-1 text-sm text-slate-600">
              {data.subcategories.filter((item) => item.category_id === category.id).map((subcategory) => <li key={subcategory.id}>{subcategory.name}</li>)}
            </ul>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}
