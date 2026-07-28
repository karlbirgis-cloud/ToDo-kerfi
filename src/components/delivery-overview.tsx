"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Printer } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button, Card, PageHeader, UserPill } from "@/components/ui";
import { statusLabels } from "@/lib/labels";
import { useAppData } from "@/lib/data-provider";
import type { AppData, Task, TaskStatus, Unit } from "@/lib/types";
import { cn, getTaskResponsiblePartyName } from "@/lib/utils";

const PROJECT_NAME = "Bryggjuhverfi";
const INSPECTION_TYPE_NAME = "Loka skoðun fyrir afhendingu";

type PrintGroup = {
  locationName: string;
  mode: "detailed" | "simple";
  printId: number;
  printImageUrls?: Record<string, string>;
  responsiblePartyName?: string;
  statusFilterName?: string;
  tasks: Task[];
  unitName: string;
};

type UnitGroup = {
  tasks: Task[];
  unit: Unit;
};

type StatusFilter = TaskStatus | "";

export function DeliveryOverview({ locationName, title }: { locationName: string; title: string }) {
  const { data } = useAppData();
  const [printGroup, setPrintGroup] = useState<PrintGroup | null>(null);
  const [responsibleFilterId, setResponsibleFilterId] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("open");
  const tasks = useMemo(() => getDeliveryTasks(data, locationName), [data, locationName]);
  const statusFilteredTasks = useMemo(
    () => statusFilter ? tasks.filter((task) => task.status === statusFilter) : tasks,
    [statusFilter, tasks]
  );
  const responsibleOptions = useMemo(() => getResponsibleFilterOptions(data, statusFilteredTasks), [data, statusFilteredTasks]);
  const filteredTasks = useMemo(
    () => responsibleFilterId ? statusFilteredTasks.filter((task) => getResponsibleFilterId(task) === responsibleFilterId) : statusFilteredTasks,
    [responsibleFilterId, statusFilteredTasks]
  );
  const unitGroups = useMemo(() => getUnitGroups(data, locationName, filteredTasks), [data, locationName, filteredTasks]);
  const selectedResponsiblePartyName = responsibleOptions.find((option) => option.id === responsibleFilterId)?.name;
  const selectedStatusFilterName = getStatusFilterName(statusFilter);

  useEffect(() => {
    if (!printGroup) return;

    let isCancelled = false;

    async function printWhenReady() {
      await waitForNextFrame();
      await waitForNextFrame();

      const report = document.querySelector(".print-report");
      const images = Array.from(report?.querySelectorAll("img") ?? []);
      await Promise.all(images.map(waitForImage));

      if (!isCancelled) window.print();
    }

    printWhenReady();

    return () => {
      isCancelled = true;
    };
  }, [printGroup]);

  async function printTasks(group: PrintGroup) {
    const sortedTasks = sortTasksForPrint(group.tasks, data);
    const printImageUrls = group.mode === "detailed" ? await createPrintImageUrls(sortedTasks, data) : undefined;
    setPrintGroup({ ...group, tasks: sortedTasks, printImageUrls });
  }

  return (
    <AppShell>
      <div className="no-print">
        <PageHeader title={title} kicker="Loka skoðun fyrir afhendingu" />
        <Card className="p-0">
          <div className="border-b border-slate-100 p-4">
            <h2 className="font-bold text-ink">Atriði eftir íbúðum</h2>
            <p className="mt-1 text-sm text-slate-600">
              {filteredTasks.length} af {tasks.length} atriðum í {PROJECT_NAME}, {locationName}, merkt {INSPECTION_TYPE_NAME}.
            </p>
          </div>
          <div className="flex flex-col gap-3 border-b border-slate-100 p-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[40rem]">
              <label className="grid gap-1 text-sm font-semibold text-slate-700">
                Staða
                <select
                  value={statusFilter}
                  onChange={(event) => {
                    setStatusFilter(event.target.value as StatusFilter);
                    setResponsibleFilterId("");
                  }}
                  className="h-11 rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold outline-none focus:border-blueprint focus:ring-2 focus:ring-blueprint/20"
                >
                  <option value="">Öll atriði</option>
                  {Object.entries(statusLabels).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </label>
              <label className="grid gap-1 text-sm font-semibold text-slate-700">
                Ábyrgðaraðili
                <select
                  value={responsibleFilterId}
                  onChange={(event) => setResponsibleFilterId(event.target.value)}
                  className="h-11 rounded-md border border-slate-300 bg-white px-3 text-sm font-semibold outline-none focus:border-blueprint focus:ring-2 focus:ring-blueprint/20"
                >
                  <option value="">Allir ábyrgðaraðilar</option>
                  {responsibleOptions.map((option) => (
                    <option key={option.id} value={option.id}>{option.name} ({option.count})</option>
                  ))}
                </select>
              </label>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                disabled={filteredTasks.length === 0}
                className="touch-target inline-flex items-center justify-center gap-2 rounded-md border border-slate-300 bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-900 shadow-none transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400 disabled:opacity-55"
                onClick={() => printTasks({
                  locationName,
                  mode: "simple",
                  printId: Date.now(),
                  responsiblePartyName: selectedResponsiblePartyName,
                  statusFilterName: selectedStatusFilterName,
                  tasks: filteredTasks,
                  unitName: responsibleFilterId ? "Allar íbúðir - síað eftir ábyrgðaraðila" : "Allar íbúðir"
                })}
              >
                <Printer className="h-4 w-4" /> Prenta einfalda skýrslu
              </button>
              <Button
                type="button"
                disabled={filteredTasks.length === 0}
                className="bg-blueprint hover:bg-blue-700 disabled:bg-slate-300"
                onClick={() => printTasks({
                  locationName,
                  mode: "detailed",
                  printId: Date.now(),
                  responsiblePartyName: selectedResponsiblePartyName,
                  statusFilterName: selectedStatusFilterName,
                  tasks: filteredTasks,
                  unitName: responsibleFilterId ? "Allar íbúðir - síað eftir ábyrgðaraðila" : "Allar íbúðir"
                })}
              >
                <Printer className="h-4 w-4" /> Prenta sýnileg atriði
              </Button>
            </div>
          </div>
          <UnitSections
            groups={unitGroups}
            data={data}
            locationName={locationName}
            responsiblePartyName={selectedResponsiblePartyName}
            statusFilterName={selectedStatusFilterName}
            onPrint={printTasks}
          />
        </Card>
      </div>

      {printGroup ? <PrintableGroup group={printGroup} data={data} pageTitle={title} /> : null}
    </AppShell>
  );
}

function getDeliveryTasks(data: AppData, locationName: string) {
  const projectIds = new Set(
    data.projects
      .filter((project) => normalize(project.name) === normalize(PROJECT_NAME) || normalize(project.full_name).includes(normalize(PROJECT_NAME)))
      .map((project) => project.id)
  );
  const locationIds = new Set(
    data.locations
      .filter((location) => projectIds.has(location.project_id) && normalize(location.name) === normalize(locationName))
      .map((location) => location.id)
  );
  const inspectionTypeIds = new Set(
    data.inspection_types
      .filter((inspectionType) => normalize(inspectionType.name) === normalize(INSPECTION_TYPE_NAME))
      .map((inspectionType) => inspectionType.id)
  );
  const deliveryRunIds = new Set(
    data.inspection_runs
      .filter((run) => inspectionTypeIds.has(run.inspection_type_id))
      .map((run) => run.id)
  );
  const deliveryRunItemIds = new Set(
    data.inspection_run_items
      .filter((runItem) => deliveryRunIds.has(runItem.run_id))
      .map((runItem) => runItem.id)
  );

  return data.tasks
    .filter((task) => projectIds.has(task.project_id))
    .filter((task) => locationIds.has(task.location_id))
    .filter((task) => (
      Boolean(task.inspection_type_id && inspectionTypeIds.has(task.inspection_type_id)) ||
      Boolean(task.inspection_run_item_id && deliveryRunItemIds.has(task.inspection_run_item_id))
    ))
    .sort(sortTasks);
}

function getUnitGroups(data: AppData, locationName: string, tasks: Task[]) {
  const locationIds = new Set(data.locations.filter((location) => normalize(location.name) === normalize(locationName)).map((location) => location.id));
  const taskUnitIds = new Set(tasks.map((task) => task.unit_id));
  const knownGroups: UnitGroup[] = data.units
    .filter((unit) => locationIds.has(unit.location_id) && taskUnitIds.has(unit.id))
    .sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name, "is", { numeric: true, sensitivity: "base" }))
    .map((unit) => ({
      unit,
      tasks: tasks.filter((task) => task.unit_id === unit.id)
    }));

  const knownUnitIds = new Set(knownGroups.map((group) => group.unit.id));
  const missingUnitTasks = tasks.filter((task) => !knownUnitIds.has(task.unit_id));
  if (missingUnitTasks.length === 0) return knownGroups;

  return [
    ...knownGroups,
    {
      unit: {
        id: "unknown-unit",
        project_id: "",
        location_id: "",
        name: "Óþekkt íbúð",
        unit_type: "other" as const,
        sort_order: Number.MAX_SAFE_INTEGER,
        created_at: "",
        updated_at: ""
      },
      tasks: missingUnitTasks
    }
  ];
}

