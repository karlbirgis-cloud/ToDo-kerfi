import type { AccessScope, TaskPriority, TaskStatus, UnitType, UserRole } from "./types";

export const roleLabels: Record<UserRole, string> = {
  admin: "Admin",
  manager: "Verkstjóri",
  worker: "Starfsmaður",
  contractor: "Verktaki",
  viewer: "Lesaðgangur"
};

export const accessScopeLabels: Record<AccessScope, string> = {
  all: "Allt kerfið",
  company: "Fyrirtæki",
  project: "Valin verkefni"
};

export const unitTypeLabels: Record<UnitType, string> = {
  apartment: "Íbúð",
  common_area: "Sameign",
  stairwell: "Stigahús",
  technical_room: "Tæknirými",
  storage: "Geymsla",
  garage: "Bílakjallari",
  roof: "Þak",
  outdoor: "Utanhúss",
  other: "Annað"
};

export const statusLabels: Record<TaskStatus, string> = {
  open: "Ólokið",
  in_progress: "Í vinnslu",
  done: "Lokið"
};

export const priorityLabels: Record<TaskPriority, string> = {
  low: "Lágur",
  medium: "Miðlungs",
  high: "Hár",
  urgent: "Áríðandi"
};

export const statusTone: Record<TaskStatus, string> = {
  open: "bg-blue-50 text-blue-800 ring-blue-200",
  in_progress: "bg-amber-50 text-amber-900 ring-amber-200",
  done: "bg-emerald-50 text-emerald-800 ring-emerald-200"
};

export const priorityTone: Record<TaskPriority, string> = {
  low: "bg-slate-100 text-slate-700 ring-slate-200",
  medium: "bg-blue-50 text-blue-800 ring-blue-200",
  high: "bg-orange-50 text-orange-800 ring-orange-200",
  urgent: "bg-red-50 text-red-800 ring-red-200"
};
