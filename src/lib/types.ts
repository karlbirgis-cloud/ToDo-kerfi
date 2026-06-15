export type UserRole = "admin" | "manager" | "worker" | "contractor" | "viewer";
export type ProjectStatus = "active" | "paused" | "done";
export type UnitType =
  | "apartment"
  | "common_area"
  | "stairwell"
  | "technical_room"
  | "storage"
  | "garage"
  | "roof"
  | "outdoor"
  | "other";
export type TaskStatus = "open" | "in_progress" | "done";
export type TaskPriority = "low" | "medium" | "high" | "urgent";

export type Profile = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  work_scope?: string;
  employer?: string;
  role: UserRole;
  company_id: string;
  created_at: string;
  updated_at: string;
};

export type Company = { id: string; name: string; created_at: string };

export type Project = {
  id: string;
  company_id: string;
  project_number: string;
  name: string;
  full_name: string;
  status: ProjectStatus;
  created_at: string;
  updated_at: string;
};

export type Location = {
  id: string;
  project_id: string;
  name: string;
  description?: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type Unit = {
  id: string;
  project_id: string;
  location_id: string;
  name: string;
  unit_type: UnitType;
  floor?: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type Category = {
  id: string;
  name: string;
  sort_order: number;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type Subcategory = {
  id: string;
  category_id: string;
  name: string;
  sort_order: number;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type UnitCategory = {
  id: string;
  unit_id: string;
  category_id: string;
  sort_order: number;
  created_at: string;
};

export type UnitSubcategory = {
  id: string;
  unit_id: string;
  category_id: string;
  subcategory_id: string;
  sort_order: number;
  created_at: string;
};

export type Task = {
  id: string;
  company_id: string;
  project_id: string;
  location_id: string;
  unit_id: string;
  category_id: string;
  subcategory_id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigned_to_user_id?: string;
  created_by_user_id: string;
  due_date?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
};

export type TaskImage = {
  id: string;
  task_id: string;
  image_url: string;
  storage_path: string;
  uploaded_by_user_id: string;
  created_at: string;
};

export type FloorPlan = {
  id: string;
  project_id: string;
  name: string;
  image_url: string;
  storage_path: string;
  uploaded_by_user_id: string;
  created_at: string;
  updated_at: string;
};

export type TaskPlanMarker = {
  id: string;
  task_id: string;
  floor_plan_id: string;
  x_percent: number;
  y_percent: number;
  created_at: string;
  updated_at: string;
};

export type TaskComment = {
  id: string;
  task_id: string;
  user_id: string;
  comment: string;
  created_at: string;
};

export type TaskStatusHistory = {
  id: string;
  task_id: string;
  old_status?: TaskStatus;
  new_status: TaskStatus;
  changed_by_user_id: string;
  created_at: string;
};

export type TaskActivityLog = {
  id: string;
  task_id: string;
  user_id: string;
  action: string;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type AppData = {
  companies: Company[];
  profiles: Profile[];
  projects: Project[];
  locations: Location[];
  units: Unit[];
  categories: Category[];
  subcategories: Subcategory[];
  unit_categories: UnitCategory[];
  unit_subcategories: UnitSubcategory[];
  tasks: Task[];
  task_images: TaskImage[];
  floor_plans: FloorPlan[];
  task_plan_markers: TaskPlanMarker[];
  task_comments: TaskComment[];
  task_status_history: TaskStatusHistory[];
  task_activity_log: TaskActivityLog[];
};
