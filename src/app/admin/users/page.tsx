"use client";

import { Mail, Phone, Plus, Save, ShieldCheck, UserRound, Wrench } from "lucide-react";
import { useState } from "react";
import { AppShell, Breadcrumbs } from "@/components/app-shell";
import { Button, Card, PageHeader } from "@/components/ui";
import { accessScopeLabels, roleLabels } from "@/lib/labels";
import { supabase } from "@/lib/supabase/client";
import { useAppData } from "@/lib/data-provider";
import type { AccessScope, Profile, UserRole } from "@/lib/types";

type UserFormValues = {
  name: string;
  email: string;
  password?: string;
  phone: string;
  work_scope: string;
  employer: string;
  role: UserRole;
  company_id: string;
  access_scope: AccessScope;
  project_ids: string[];
};

export default function AdminUsersPage() {
  const { data, createProfile, updateProfile, flushPendingCloudSave } = useAppData();
  const companyOptions = Object.fromEntries(data.companies.map((company) => [company.id, company.name]));
  const projectOptions = data.projects.map((project) => ({ id: project.id, name: project.full_name }));
  const [editingId, setEditingId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function updateAuthUser(id: string, values: Pick<UserFormValues, "name" | "email"> & { password?: string }) {
    const response = await fetch("/api/users", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${(await supabase?.auth.getSession())?.data.session?.access_token ?? ""}`
      },
      body: JSON.stringify({ id, name: values.name, email: values.email, password: values.password || undefined })
    });
    const payload = (await response.json()) as { error?: string };
    if (!response.ok) throw new Error(payload.error ?? "Ekki tókst að uppfæra innskráningu.");
  }

  return (
    <AppShell>
      <Breadcrumbs items={[{ label: "Admin", href: "/admin" }, { label: "Notendur" }]} />
      <PageHeader title="Notendur" kicker="Innskráning og aðgangur" />

      <div className="grid gap-4 xl:grid-cols-[1fr_460px]">
        <section className="grid content-start gap-3">
          {data.profiles.map((profile) => {
            const company = data.companies.find((item) => item.id === profile.company_id);
            const visibleProjects = profile.access_scope === "project"
              ? projectOptions.filter((project) => (profile.project_ids ?? []).includes(project.id)).map((project) => project.name)
              : [];

            return (
              <Card key={profile.id}>
                {editingId === profile.id ? (
                  <UserForm
                    submitLabel="Vista notanda"
                    defaultValues={profileToFormValues(profile)}
                    companyOptions={companyOptions}
                    projectOptions={projectOptions}
                    includePassword={false}
                    onCancel={() => setEditingId("")}
                    onSubmit={async (values) => {
                      setMessage("");
                      setError("");
                      setIsSubmitting(true);
                      try {
                        await updateAuthUser(profile.id, values);
                        updateProfile(profile.id, values);
                        await flushPendingCloudSave();
                        setEditingId("");
                        setMessage("Notandi var uppfærður.");
                      } catch (caught) {
                        setError(caught instanceof Error ? caught.message : "Ekki tókst að uppfæra notanda.");
                      } finally {
                        setIsSubmitting(false);
                      }
                    }}
                    isSubmitting={isSubmitting}
                  />
                ) : (
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
                        <Info icon={<ShieldCheck className="h-4 w-4" />} label={accessSummary(profile, company?.name, visibleProjects)} />
                      </div>
                    </div>
                    <Button type="button" className="bg-slate-700 hover:bg-slate-800" onClick={() => {
                      setMessage("");
                      setError("");
                      setEditingId(profile.id);
                    }}>Breyta</Button>
                  </div>
                )}
              </Card>
            );
          })}
        </section>

        <Card className="xl:sticky xl:top-20 xl:self-start">
          <h2 className="mb-4 flex items-center gap-2 font-bold text-ink">
            <Plus className="h-4 w-4" /> Nýr notandi
          </h2>
          <UserForm
            submitLabel="Stofna notanda"
            defaultValues={{
              name: "",
              email: "",
              password: "",
              phone: "",
              work_scope: "",
              employer: "",
              role: "worker",
              company_id: data.companies[0]?.id ?? "",
              access_scope: "company",
              project_ids: []
            }}
            companyOptions={companyOptions}
            projectOptions={projectOptions}
            includePassword
            isSubmitting={isSubmitting}
            onSubmit={async (values, form) => {
              setMessage("");
              setError("");
              setIsSubmitting(true);
              try {
                const response = await fetch("/api/users", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${(await supabase?.auth.getSession())?.data.session?.access_token ?? ""}`
                  },
                  body: JSON.stringify({ name: values.name, email: values.email, password: values.password })
                });
                const payload = (await response.json()) as { id?: string; error?: string };
                if (!response.ok || !payload.id) throw new Error(payload.error ?? "Ekki tókst að stofna innskráningu.");

                createProfile({
                  id: payload.id,
                  name: values.name,
                  email: values.email,
                  phone: values.phone,
                  work_scope: values.work_scope,
                  employer: values.employer,
                  role: values.role,
                  company_id: values.company_id,
                  access_scope: values.access_scope,
                  project_ids: values.project_ids
                });
                await flushPendingCloudSave();
                setMessage("Notandi var stofnaður og getur skráð sig inn.");
                form?.reset();
              } catch (caught) {
                setError(caught instanceof Error ? caught.message : "Ekki tókst að stofna notanda.");
              } finally {
                setIsSubmitting(false);
              }
            }}
          />
          {message ? <p className="mt-3 rounded-md bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">{message}</p> : null}
          {error ? <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-sm font-semibold text-red-700">{error}</p> : null}
        </Card>
      </div>
    </AppShell>
  );
}