function UnitSections({
  groups,
  data,
  locationName,
  responsiblePartyName,
  statusFilterName,
  onPrint
}: {
  groups: UnitGroup[];
  data: AppData;
  locationName: string;
  responsiblePartyName?: string;
  statusFilterName?: string;
  onPrint(group: PrintGroup): void;
}) {
  if (groups.length === 0) {
    return <div className="p-6 text-sm text-slate-600">Engin atriði fundust fyrir þessa síu.</div>;
  }

  return (
    <div className="grid gap-5 p-4">
      {groups.map((group) => (
        <section key={group.unit.id} className="overflow-hidden rounded-md border border-slate-200">
          <div className="flex flex-col gap-3 border-b border-slate-100 bg-slate-900 px-4 py-3 text-white sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold">{group.unit.name}</h2>
              <p className="mt-0.5 text-sm font-semibold text-slate-200">{group.tasks.length} atriði</p>
            </div>
            <Button
              type="button"
              className="bg-white text-slate-900 hover:bg-slate-100"
              onClick={() => onPrint({
                locationName,
                mode: "detailed",
                printId: Date.now(),
                responsiblePartyName,
                statusFilterName,
                tasks: group.tasks,
                unitName: group.unit.name
              })}
            >
              <Printer className="h-4 w-4" /> Prenta PDF
            </Button>
          </div>
          <DeliveryTaskTable tasks={group.tasks} data={data} />
        </section>
      ))}
    </div>
  );
}

