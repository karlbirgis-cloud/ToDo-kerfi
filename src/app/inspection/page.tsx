"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, ClipboardCheck, ListChecks, MapPin } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { UnitTaskForm } from "@/components/forms";
import { TaskCard } from "@/components/task-card";
import { Card, EmptyState, PageHeader, ProgressBar } from "@/components/ui";
import { useAppData } from "@/lib/data-provider";
import { summarizeTasks, tasksFor } from "@/lib/utils";

export default function InspectionPage() {
  const { data, completeTask } = useAppData();
  const [projectId, setProjectId] = useState("");
  const [locationId, setLocationId] = useState("");
  const [unitId, setUnitId] = useState("");

  const projects = useMemo(
    () => data.projects.filter((project) => project.status !== "done").sort((a, b) => a.full_name.localeCompare(b.full_name, "is", { numeric: true })),
    [data.projects]
  );
  const locations = useMemo(
    () => data.locations.filter((location) => location.project_id === projectId).sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name, "is", { numeric: true })),
    [data.locations, projectId]
  );
  const units = useMemo(
    () => data.units.filter((unit) => unit.location_id === locationId).sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name, "is", { numeric: true })),
    [data.units, locationId]
  );

  useEffect(() => {
    if (!projectId && projects[0]) setProjectId(projects[0].id);
    if (projectId && !projects.some((project) => project.id === projectId)) setProjectId(projects[0]?.id ?? "");
  }, [projectId, projects]);

  useEffect(() => {
    if (!locations.some((location) => location.id === locationId)) setLocationId(locations[0]?.id ?? "");
  }, [locationId, locations]);

  useEffect(() => {
    if (!units.some((unit) => unit.id === unitId)) setUnitId(units[0]?.id ?? "");
  }, [unitId, units]);

  const project = data.projects.find((item) => item.id === projectId);
  const location = data.locations.find((item) => item.id === locationId);
  const unit = data.units.find((item) => item.id === unitId);
  const unitTasks = unit ? tasksFor(data, { unit_id: unit.id }).sort((a, b) => {
    const statusWeight = { open: 0, in_progress: 1, done: 2 };
    return statusWeight[a.status] - statusWeight[b.status] || a.title.localeCompare(b.title, "is");
  }) : [];
  const activeTasks = unitTasks.filter((task) => task.status !== "done");
  const summary = summarizeTasks(unitTasks);

  return (
    <AppShell>
      <PageHeader title="Úttekt" kicker="Hraðskráning á verkstað" />

      <div className="grid gap-4 lg:grid-cols-[380px_1fr]">
        <div className="grid gap-4 lg:sticky lg:top-24 lg:self-start">
          <Card>
            <div className="mb-4 flex items-center gap-2 font-bold text-ink">
              <MapPin className="h-4 w-4" /> Veldu rými
            </div>
            <div className="grid gap-3">
              <InspectionSelect
                label="Verkefni"
                value={projectId}
                onChange={(value) => {
                  setProjectId(value);
                  setLocationId("");
                  setUnitId("");
                }}
                options={projects.map((item) => ({ value: item.id, label: item.full_name }))}
                placeholder="Ekkert verkefni"
              />
              <InspectionSelect
                label="Gata / byggingarhluti"
                value={locationId}
                onChange={(value) => {
                  setLocationId(value);
                  setUnitId("");
                }}
                options={locations.map((item) => ({ value: item.id, label: item.name }))}
                placeholder="Engin gata"
                disabled={!projectId}
              />
              <InspectionSelect
                label="Íbúð / rými"
                value={unitId}
                onChange={setUnitId}
                options={units.map((item) => ({ value: item.id, label: item.name }))}
                placeholder="Ekkert rými"
                disabled={!locationId}
              />
            </div>
          </Card>

          {unit ? (
            <Card>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-500">{project?.full_name} · {location?.name}</p>
                  <h2 className="mt-1 text-xl font-bold text-ink">{unit.name}</h2>
                </div>
                <Link href={`/projects/${projectId}/locations/${locationId}/units/${unitId}`} className="touch-target inline-flex items-center justify-center rounded-md border border-slate-200 px-3 text-sm font-bold text-slate-700">
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <Metric label="Opið" value={summary.open} tone="text-blue-800" />
                <Metric label="Í vinnslu" value={summary.in_progress} tone="text-amber-700" />
                <Metric label="Lokið" value={summary.done} tone="text-emerald-700" />
              </div>
              <div className="mt-4">
                <div className="mb-2 flex items-center justify-between text-sm font-semibold text-slate-600">
                  <span>Framvinda</span>
                  <span>{summary.progress}%</span>
                </div>
                <ProgressBar value={summary.progress} />
              </div>
            </Card>
          ) : null}
        </div>

        <div className="grid gap-4">
          {unit ? (
            <>
              <Card>
                <h2 className="mb-4 flex items-center gap-2 font-bold text-ink">
                  <ClipboardCheck className="h-4 w-4" /> Skrá nýtt atriði
                </h2>
                <UnitTaskForm projectId={projectId} locationId={locationId} unitId={unit.id} submitMode="stay" />
              </Card>

              <section>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h2 className="flex items-center gap-2 font-bold text-ink">
                    <ListChecks className="h-4 w-4" /> Opin atriði í rýminu
                  </h2>
                  <span className="rounded-full bg-white px-3 py-1 text-sm font-bold text-slate-700 ring-1 ring-slate-200">{activeTasks.length}</span>
                </div>
                {activeTasks.length > 0 ? (
                  <div className="grid gap-3 md:grid-cols-2">
                    {activeTasks.map((task) => (
                      <TaskCard key={task.id} task={task} data={data} onDone={() => completeTask(task.id)} />
                    ))}
                  </div>
                ) : (
                  <EmptyState title="Engin opin atriði" body="Þegar þú skráir atriði í þessu rými birtast þau hér strax." />
                )}
              </section>
            </>
          ) : (
            <EmptyState title="Veldu rými til að byrja" body="Veldu verkefni, götu og íbúð eða rými til að skrá atriði á staðnum." />
          )}
        </div>
      </div>
    </AppShell>
  );
}

function InspectionSelect({
  label,
  value,
  onChange,
  options,
  placeholder,
  disabled
}: {
  label: string;
  value: string;
  onChange(value: string): void;
  options: Array<{ value: string; label: string }>;
  placeholder: string;
  disabled?: boolean;
}) {
  return (
    <label className="grid gap-1 text-sm font-semibold text-slate-700">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        className="touch-target rounded-md border border-slate-300 bg-white px-3 text-sm outline-none focus:border-blueprint focus:ring-2 focus:ring-blueprint/20 disabled:bg-slate-100 disabled:text-slate-400"
      >
        <option value="">{placeholder}</option>
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </label>
  );
}

function Metric({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
      <p className={`text-2xl font-bold ${tone}`}>{value}</p>
      <p className="text-xs font-semibold text-slate-500">{label}</p>
    </div>
  );
}
