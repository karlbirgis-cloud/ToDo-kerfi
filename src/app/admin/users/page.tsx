"use client";

import { Mail, Phone, Plus, UserRound, Wrench } from "lucide-react";
import { AppShell, Breadcrumbs } from "@/components/app-shell";
import { Button, Card, PageHeader } from "@/components/ui";
import { roleLabels } from "@/lib/labels";
import { useAppData } from "@/lib/data-provider";
import type { UserRole } from "@/lib/types";

export default function AdminUsersPage() {
  const { data, createProfile } = useAppData();
  const companyOptions = Object.fromEntries(data.companies.map((company) => [company.id, company.name]));

  return (
    <AppShell>
      <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Notendur" }]} />
      <PageHeader title="Notendur" kicker="Stofnun og yfirlit" />

      <div className="grid gap-4 xl:grid-cols-[1fr_420px]">
        <section className="grid content-start gap-3">
          {data.profiles.map((profile) => {
            const company = data.companies.find((item) => item.id === profile.company_id);
            return (
              <Card key={profile.id}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-bold text-ink">{profile.name}</h2>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">{roleLabels[profile.role]}</span>
                    </div>
                    <div className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
                      <Info icon={<Mail className="h-4 w-4" />} label={profile.email} />
                      <Info icon={<Phone className="h-4 w-4" />} label={profile.phone || "Símanúmer vantar"} />
                      <Info icon={<Wrench className="h-4 w-4" />} label={profile.work_scope || "Verksvið vantar"} />
                      <Info icon={<UserRound className="h-4 w-4" />} label={profile.employer || company?.name || "Vinnuveitandi vantar"} />
                    </div>
                  </div>
                  <span className="text-xs font-semibold uppercase text-slate-400">{company?.name}</span>
                </div>
              </Card>
            );
          })}
        </section>

        <Card className="xl:sticky xl:top-20 xl:self-start">
          <h2 className="mb-4 flex items-center gap-2 font-bold text-ink">
            <Plus className="h-4 w-4" /> Nýr notandi
          </h2>
          <form
            className="grid gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              createProfile({
                name: String(form.get("name")),
                email: String(form.get("email")),
                phone: String(form.get("phone") ?? ""),
                work_scope: String(form.get("work_scope") ?? ""),
                employer: String(form.get("employer") ?? ""),
                role: form.get("role") as UserRole,
                company_id: String(form.get("company_id"))
              });
              event.currentTarget.reset();
            }}
          >
            <Field name="name" label="Nafn" placeholder="Fullt nafn" required />
            <Field name="email" label="Email adressa" placeholder="nafn@example.com" type="email" required />
            <Field name="phone" label="Símanúmer" placeholder="555 0000" />
            <Field name="work_scope" label="Verksvið" placeholder="T.d. málun, rafmagn, verkstjórn" />
            <Field name="employer" label="Hjá hverjum vinnur hann/hún?" placeholder="Fyrirtæki eða undirverktaki" />
            <Select name="role" label="Hlutverk" options={roleLabels} />
            <Select name="company_id" label="Aðgangur að fyrirtæki/verkefni" options={companyOptions} />
            <Button><Plus className="h-4 w-4" /> Stofna notanda</Button>
          </form>
        </Card>
      </div>
    </AppShell>
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

function Select({ label, options, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { label: string; options: Record<string, string> }) {
  return (
    <label className="grid gap-1 text-sm font-semibold text-slate-700">
      {label}
      <select className="touch-target rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-blueprint focus:ring-2 focus:ring-blueprint/20" {...props}>
        {Object.entries(options).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
      </select>
    </label>
  );
}