function DeliveryTaskTable({ tasks, data }: { tasks: Task[]; data: AppData }) {
  const router = useRouter();
  const { updateTask, updateTaskStatus } = useAppData();

  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[1120px] border-collapse text-left text-sm">
          <thead className="bg-white text-xs font-bold uppercase text-slate-500">
            <tr>
              <Th>Mikilvægt</Th>
              <Th>Rými</Th>
              <Th>Titill</Th>
              <Th>Lýsing</Th>
              <Th>Flokkur</Th>
              <Th>Ábyrgðaraðili</Th>
              <Th>Staða</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {tasks.map((task) => {
              const row = getTaskRow(task, data);
              return (
                <tr
                  key={task.id}
                  role="link"
                  tabIndex={0}
                  onClick={() => router.push(`/tasks/${task.id}`)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") router.push(`/tasks/${task.id}`);
                  }}
                  className={cn("cursor-pointer border-l-4 transition focus:outline-none", getTaskRowTone(task))}
                >
                  <Td>
                    <ImportantButton
                      task={task}
                      onToggle={() => updateTask(task.id, { priority: task.priority === "urgent" ? "medium" : "urgent" })}
                    />
                  </Td>
                  <Td>{row.section}</Td>
                  <Td className="font-bold text-ink">{task.title}</Td>
                  <Td className="max-w-md text-slate-600"><span className="line-clamp-2">{task.description || "-"}</span></Td>
                  <Td>{row.category}</Td>
                  <Td><UserPill name={row.assignee} /></Td>
                  <Td>
                    <DeliveryStatusSelect task={task} onChange={(status) => updateTaskStatus(task.id, status)} />
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="grid gap-3 p-3 md:hidden">
        {tasks.map((task) => {
          const row = getTaskRow(task, data);
          return (
            <div
              key={task.id}
              role="link"
              tabIndex={0}
              onClick={() => router.push(`/tasks/${task.id}`)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") router.push(`/tasks/${task.id}`);
              }}
              className={cn("rounded-md border border-l-4 p-3 text-left shadow-sm", getTaskCardTone(task))}
            >
              <div className="flex flex-wrap gap-2">
                <ImportantButton
                  task={task}
                  onToggle={() => updateTask(task.id, { priority: task.priority === "urgent" ? "medium" : "urgent" })}
                />
                <DeliveryStatusSelect task={task} onChange={(status) => updateTaskStatus(task.id, status)} />
                <UserPill name={row.assignee} />
              </div>
              <h3 className="mt-3 font-bold text-ink">{task.title}</h3>
              <p className="mt-1 line-clamp-2 text-sm text-slate-600">{task.description || "-"}</p>
              <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <Detail label="Rými" value={row.section} />
                <Detail label="Flokkur" value={row.category} />
                <Detail label="Staða" value={statusLabels[task.status]} />
              </dl>
            </div>
          );
        })}
      </div>
    </>
  );
}

function ImportantButton({ task, onToggle }: { task: Task; onToggle: () => void }) {
  const isImportant = task.priority === "urgent";

  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onToggle();
      }}
      onKeyDown={(event) => event.stopPropagation()}
      className={cn(
        "inline-flex h-9 items-center justify-center gap-1.5 rounded-md border px-2.5 text-xs font-bold transition focus:outline-none focus:ring-2 focus:ring-red-200",
        isImportant
          ? "border-red-300 bg-red-600 text-white hover:bg-red-700"
          : "border-slate-300 bg-white text-slate-700 hover:border-red-300 hover:bg-red-50 hover:text-red-700"
      )}
      aria-pressed={isImportant}
      aria-label={`${isImportant ? "Afmerkja" : "Merkja"} mikilvægt atriði: ${task.title}`}
    >
      <AlertTriangle className="h-4 w-4" />
      Mikilvægt
    </button>
  );
}

