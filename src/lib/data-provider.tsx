"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "./auth-provider";
import { initialData } from "./mock-data";
import { hasSupabaseEnv } from "./supabase/client";
import type { AppData, Profile, Task, TaskStatus, Unit, UnitType } from "./types";
import { makeId, todayIso } from "./utils";

type NewProjectInput = { project_number: string; name: string };
type NewLocationInput = { project_id: string; name: string; description?: string };
type NewUnitInput = { project_id: string; location_id: string; name: string; unit_type: UnitType; floor?: string };
type NewProfileInput = Pick<Profile, "name" | "email" | "role" | "company_id"> & Partial<Pick<Profile, "id" | "phone" | "work_scope" | "employer">>;
type NewTaskInput = Pick<Task, "project_id" | "location_id" | "unit_id" | "category_id" | "subcategory_id" | "title"> &
  Partial<Pick<Task, "description" | "priority" | "assigned_to_user_id" | "due_date">>;
type NewTaskPlanMarkerInput = { task_id: string; floor_plan_id: string; x_percent: number; y_percent: number };

type DataContextValue = {
  data: AppData;
  currentUserId: string;
  createProject(input: NewProjectInput): string;
  createLocation(input: NewLocationInput): string;
  createUnit(input: NewUnitInput): string;
  createUnitsBulk(input: NewUnitInput & { names: string[] }): string[];
  updateUnit(unitId: string, patch: Partial<Pick<Unit, "name">>): void;
  createProfile(input: NewProfileInput): string;
  createTask(input: NewTaskInput): string;
  updateTask(taskId: string, patch: Partial<Task>): void;
  updateTaskStatus(taskId: string, status: TaskStatus): void;
  completeTask(taskId: string): void;
  reopenTask(taskId: string): void;
  deleteTask(taskId: string): void;
  addComment(taskId: string, comment: string): void;
  addTaskImages(taskId: string, files: FileList | File[]): Promise<void>;
  deleteTaskImage(imageId: string): Promise<void>;
  addFloorPlan(projectId: string, name: string, file: File): Promise<string>;
  createTaskPlanMarker(input: NewTaskPlanMarkerInput): string;
  resetDemoData(): void;
};

const DataContext = createContext<DataContextValue | null>(null);
const storageKey = "todo-kerfi-bryggjuhverfi-data-v3";

function hydrateData(): AppData {
  if (typeof window === "undefined") return initialData;
  const saved = window.localStorage.getItem(storageKey);
  return normalizeTaskStatuses(saved ? (JSON.parse(saved) as AppData) : initialData);
}