function UserForm({
  defaultValues,
  companyOptions,
  projectOptions,
  includePassword,
  submitLabel,
  isSubmitting,
  onSubmit,
  onCancel
}: {
  defaultValues: UserFormValues;
  companyOptions: Record<string, string>;
  projectOptions: Array<{ id: string; name: string }>;
  includePassword: boolean;
  submitLabel: string;
  isSubmitting: boolean;
  onSubmit(values: UserFormValues, form?: HTMLFormElement): void | Promise<void>;
  onCancel?(): void;
}) {
  const [accessScope, setAccessScope] = useState<AccessScope>(defaultValues.access_scope);

  return (
    <form
      className="grid gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        const values: UserFormValues = {
          name: String(form.get("name") ?? "").trim(),
          email: String(form.get("email") ?? "").trim(),
          password: String(form.get("password") ?? ""),
          phone: String(form.get("phone") ?? "").trim(),
          work_scope: String(form.get("work_scope") ?? "").trim(),
          employer: String(form.get("employer") ?? "").trim(),
          role: form.get("role") as UserRole,
          company_id: String(form.get("company_id") ?? ""),
          access_scope: form.get("access_scope") as AccessScope,
          project_ids: form.getAll("project_ids").map(String)
        };
        onSubmit(values, event.currentTarget);
      }}
    >
      <Field name="name" label="Nafn" placeholder="Fullt nafn" defaultValue={defaultValues.name} required />
      <Field name="email" label="Email adressa" placeholder="nafn@example.com" type="email" defaultValue={defaultValues.email} required />
      {includePassword ? (
        <Field name="password" label="Tímabundið lykilorð" placeholder="A.m.k. 8 stafir" type="password" minLength={8} required />
      ) : (
        <Field name="password" label="Nýtt lykilorð" placeholder="Skilja autt ef á ekki að breyta" type="password" minLength={8} />
      )}
      <Field name="phone" label="Símanúmer" placeholder="555 0000" defaultValue={defaultValues.phone} />
      <Field name="work_scope" label="Verksvið" placeholder="T.d. málun, rafmagn, verkstjórn" defaultValue={defaultValues.work_scope} />
      <Field name="employer" label="Hjá hverjum vinnur hann/hún?" placeholder="Fyrirtæki eða undirverktaki" defaultValue={defaultValues.employer} />
      <Select name="role" label="Hlutverk" options={roleLabels} defaultValue={defaultValues.role} />
      <Select name="company_id" label="Fyrirtæki" options={companyOptions} defaultValue={defaultValues.company_id} />
      <Select
        name="access_scope"
        label="Aðgangur"
        options={accessScopeLabels}
        value={accessScope}
        onChange={(event) => setAccessScope(event.target.value as AccessScope)}
      />
      {accessScope === "project" ? (
        <fieldset className="grid gap-2 rounded-md border border-slate-200 p-3">
          <legend className="px-1 text-sm font-bold text-slate-700">Veldu verkefni</legend>
          {projectOptions.map((project) => (
            <label key={project.id} className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <input
                type="checkbox"
                name="project_ids"
                value={project.id}
                defaultChecked={defaultValues.project_ids.includes(project.id)}
                className="h-4 w-4 rounded border-slate-300"
              />
              <span>{project.name}</span>
            </label>
          ))}
        </fieldset>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <Button disabled={isSubmitting}>{includePassword ? <Plus className="h-4 w-4" /> : <Save className="h-4 w-4" />} {isSubmitting ? "Vista..." : submitLabel}</Button>
        {onCancel ? <Button type="button" className="bg-slate-700 hover:bg-slate-800" onClick={onCancel}>Hætta við</Button> : null}
      </div>
    </form>
  );
}

function profileToFormValues(profile: Profile): UserFormValues {
  return {
    name: profile.name,
    email: profile.email,
    password: "",
    phone: profile.phone ?? "",
    work_scope: profile.work_scope ?? "",
    employer: profile.employer ?? "",
    role: profile.role,
    company_id: profile.company_id,
    access_scope: profile.access_scope ?? "company",
    project_ids: profile.project_ids ?? []
  };
}

function accessSummary(profile: Profile, companyName?: string, projectNames: string[] = []) {
  const scope = profile.access_scope ?? "company";
  if (scope === "all") return accessScopeLabels.all;
  if (scope === "project") return projectNames.length > 0 ? `Verkefni: ${projectNames.join(", ")}` : "Engin verkefni valin";
  return `Fyrirtæki: ${companyName ?? "Óþekkt"}`;
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
