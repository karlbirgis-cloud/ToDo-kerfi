"use client";

import { use, useState } from "react";
import { Pencil, Plus, Save } from "lucide-react";
import { AppShell, Breadcrumbs } from "@/components/app-shell";
import { UnitTaskForm } from "@/components/forms";
import { TaskTable } from "@/components/task-table";
import { Button, Card, EmptyState, PageHeader, ProgressBar } from "@/components/ui";
import { useAppData } from "@/lib/data-provider";
import type { Unit } from "@/lib/types";
import { summarizeTasks, tasksFor } from "@/lib/utils";

export default function UnitPage({ params }: { params: Promise<{ projectId: string; locationId: string; unitId: string }> }) {
  const { projectId, locationId, unitId } = use(params);
  const { data } = useAppData();
  const project = data.projects.find((item) => item.id === projectId);
  const location = data.locations.find((item) => item.id === locationId);
  const unit = data.units.find((item) => item.id === unitId);

  if (!project || !location || !unit) {
    return (
      <AppShell>
        <EmptyState title="Rými fannst ekki" body="Veldu rými úr götusíðu." />
      </AppShell>
    );
  }

  const tasks = tasksFor(data, { unit_id: unit.id }).sort((a, b) => {
    const statusWeight = { open: 0, in_progress: 1, done: 2 };
    return statusWeight[a.status] - statusWeight[b.status] || a.title.localeCompare(b.title, "is");
  });
  const summary = summarizeTasks(tasks);

  return (
    <AppShell>
      <Breadcrumbs
        items={[
          { label: project.full_name, href: `/projects/${project.id}` },
          { label: location.name, href: `/projects/${project.id}/locations/${location.id}` },
          { label: unit.name }
        ]}
      />
      <PageHeader title={unit.name} kicker="Atriði í íbúð / rými" />

      <div className="mb-4 grid gap-3 sm:grid-cols-4">
        <Card>
          <p className="text-2xl font-bold text-ink">{summary.open}</p>
          <p className="text-sm font-medium text-slate-500">Ólokið</p>
        </Card>
        <Card>
          <p className="text-2xl font-bold text-amber-700">{summary.in_progress}</p>
          <p className="text-sm font-medium text-slate-500">Í vinnslu</p>
        </Card>
        <Card>
          <p className="text-2xl font-bold text-emerald-700">{summary.done}</p>
          <p className="text-sm font-medium text-slate-500">Lokið</p>
        </Card>
        <Card>
          <p className="text-2xl font-bold text-ink">{summary.progress}%</p>
          <p className="mb-2 text-sm font-medium text-slate-500">Framvinda</p>
          <ProgressBar value={summary.progress} />
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_380px]">
        <TaskTable tasks={tasks} data={data} />
        <div className="grid gap-4 xl:sticky xl:top-20 xl:self-start">
          <Card>
            <h2 className="mb-4 flex items-center gap-2 font-bold text-ink">
              <Pencil className="h-4 w-4" /> Breyta heiti
            </h2>
            <UnitRenameForm unit={unit} />
          </Card>
          <Card>
            <h2 className="mb-4 flex items-center gap-2 font-bold text-ink">
              <Plus className="h-4 w-4" /> Nýtt atriði
            </h2>
            <UnitTaskForm projectId={project.id} locationId={location.id} unitId={unit.id} />
          </Card>
        </div>
      </div>
    </AppShell>
  );
}

function UnitRenameForm({ unit }: { unit: Unit }) {
  const { updateUnit } = useAppData();
  const [name, setName] = useState(unit.name);
  const [message, setMessage] = useState("");
  const trimmedName = name.trim();
  const canSave = trimmedName.length > 0 && trimmedName !== unit.name;

  return (
    <form
      className="grid gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        if (!canSave) return;
        updateUnit(unit.id, { name: trimmedName });
        setMessage("Heiti vistað.");
      }}
    >
      <label className="grid gap-1 text-sm font-semibold text-slate-700">
        Heiti íbúðar / rýmis
        <input
          value={name}
          onChange={(event) => {
            setName(event.target.value);
            setMessage("");
          }}
          className="touch-target rounded-md border border-slate-300 px-3 text-sm outline-none focus:border-blueprint focus:ring-2 focus:ring-blueprint/20"
          required
        />
      </label>
      <Button disabled={!canSave}>
        <Save className="h-4 w-4" /> Vista heiti
      </Button>
      {message ? <p className="text-sm font-semibold text-emerald-700">{message}</p> : null}
    </form>
  );
}
