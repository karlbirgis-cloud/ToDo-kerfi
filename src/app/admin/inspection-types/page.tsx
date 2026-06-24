"use client";

import { ClipboardList, Plus, Save } from "lucide-react";
import { useState } from "react";
import { AppShell, Breadcrumbs } from "@/components/app-shell";
import { Button, Card, PageHeader } from "@/components/ui";
import { useAppData } from "@/lib/data-provider";
import type { InspectionType } from "@/lib/types";

export default function AdminInspectionTypesPage() {
  const { data, createInspectionType, updateInspectionType } = useAppData();
  const [editingId, setEditingId] = useState("");
  const [message, setMessage] = useState("");
  const inspectionTypes = [...data.inspection_types].sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name, "is", { sensitivity: "base" }));

  return (
    <AppShell>
      <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Tegund úttektarlista" }]} />
      <PageHeader title="Tegund úttektarlista" kicker="Flokkun atriða eftir úttekt" />

      <div className="grid gap-4 xl:grid-cols-[1fr_420px]">
        <section className="grid content-start gap-3">
          {inspectionTypes.length === 0 ? (
            <Card>
              <p className="text-sm font-semibold text-slate-500">Engar tegundir hafa verið stofnaðar.</p>
            </Card>
          ) : null}

          {inspectionTypes.map((inspectionType) => (
            <InspectionTypeCard
              key={inspectionType.id}
              inspectionType={inspectionType}
              isEditing={editingId === inspectionType.id}
              onEdit={() => {
                setMessage("");
                setEditingId(inspectionType.id);
              }}
              onCancel={() => setEditingId("")}
              onSave={(patch) => {
                updateInspectionType(inspectionType.id, patch);
                setEditingId("");
                setMessage("Tegund úttektarlista var uppfærð.");
              }}
            />
          ))}
        </section>

        <Card className="xl:sticky xl:top-20 xl:self-start">
          <h2 className="mb-4 flex items-center gap-2 font-bold text-ink">
            <Plus className="h-4 w-4" /> Ný tegund
          </h2>
          <form
            className="grid gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              const name = String(form.get("name") ?? "").trim();
              if (!name) return;

              createInspectionType({
                name,
                sort_order: Number(form.get("sort_order") || inspectionTypes.length + 1),
                is_active: true
              });
              setMessage("Tegund úttektarlista var stofnuð.");
              event.currentTarget.reset();
            }}
          >
            <Field name="name" label="Heiti" placeholder="T.d. Lokaúttekt" required />
            <Field name="sort_order" label="Röðun" type="number" min={1} defaultValue={inspectionTypes.length + 1} />
            {message ? <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">{message}</p> : null}
            <Button><Plus className="h-4 w-4" /> Stofna tegund</Button>
          </form>
        </Card>
      </div>
    </AppShell>
  );
}

function InspectionTypeCard({
  inspectionType,
  isEditing,
  onEdit,
  onCancel,
  onSave
}: {
  inspectionType: InspectionType;
  isEditing: boolean;
  onEdit(): void;
  onCancel(): void;
  onSave(patch: Pick<InspectionType, "name" | "sort_order" | "is_active">): void;
}) {
  if (isEditing) {
    return (
      <Card>
        <form
          className="grid gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            const name = String(form.get("name") ?? "").trim();
            if (!name) return;
            onSave({
              name,
              sort_order: Number(form.get("sort_order") || inspectionType.sort_order),
              is_active: form.get("is_active") === "on"
            });
          }}
        >
          <Field name="name" label="Heiti" defaultValue={inspectionType.name} required />
          <Field name="sort_order" label="Röðun" type="number" min={1} defaultValue={inspectionType.sort_order} />
          <label className="touch-target flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 text-sm font-bold text-slate-700">
            <input name="is_active" type="checkbox" defaultChecked={inspectionType.is_active} className="h-4 w-4 rounded border-slate-300 text-blueprint focus:ring-blueprint/30" />
            Virk tegund
          </label>
          <div className="flex flex-wrap gap-2">
            <Button><Save className="h-4 w-4" /> Vista</Button>
            <Button type="button" className="bg-slate-700 hover:bg-slate-800" onClick={onCancel}>Hætta við</Button>
          </div>
        </form>
      </Card>
    );
  }

  return (
    <Card>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 font-bold text-ink">
            <ClipboardList className="h-4 w-4 text-blueprint" /> {inspectionType.name}
          </h2>
          <p className="mt-2 text-sm font-semibold text-slate-500">Röðun: {inspectionType.sort_order}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded-full px-3 py-1 text-xs font-bold ${inspectionType.is_active ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" : "bg-slate-100 text-slate-600 ring-1 ring-slate-200"}`}>
            {inspectionType.is_active ? "Virk" : "Óvirk"}
          </span>
          <Button type="button" className="bg-slate-700 hover:bg-slate-800" onClick={onEdit}>Breyta</Button>
        </div>
      </div>
    </Card>
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