function DeliveryStatusSelect({ task, onChange }: { task: Task; onChange: (status: TaskStatus) => void }) {
  return (
    <label
      className="inline-grid gap-1 text-xs font-semibold text-slate-600"
      onClick={(event) => event.stopPropagation()}
      onKeyDown={(event) => event.stopPropagation()}
    >
      <span className="sr-only">Staða</span>
      <select
        value={task.status}
        onChange={(event) => onChange(event.target.value as TaskStatus)}
        className={cn(
          "h-9 rounded-md border px-2 text-sm font-semibold outline-none transition focus:ring-2",
          getStatusSelectTone(task.status)
        )}
        aria-label={`Staða fyrir ${task.title}`}
      >
        {Object.entries(statusLabels).map(([value, label]) => (
          <option key={value} value={value}>{label}</option>
        ))}
      </select>
    </label>
  );
}

function PrintableGroup({ group, data, pageTitle }: { group: PrintGroup; data: AppData; pageTitle: string }) {
  const generatedAt = new Intl.DateTimeFormat("is-IS", { dateStyle: "medium", timeStyle: "short" }).format(new Date());

  if (group.mode === "simple") {
    return <PrintableSimpleGroup group={group} data={data} generatedAt={generatedAt} pageTitle={pageTitle} />;
  }

  return (
    <section className="print-only print-report bg-white p-7 text-ink">
      <div className="border-b-2 border-slate-900 pb-5">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">PDF skýrsla</p>
        <h1 className="mt-1 text-3xl font-bold">{pageTitle}</h1>
        <div className="mt-4 grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
          <PrintDetail label="Gata" value={group.locationName} />
          <PrintDetail label="Íbúð" value={group.unitName} />
          <PrintDetail label="Staða" value={group.statusFilterName ?? "Öll atriði"} />
          <PrintDetail label="Ábyrgðaraðili" value={group.responsiblePartyName ?? "Allir"} />
          <PrintDetail label="Tegund" value={INSPECTION_TYPE_NAME} />
          <PrintDetail label="Útbúin" value={`${generatedAt} · ${group.tasks.length} atriði`} />
        </div>
      </div>

      <div className="mt-6 grid gap-5">
        {group.tasks.map((task, index) => {
          const row = getTaskRow(task, data);
          const images = data.task_images.filter((image) => image.task_id === task.id);
          return (
            <article key={task.id} className="print-break-inside-avoid bg-white">
              <div className="min-h-[360px] border-l-4 border-l-blue-600 px-5 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Atriði {index + 1}</p>
                    <h2 className="mt-1 text-xl font-bold text-ink">{task.title}</h2>
                  </div>
                  <span className="shrink-0 rounded-full border border-blue-100 bg-white px-3 py-1 text-xs font-bold text-slate-700 shadow-sm">{statusLabels[task.status]}</span>
                </div>

                <div className="mt-4 grid gap-5 text-sm sm:grid-cols-[190px_1fr]">
                  <div className="border border-slate-900">
                    <PrintBoxRow label="Íbúð / rými" value={row.unit} />
                    <PrintBoxRow label="Staðsetning" value={row.section} />
                    <PrintBoxRow label="Ábyrgðaraðili" value={row.assignee ?? "Óúthlutað"} />
                  </div>

                  <div className="min-h-16 border border-slate-900 px-3 py-2">
                    <p className="font-bold text-slate-900">Lýsing</p>
                    <p className="mt-1 whitespace-pre-wrap leading-6 text-slate-700">{task.description || "Engin lýsing skráð."}</p>
                  </div>
                </div>

                {images.length > 0 ? (
                  <div className="mt-7">
                    <p className="mb-3 text-base font-bold text-slate-900">Myndir</p>
                    <div className="grid gap-5 sm:grid-cols-2">
                      {images.map((image, imageIndex) => (
                        <figure key={image.id} className="w-52">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={group.printImageUrls?.[image.id] ?? image.image_url}
                            alt={`Mynd ${imageIndex + 1} fyrir ${task.title}`}
                            className="h-48 w-48 object-contain"
                            crossOrigin="anonymous"
                          />
                          <figcaption className="mt-2 px-3 text-xs font-semibold text-slate-600">Mynd {imageIndex + 1}</figcaption>
                        </figure>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function PrintableSimpleGroup({
  group,
  data,
  generatedAt,
  pageTitle
}: {
  group: PrintGroup;
  data: AppData;
  generatedAt: string;
  pageTitle: string;
}) {
  const unitGroups = getSimplePrintUnitGroups(group.tasks, data);

  return (
    <section className="print-only print-report bg-white p-6 text-ink">
      <div className="border-b-2 border-slate-900 pb-4">
        <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Einföld skýrsla</p>
        <h1 className="mt-1 text-2xl font-bold">{pageTitle}</h1>
        <div className="mt-3 grid gap-2 text-xs text-slate-700 sm:grid-cols-2">
          <PrintDetail label="Gata" value={group.locationName} />
          <PrintDetail label="Íbúð" value={group.unitName} />
          <PrintDetail label="Staða" value={group.statusFilterName ?? "Öll atriði"} />
          <PrintDetail label="Ábyrgðaraðili" value={group.responsiblePartyName ?? "Allir"} />
          <PrintDetail label="Tegund" value={INSPECTION_TYPE_NAME} />
          <PrintDetail label="Útbúin" value={`${generatedAt} · ${group.tasks.length} atriði`} />
        </div>
      </div>

      <div className="mt-5 grid gap-5">
        {unitGroups.map((unitGroup) => (
          <section key={unitGroup.unitName} className="print-break-inside-avoid">
            <div className="border border-slate-900 bg-white px-3 py-2 text-slate-950">
              <h2 className="text-base font-bold">{unitGroup.unitName}</h2>
              <p className="mt-0.5 text-xs font-semibold text-slate-700">{unitGroup.tasks.length} atriði</p>
            </div>
            <table className="w-full border-collapse border-x border-b border-slate-900 text-left text-[10px] leading-tight">
              <thead>
                <tr className="bg-slate-100 text-[9px] font-bold uppercase text-slate-600">
                  <SimplePrintTh>Rými</SimplePrintTh>
                  <SimplePrintTh>Titill</SimplePrintTh>
                  <SimplePrintTh>Lýsing</SimplePrintTh>
                  <SimplePrintTh>Flokkur</SimplePrintTh>
                  <SimplePrintTh>Ábyrgðaraðili</SimplePrintTh>
                  <SimplePrintTh>Staða</SimplePrintTh>
                </tr>
              </thead>
              <tbody>
                {unitGroup.tasks.map((task) => {
                  const row = getTaskRow(task, data);
                  return (
                    <tr key={task.id} className={cn("border-t border-slate-300", task.priority === "urgent" ? "bg-red-50 text-red-950" : undefined)}>
                      <SimplePrintTd>{row.section}</SimplePrintTd>
                      <SimplePrintTd className="font-bold text-slate-900">{task.title}</SimplePrintTd>
                      <SimplePrintTd>{task.description || "-"}</SimplePrintTd>
                      <SimplePrintTd>{row.category}</SimplePrintTd>
                      <SimplePrintTd>{row.assignee ?? "Óúthlutað"}</SimplePrintTd>
                      <SimplePrintTd>{statusLabels[task.status]}</SimplePrintTd>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>
        ))}
      </div>
    </section>
  );
}

function PrintDetail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-semibold text-slate-500">{label}</dt>
      <dd className="mt-0.5 font-bold text-slate-800">{value}</dd>
    </div>
  );
}

function PrintBoxRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[1fr_auto] gap-3 px-2 py-2 text-sm leading-tight [&+&]:border-t [&+&]:border-slate-900">
      <dt className="font-bold text-slate-700">{label}</dt>
      <dd className="font-bold text-slate-900">{value}</dd>
    </div>
  );
}

function SimplePrintTh({ children }: { children: React.ReactNode }) {
  return <th className="border-r border-slate-300 px-2 py-1.5 align-top last:border-r-0">{children}</th>;
}

function SimplePrintTd({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={cn("border-r border-slate-200 px-2 py-1.5 align-top text-slate-700 last:border-r-0", className)}>{children}</td>;
}

function getTaskRow(task: Task, data: AppData) {
  const runItem = task.inspection_run_item_id
    ? data.inspection_run_items.find((item) => item.id === task.inspection_run_item_id)
    : undefined;
  const checklistItem = runItem?.checklist_item_id
    ? data.inspection_checklist_items.find((item) => item.id === runItem.checklist_item_id)
    : undefined;

  return {
    unit: data.units.find((unit) => unit.id === task.unit_id)?.name ?? "-",
    section: checklistItem?.section ?? "-",
    category: data.categories.find((category) => category.id === task.category_id)?.name ?? "-",
    assignee: getTaskResponsiblePartyName(data, task)
  };
}

function getResponsibleFilterOptions(data: AppData, tasks: Task[]) {
  const counts = new Map<string, { count: number; name: string }>();

  tasks.forEach((task) => {
    const id = getResponsibleFilterId(task);
    const name = getTaskResponsiblePartyName(data, task) ?? "Óúthlutað";
    const current = counts.get(id);
    counts.set(id, { count: (current?.count ?? 0) + 1, name });
  });

  return Array.from(counts.entries())
    .map(([id, value]) => ({ id, ...value }))
    .sort((a, b) => a.name.localeCompare(b.name, "is", { sensitivity: "base", numeric: true }));
}

function getResponsibleFilterId(task: Task) {
  return task.responsible_party_id ?? task.assigned_to_user_id ?? "unassigned";
}

function getStatusFilterName(statusFilter: StatusFilter) {
  return statusFilter ? statusLabels[statusFilter] : "Öll atriði";
}

function getSimplePrintUnitGroups(tasks: Task[], data: AppData) {
  const groups = new Map<string, { tasks: Task[]; unitName: string }>();

  tasks.forEach((task) => {
    const unit = data.units.find((item) => item.id === task.unit_id);
    const key = unit?.id ?? `unknown-${task.unit_id}`;
    const current = groups.get(key);

    if (current) {
      current.tasks.push(task);
      return;
    }

    groups.set(key, {
      tasks: [task],
      unitName: unit?.name ?? "Óþekkt íbúð"
    });
  });

  return Array.from(groups.values());
}

function sortTasksForPrint(tasks: Task[], data: AppData) {
  return [...tasks].sort((a, b) => {
    const unitA = data.units.find((unit) => unit.id === a.unit_id);
    const unitB = data.units.find((unit) => unit.id === b.unit_id);
    const unitNumberSort = getUnitNumberSortValue(unitA?.name) - getUnitNumberSortValue(unitB?.name);
    if (unitNumberSort) return unitNumberSort;

    const unitNameSort = (unitA?.name ?? "").localeCompare(unitB?.name ?? "", "is", { sensitivity: "base", numeric: true });
    return unitNameSort || sortTasks(a, b);
  });
}

function getUnitNumberSortValue(unitName?: string) {
  const match = unitName?.match(/\d+/);
  return match ? Number(match[0]) : Number.MAX_SAFE_INTEGER;
}

function sortTasks(a: Task, b: Task) {
  const statusOrder: Record<TaskStatus, number> = { in_progress: 0, open: 1, done: 2 };
  return statusOrder[a.status] - statusOrder[b.status] || b.created_at.localeCompare(a.created_at);
}

function getStatusTone(status: TaskStatus) {
  const tones: Record<TaskStatus, string> = {
    open: "border-l-blue-500",
    in_progress: "border-l-amber-500",
    done: "border-l-emerald-500"
  };

  return tones[status];
}

function getTaskRowTone(task: Task) {
  if (task.priority === "urgent") {
    return "border-l-red-600 bg-red-50 hover:bg-red-100/80 focus:bg-red-100";
  }

  return cn(getStatusTone(task.status), "hover:bg-blue-50/50 focus:bg-blue-50");
}

function getTaskCardTone(task: Task) {
  if (task.priority === "urgent") {
    return "border-red-300 border-l-red-600 bg-red-50";
  }

  return cn("border-slate-200 bg-white", getStatusTone(task.status));
}

function getStatusSelectTone(status: TaskStatus) {
  const tones: Record<TaskStatus, string> = {
    open: "border-blue-200 bg-blue-50 text-blue-900 hover:border-blue-400 focus:border-blue-500 focus:ring-blue-200",
    in_progress: "border-amber-200 bg-amber-50 text-amber-950 hover:border-amber-400 focus:border-amber-500 focus:ring-amber-200",
    done: "border-emerald-200 bg-emerald-50 text-emerald-900 hover:border-emerald-400 focus:border-emerald-500 focus:ring-emerald-200"
  };

  return tones[status];
}

function normalize(value: string) {
  return value.trim().toLocaleLowerCase("is");
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-3">{children}</th>;
}

function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={cn("px-4 py-3 align-top text-slate-700", className)}>{children}</td>;
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-semibold text-slate-500">{label}</dt>
      <dd className="mt-0.5 font-bold text-slate-800">{value}</dd>
    </div>
  );
}

async function createPrintImageUrls(tasks: Task[], data: AppData) {
  const taskIds = new Set(tasks.map((task) => task.id));
  const images = data.task_images.filter((image) => taskIds.has(image.task_id));
  const entries = await Promise.all(
    images.map(async (image) => {
      const printUrl = await createPrintImageUrl(image.image_url);
      return printUrl ? [image.id, printUrl] as const : null;
    })
  );

  return Object.fromEntries(entries.filter((entry): entry is readonly [string, string] => Boolean(entry)));
}

function createPrintImageUrl(imageUrl: string) {
  return new Promise<string | null>((resolve) => {
    const image = new Image();
    const timeout = window.setTimeout(() => resolve(null), 8000);

    image.crossOrigin = "anonymous";
    image.onload = () => {
      window.clearTimeout(timeout);
      try {
        const maxSize = 900;
        const scale = Math.min(1, maxSize / Math.max(image.naturalWidth, image.naturalHeight));
        const width = Math.max(1, Math.round(image.naturalWidth * scale));
        const height = Math.max(1, Math.round(image.naturalHeight * scale));
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        canvas.getContext("2d")?.drawImage(image, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.72));
      } catch (error) {
        console.error(error);
        resolve(null);
      }
    };
    image.onerror = () => {
      window.clearTimeout(timeout);
      resolve(null);
    };
    image.src = imageUrl;
  });
}

function waitForNextFrame() {
  return new Promise<void>((resolve) => {
    window.requestAnimationFrame(() => resolve());
  });
}

function waitForImage(image: HTMLImageElement) {
  if (image.complete) return Promise.resolve();

  return new Promise<void>((resolve) => {
    const timeout = window.setTimeout(done, 5000);

    function done() {
      window.clearTimeout(timeout);
      image.removeEventListener("load", done);
      image.removeEventListener("error", done);
      resolve();
    }

    image.addEventListener("load", done);
    image.addEventListener("error", done);
  });
}
