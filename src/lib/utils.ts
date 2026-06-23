import type { AppData, Task, TaskStatus } from "./types";

export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function todayIso() {
  return new Date().toISOString();
}

export function makeId(prefix: string) {
  return `${prefix}_${crypto.randomUUID()}`;
}

export function percent(done: number, total: number) {
  if (total === 0) return 0;
  return Math.round((done / total) * 100);
}

export function summarizeTasks(tasks: Task[]) {
  const count = (status: TaskStatus) => tasks.filter((task) => task.status === status).length;
  const done = count("done");
  return {
    total: tasks.length,
    open: count("open"),
    in_progress: count("in_progress"),
    done,
    progress: percent(done, tasks.length)
  };
}

export function isOverdue(task: Task) {
  return Boolean(task.due_date && task.status !== "done" && new Date(task.due_date) < new Date());
}

export function tasksFor(data: AppData, scope: Partial<Pick<Task, "project_id" | "location_id" | "unit_id" | "category_id" | "subcategory_id">>) {
  return data.tasks.filter((task) =>
    Object.entries(scope).every(([key, value]) => !value || task[key as keyof Task] === value)
  );
}

export function getTaskResponsiblePartyName(data: AppData, task: Task) {
  return (
    data.responsible_parties.find((party) => party.id === task.responsible_party_id)?.name ??
    data.profiles.find((profile) => profile.id === task.assigned_to_user_id)?.name
  );
}

export function formatDate(value?: string) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("is-IS", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}
