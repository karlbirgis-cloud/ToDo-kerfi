import type { AppData } from "@/lib/types";
import { percent, summarizeTasks, tasksFor } from "@/lib/utils";

export function getDashboardStats(data: AppData) {
  return summarizeTasks(data.tasks);
}

export function getProjectProgress(data: AppData, projectId: string) {
  return summarizeTasks(tasksFor(data, { project_id: projectId })).progress;
}

export function getLocationProgress(data: AppData, locationId: string) {
  return summarizeTasks(tasksFor(data, { location_id: locationId })).progress;
}

export function getUnitProgress(data: AppData, unitId: string) {
  return summarizeTasks(tasksFor(data, { unit_id: unitId })).progress;
}

export function getCategoryProgress(data: AppData, unitId: string, categoryId: string) {
  const tasks = tasksFor(data, { unit_id: unitId, category_id: categoryId });
  return percent(tasks.filter((task) => task.status === "done").length, tasks.length);
}