function normalizeTaskStatuses(data: AppData): AppData {
  return {
    ...data,
    floor_plans: data.floor_plans ?? [],
    task_plan_markers: data.task_plan_markers ?? [],
    tasks: data.tasks.map((task) => ({
      ...task,
      status: task.status === ("blocked" as TaskStatus) ? "open" : task.status
    })),
    task_status_history: data.task_status_history.map((item) => ({
      ...item,
      old_status: item.old_status === ("blocked" as TaskStatus) ? "open" : item.old_status,
      new_status: item.new_status === ("blocked" as TaskStatus) ? "open" : item.new_status
    }))
  };
}

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [data, setData] = useState<AppData>(initialData);
  const [isReady, setIsReady] = useState(false);
  const [persistenceMode, setPersistenceMode] = useState<"cloud" | "local">(hasSupabaseEnv ? "cloud" : "local");
  const currentUserId =
    data.profiles.find((profile) => profile.email.toLowerCase() === user?.email?.toLowerCase())?.id ??
    user?.id ??
    "user_manager";
  const useCloudData = hasSupabaseEnv;

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      if (!useCloudData) {
        if (isMounted) {
          setData(hydrateData());
          setPersistenceMode("local");
          setIsReady(true);
        }
        return;
      }

      try {
        const response = await fetch("/api/app-data", { cache: "no-store" });
        if (!response.ok) throw new Error("Cloud data could not be loaded.");
        const payload = (await response.json()) as { data: AppData };
        if (isMounted) {
          setData(normalizeTaskStatuses(payload.data));
          setPersistenceMode("cloud");
        }
      } catch (error) {
        console.error(error);
        if (isMounted) {
          setData(hydrateData());
          setPersistenceMode("local");
        }
      } finally {
        if (isMounted) setIsReady(true);
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [useCloudData]);

  useEffect(() => {
    if (!isReady) return;

    if (persistenceMode === "local") {
      if (typeof window !== "undefined") window.localStorage.setItem(storageKey, JSON.stringify(data));
      return;
    }

    const timeout = window.setTimeout(() => {
      fetch("/api/app-data", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data })
      }).catch((error) => console.error(error));
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [data, isReady, persistenceMode]);

  const value = useMemo<DataContextValue>(() => {
    function createDefaultStructureForUnit(nextData: AppData, unitId: string) {
      nextData.categories
        .filter((category) => category.is_default && category.is_active)
        .forEach((category) => {
          const exists = nextData.unit_categories.some((item) => item.unit_id === unitId && item.category_id === category.id);
          if (!exists) nextData.unit_categories.push({ id: makeId("uc"), unit_id: unitId, category_id: category.id, sort_order: category.sort_order, created_at: todayIso() });
        });

      nextData.subcategories
        .filter((subcategory) => subcategory.is_default && subcategory.is_active)
        .forEach((subcategory) => {
          const exists = nextData.unit_subcategories.some((item) => item.unit_id === unitId && item.subcategory_id === subcategory.id);
          if (!exists) {
            nextData.unit_subcategories.push({
              id: makeId("us"),
              unit_id: unitId,
              category_id: subcategory.category_id,
              subcategory_id: subcategory.id,
              sort_order: subcategory.sort_order,
              created_at: todayIso()
            });
          }
        });
    }

    function update(mutator: (draft: AppData) => void) {
      setData((current) => {
        const draft = structuredClone(current);
        mutator(draft);
        return draft;
      });
    }

    return {
      data,
      currentUserId,
      createProject(input) {
        const id = makeId("project");
        update((draft) => {
          draft.projects.push({
            id,
            company_id: "company_1",
            project_number: input.project_number,
            name: input.name,
            full_name: `${input.project_number} - ${input.name}`,
            status: "active",
            created_at: todayIso(),
            updated_at: todayIso()
          });
        });
        return id;
      },
      createLocation(input) {
        const id = makeId("location");
        update((draft) => {
          const sortOrder = draft.locations.filter((item) => item.project_id === input.project_id).length + 1;
          draft.locations.push({ id, ...input, sort_order: sortOrder, created_at: todayIso(), updated_at: todayIso() });
        });
        return id;
      },
      createUnit(input) {
        const id = makeId("unit");
        update((draft) => {
          const sortOrder = draft.units.filter((item) => item.location_id === input.location_id).length + 1;
          draft.units.push({ id, ...input, sort_order: sortOrder, created_at: todayIso(), updated_at: todayIso() });
          createDefaultStructureForUnit(draft, id);
        });
        return id;
      },
      createUnitsBulk(input) {
        const ids = input.names.filter(Boolean).map(() => makeId("unit"));
        update((draft) => {
          const currentCount = draft.units.filter((item) => item.location_id === input.location_id).length;
          input.names.filter(Boolean).forEach((name, index) => {
            const id = ids[index];
            draft.units.push({
              id,
              project_id: input.project_id,
              location_id: input.location_id,
              name,
              unit_type: input.unit_type,
              floor: input.floor,
              sort_order: currentCount + index + 1,
              created_at: todayIso(),
              updated_at: todayIso()
            });
            createDefaultStructureForUnit(draft, id);
          });
        });
        return ids;
      },
      updateUnit(unitId, patch) {
        update((draft) => {
          const unit = draft.units.find((item) => item.id === unitId);
          if (!unit) return;

          if (typeof patch.name === "string") {
            const nextName = patch.name.trim();
            if (nextName) unit.name = nextName;
          }

          unit.updated_at = todayIso();
        });
      },
      createProfile(input) {
        const id = input.id ?? makeId("user");
        update((draft) => {
          draft.profiles.push({
            id,
            name: input.name,
            email: input.email,
            phone: input.phone,
            work_scope: input.work_scope,
            employer: input.employer,
            role: input.role,
            company_id: input.company_id,
            created_at: todayIso(),
            updated_at: todayIso()
          });
        });
        return id;
      },
      createTask(input) {
        const id = makeId("task");
        update((draft) => {
          draft.tasks.push({
            id,
            company_id: "company_1",
            project_id: input.project_id,
            location_id: input.location_id,
            unit_id: input.unit_id,
            category_id: input.category_id,
            subcategory_id: input.subcategory_id,
            title: input.title,
            description: input.description,
            status: "open",
            priority: input.priority ?? "medium",
            assigned_to_user_id: input.assigned_to_user_id,
            created_by_user_id: currentUserId,
            due_date: input.due_date,
            created_at: todayIso(),
            updated_at: todayIso()
          });
          draft.task_activity_log.push({ id: makeId("log"), task_id: id, user_id: currentUserId, action: "created", metadata: {}, created_at: todayIso() });
        });
        return id;
      },
      updateTask(taskId, patch) {
        update((draft) => {
          const task = draft.tasks.find((item) => item.id === taskId);
          if (task) Object.assign(task, patch, { updated_at: todayIso() });
        });
      },
      updateTaskStatus(taskId, status) {
        update((draft) => {
          const task = draft.tasks.find((item) => item.id === taskId);
          if (!task || task.status === status) return;
          const oldStatus = task.status;
          task.status = status;
          task.completed_at = status === "done" ? todayIso() : undefined;
          task.updated_at = todayIso();
          draft.task_status_history.push({ id: makeId("history"), task_id: taskId, old_status: oldStatus, new_status: status, changed_by_user_id: currentUserId, created_at: todayIso() });
          draft.task_activity_log.push({ id: makeId("log"), task_id: taskId, user_id: currentUserId, action: "status_changed", metadata: { oldStatus, status }, created_at: todayIso() });
        });
      },
      completeTask(taskId) {
        update((draft) => {
          const task = draft.tasks.find((item) => item.id === taskId);
          if (!task || task.status === "done") return;
          const oldStatus = task.status;
          task.status = "done";
          task.completed_at = todayIso();
          task.updated_at = todayIso();
          draft.task_status_history.push({ id: makeId("history"), task_id: taskId, old_status: oldStatus, new_status: "done", changed_by_user_id: currentUserId, created_at: todayIso() });
          draft.task_activity_log.push({ id: makeId("log"), task_id: taskId, user_id: currentUserId, action: "status_changed", metadata: { oldStatus, status: "done" }, created_at: todayIso() });
        });
      },
      reopenTask(taskId) {
        update((draft) => {
          const task = draft.tasks.find((item) => item.id === taskId);
          if (!task || task.status === "open") return;
          const oldStatus = task.status;
          task.status = "open";
          task.completed_at = undefined;
          task.updated_at = todayIso();
          draft.task_status_history.push({ id: makeId("history"), task_id: taskId, old_status: oldStatus, new_status: "open", changed_by_user_id: currentUserId, created_at: todayIso() });
          draft.task_activity_log.push({ id: makeId("log"), task_id: taskId, user_id: currentUserId, action: "status_changed", metadata: { oldStatus, status: "open" }, created_at: todayIso() });
        });
      },
      deleteTask(taskId) {
        update((draft) => {
          draft.tasks = draft.tasks.filter((task) => task.id !== taskId);
          draft.task_images = draft.task_images.filter((image) => image.task_id !== taskId);
          draft.task_comments = draft.task_comments.filter((comment) => comment.task_id !== taskId);
          draft.task_plan_markers = draft.task_plan_markers.filter((marker) => marker.task_id !== taskId);
        });
      },
      addComment(taskId, comment) {
        update((draft) => {
          draft.task_comments.push({ id: makeId("comment"), task_id: taskId, user_id: currentUserId, comment, created_at: todayIso() });
          draft.task_activity_log.push({ id: makeId("log"), task_id: taskId, user_id: currentUserId, action: "comment_created", metadata: {}, created_at: todayIso() });
        });
      },
      async addTaskImages(taskId, files) {
        const fileList = Array.from(files);
        if (fileList.length === 0) return;

        if (persistenceMode === "cloud") {
          const formData = new FormData();
          formData.set("taskId", taskId);
          fileList.forEach((file) => formData.append("files", file));

          const response = await fetch("/api/task-images", {
            method: "POST",
            body: formData
          });
          if (!response.ok) throw new Error("Image upload failed.");

          const payload = (await response.json()) as { images: Array<{ image_url: string; storage_path: string }> };
          update((draft) => {
            payload.images.forEach((image) => {
              draft.task_images.push({
                id: makeId("image"),
                task_id: taskId,
                image_url: image.image_url,
                storage_path: image.storage_path,
                uploaded_by_user_id: currentUserId,
                created_at: todayIso()
              });
            });
          });
          return;
        }

        update((draft) => {
          fileList.forEach((file) => {
            draft.task_images.push({
              id: makeId("image"),
              task_id: taskId,
              image_url: URL.createObjectURL(file),
              storage_path: `local/${taskId}/${file.name}`,
              uploaded_by_user_id: currentUserId,
              created_at: todayIso()
            });
          });
        });
      },
      async deleteTaskImage(imageId) {
        const image = data.task_images.find((item) => item.id === imageId);
        if (!image) return;

        if (persistenceMode === "cloud") {
          const response = await fetch("/api/task-images", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ storagePath: image.storage_path })
          });
          if (!response.ok) throw new Error("Image delete failed.");
        } else if (image.image_url.startsWith("blob:")) {
          URL.revokeObjectURL(image.image_url);
        }

        update((draft) => {
          draft.task_images = draft.task_images.filter((item) => item.id !== imageId);
        });
      },
      async addFloorPlan(projectId, name, file) {
        const id = makeId("plan");
        const trimmedName = name.trim() || file.name.replace(/\.[^.]+$/, "") || "Grunnmynd";

        if (persistenceMode === "cloud") {
          const formData = new FormData();
          formData.set("projectId", projectId);
          formData.set("name", trimmedName);
          formData.set("file", file);

          const response = await fetch("/api/floor-plan-images", {
            method: "POST",
            body: formData
          });
          if (!response.ok) throw new Error("Floor plan upload failed.");

          const payload = (await response.json()) as { image_url: string; mime_type?: string; storage_path: string };
          update((draft) => {
            draft.floor_plans.push({
              id,
              project_id: projectId,
              name: trimmedName,
              image_url: payload.image_url,
              mime_type: payload.mime_type ?? file.type,
              storage_path: payload.storage_path,
              uploaded_by_user_id: currentUserId,
              created_at: todayIso(),
              updated_at: todayIso()
            });
          });
          return id;
        }

        update((draft) => {
          draft.floor_plans.push({
            id,
            project_id: projectId,
            name: trimmedName,
            image_url: URL.createObjectURL(file),
            mime_type: file.type,
            storage_path: `local/floor-plans/${projectId}/${file.name}`,
            uploaded_by_user_id: currentUserId,
            created_at: todayIso(),
            updated_at: todayIso()
          });
        });
        return id;
      },
      createTaskPlanMarker(input) {
        const id = makeId("marker");
        update((draft) => {
          draft.task_plan_markers = draft.task_plan_markers.filter((marker) => marker.task_id !== input.task_id);
          draft.task_plan_markers.push({
            id,
            task_id: input.task_id,
            floor_plan_id: input.floor_plan_id,
            x_percent: input.x_percent,
            y_percent: input.y_percent,
            created_at: todayIso(),
            updated_at: todayIso()
          });
        });
        return id;
      },
      resetDemoData() {
        setData(initialData);
      }
    };
  }, [currentUserId, data, persistenceMode]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useAppData() {
  const context = useContext(DataContext);
  if (!context) throw new Error("useAppData must be used inside DataProvider");
  return context;
}
