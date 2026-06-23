"use client";

import { Building2, Mail, Phone, Plus, Save } from "lucide-react";
import { useState } from "react";
import { AppShell, Breadcrumbs } from "@/components/app-shell";
import { Button, Card, PageHeader } from "@/components/ui";
import { useAppData } from "@/lib/data-provider";
import type { ResponsibleParty } from "@/lib/types";

export default function AdminResponsiblePartiesPage() {
  const { data, createResponsibleParty, updateResponsibleParty } = useAppData();
  const [editingId, setEditingId] = useState("");
  const [message, setMessage] = useState("");

  return (
    <AppShell>
      <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Ábyrgðaraðilar" }]} />
      <PageHeader title="Ábyrgðaraðilar" kicker="Fyrirtæki og verkþættir" />

      <div className="grid gap-4 xl:grid-cols-[1fr_420px]">
        <section className="grid content-start gap-3">
          {data.responsible_parties.length === 0 ? (
            <Card>
              <p className="text-sm font-semibold text-slate-500">Engir ábyrgðaraðilar hafa verið stofnaðir.</p>
            </Card>
          ) : null}

          {data.responsible_parties.map((responsibleParty) => (
            <ResponsiblePartyCard
              key={responsibleParty.id}
              responsibleParty={responsibleParty}
              isEditing={editingId === responsibleParty.id}
              onEdit={() => {
                setMessage("");
                setEditingId(responsibleParty.id);
              }}
              onCancel={() => setEditingId("")}
              onSave={(patch) => {
                updateResponsibleParty(responsibleParty.id, patch);
                setEditingId("");
                setMessage("Ábyrgðaraðili var uppfærður.");
              }}
            />
          ))}
        </section>

        <Card className="xl:sticky xl:top-20 xl:self-start">
          <h2 className="mb-4 flex items-center gap-2 font-bold text-ink">
            <Plus className="h-4 w-4" /> Nýr ábyrgðaraðili
          </h2>
          <form
            className="grid gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              const name = String(form.get("name") ?? "").trim();
              if (!name) return;

              createResponsibleParty({
                name,
                email: String(form.get("email") ?? "").trim(),
                phone: String(form.get("phone") ?? "").trim()
              });
              setMessage("Ábyrgðaraðili var stofnaður.");
              event.currentTarget.reset();
            }}
          >
            <Field name="name" label="Nafn fyrirtækis" placeholder="T.d. Raf ehf." required />
            <Field name="email" label="Email fyrirtækis" placeholder="fyrirtaeki@example.com" type="email" />
            <Field name="phone" label="Símanúmer" placeholder="555 0000" />
            {message ? <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">{message}</p> : null}
            <Button><Plus className="h-4 w-4" /> Stofna ábyrgðaraðila</Button>
          </form>
        </Card>
      </div>
    </AppShell>
  );
}

function ResponsiblePartyCard({
  responsibleParty,
  isEditing,
  onEdit,
  onCancel,
  onSave
}: {
  responsibleParty: ResponsibleParty;
  isEditing: boolean;
  onEdit(): void;
  onCancel(): void;
  onSave(patch: Pick<ResponsibleParty, "name"> & Partial<Pick<ResponsibleParty, "email" | "phone">>): void;
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
              email: String(form.get("email") ?? "").trim(),
              phone: String(form.get("phone") ?? "").trim()
            });
          }}
        >
          <Field name="name" label="Nafn fyrirtækis" defaultValue={responsibleParty.name} required />
          <Field name="email" label="Email fyrirtækis" defaultValue={responsibleParty.email ?? ""} type="email" />
          <Field name="phone" label="Símanúmer" defaultValue={responsibleParty.phone ?? ""} />
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
            <Building2 className="h-4 w-4 text-blueprint" /> {responsibleParty.name}
          </h2>
          <div className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
            <Info icon={<Mail className="h-4 w-4" />} label={responsibleParty.email || "Email vantar"} />
            <Info icon={<Phone className="h-4 w-4" />} label={responsibleParty.phone || "Símanúmer vantar"} />
          </div>
        </div>
        <Button type="button" className="bg-slate-700 hover:bg-slate-800" onClick={onEdit}>Breyta</Button>
      </div>
    </Card>
  );
}

function Info({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="flex min-w-0 items-center gap-2">
      <span className="shrink-0 text-slate-400">{icon}</span>
      <span className="truncate">{label}</span>
    </span>
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
