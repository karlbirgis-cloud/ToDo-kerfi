create extension if not exists "pgcrypto";

create type user_role as enum ('admin', 'manager', 'worker', 'contractor', 'viewer');
create type project_status as enum ('active', 'paused', 'done');
create type unit_type as enum ('apartment', 'common_area', 'stairwell', 'technical_room', 'storage', 'garage', 'roof', 'outdoor', 'other');
create type task_status as enum ('open', 'in_progress', 'blocked', 'done');
create type task_priority as enum ('low', 'medium', 'high', 'urgent');

create table companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null,
  phone text,
  work_scope text,
  employer text,
  role user_role not null default 'worker',
  company_id uuid not null references companies(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table projects (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  project_number text not null,
  name text not null,
  full_name text generated always as (project_number || ' - ' || name) stored,
  status project_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table locations (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  name text not null,
  description text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table units (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  location_id uuid not null references locations(id) on delete cascade,
  name text not null,
  unit_type unit_type not null default 'apartment',
  floor text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  sort_order integer not null default 0,
  is_default boolean not null default true,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table subcategories (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references categories(id) on delete cascade,
  name text not null,
  sort_order integer not null default 0,
  is_default boolean not null default true,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table unit_categories (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid not null references units(id) on delete cascade,
  category_id uuid not null references categories(id) on delete cascade,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (unit_id, category_id)
);

create table unit_subcategories (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid not null references units(id) on delete cascade,
  category_id uuid not null references categories(id) on delete cascade,
  subcategory_id uuid not null references subcategories(id) on delete cascade,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (unit_id, subcategory_id)
);

create table tasks (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  project_id uuid not null references projects(id) on delete cascade,
  location_id uuid not null references locations(id) on delete cascade,
  unit_id uuid not null references units(id) on delete cascade,
  category_id uuid not null references categories(id),
  subcategory_id uuid not null references subcategories(id),
  title text not null,
  description text,
  status task_status not null default 'open',
  priority task_priority not null default 'medium',
  assigned_to_user_id uuid references profiles(id) on delete set null,
  created_by_user_id uuid not null references profiles(id) on delete restrict,
  due_date date,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table task_images (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references tasks(id) on delete cascade,
  image_url text not null,
  storage_path text not null,
  uploaded_by_user_id uuid not null references profiles(id) on delete restrict,
  created_at timestamptz not null default now()
);

create table task_comments (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references tasks(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete restrict,
  comment text not null,
  created_at timestamptz not null default now()
);

create table task_status_history (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references tasks(id) on delete cascade,
  old_status task_status,
  new_status task_status not null,
  changed_by_user_id uuid not null references profiles(id) on delete restrict,
  created_at timestamptz not null default now()
);

create table task_activity_log (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references tasks(id) on delete cascade,
  user_id uuid not null references profiles(id) on delete restrict,
  action text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index idx_projects_company on projects(company_id);
create index idx_locations_project on locations(project_id);
create index idx_units_location on units(location_id);
create index idx_tasks_scope on tasks(company_id, project_id, location_id, unit_id, category_id, subcategory_id);
create index idx_tasks_assigned on tasks(assigned_to_user_id);
create index idx_tasks_status_due on tasks(status, due_date);

create or replace function touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_touch_updated before update on profiles for each row execute function touch_updated_at();
create trigger projects_touch_updated before update on projects for each row execute function touch_updated_at();
create trigger locations_touch_updated before update on locations for each row execute function touch_updated_at();
create trigger units_touch_updated before update on units for each row execute function touch_updated_at();
create trigger categories_touch_updated before update on categories for each row execute function touch_updated_at();
create trigger subcategories_touch_updated before update on subcategories for each row execute function touch_updated_at();
create trigger tasks_touch_updated before update on tasks for each row execute function touch_updated_at();

create or replace function create_default_structure_for_unit(target_unit_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into unit_categories (unit_id, category_id, sort_order)
  select target_unit_id, c.id, c.sort_order
  from categories c
  where c.is_default = true and c.is_active = true
  on conflict (unit_id, category_id) do nothing;

  insert into unit_subcategories (unit_id, category_id, subcategory_id, sort_order)
  select target_unit_id, s.category_id, s.id, s.sort_order
  from subcategories s
  join categories c on c.id = s.category_id
  where s.is_default = true and s.is_active = true and c.is_active = true
  on conflict (unit_id, subcategory_id) do nothing;
end;
$$;

create or replace function public.app_current_company_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select company_id from profiles where id = auth.uid()
$$;

create or replace function public.app_current_role()
returns user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from profiles where id = auth.uid()
$$;

alter table companies enable row level security;
alter table profiles enable row level security;
alter table projects enable row level security;
alter table locations enable row level security;
alter table units enable row level security;
alter table categories enable row level security;
alter table subcategories enable row level security;
alter table unit_categories enable row level security;
alter table unit_subcategories enable row level security;
alter table tasks enable row level security;
alter table task_images enable row level security;
alter table task_comments enable row level security;
alter table task_status_history enable row level security;
alter table task_activity_log enable row level security;

create policy companies_select_same_company on companies for select using (id = public.app_current_company_id());
create policy profiles_select_same_company on profiles for select using (company_id = public.app_current_company_id());
create policy profiles_admin_write on profiles for all using (company_id = public.app_current_company_id() and public.app_current_role() = 'admin') with check (company_id = public.app_current_company_id() and public.app_current_role() = 'admin');

create policy projects_select_company on projects for select using (company_id = public.app_current_company_id());
create policy projects_write_admin_manager on projects for all using (company_id = public.app_current_company_id() and public.app_current_role() in ('admin', 'manager')) with check (company_id = public.app_current_company_id() and public.app_current_role() in ('admin', 'manager'));

create policy locations_select_company on locations for select using (exists (select 1 from public.projects p where p.id = project_id and p.company_id = public.app_current_company_id()));
create policy locations_write_admin_manager on locations for all using (public.app_current_role() in ('admin', 'manager') and exists (select 1 from public.projects p where p.id = project_id and p.company_id = public.app_current_company_id())) with check (public.app_current_role() in ('admin', 'manager') and exists (select 1 from public.projects p where p.id = project_id and p.company_id = public.app_current_company_id()));

create policy units_select_company on units for select using (exists (select 1 from public.projects p where p.id = project_id and p.company_id = public.app_current_company_id()));
create policy units_write_admin_manager on units for all using (public.app_current_role() in ('admin', 'manager') and exists (select 1 from public.projects p where p.id = project_id and p.company_id = public.app_current_company_id())) with check (public.app_current_role() in ('admin', 'manager') and exists (select 1 from public.projects p where p.id = project_id and p.company_id = public.app_current_company_id()));

create policy categories_read_auth on categories for select using (auth.uid() is not null);
create policy categories_write_admin on categories for all using (public.app_current_role() = 'admin') with check (public.app_current_role() = 'admin');
create policy subcategories_read_auth on subcategories for select using (auth.uid() is not null);
create policy subcategories_write_admin on subcategories for all using (public.app_current_role() = 'admin') with check (public.app_current_role() = 'admin');

create policy unit_categories_read_auth on unit_categories for select using (auth.uid() is not null);
create policy unit_categories_write_admin_manager on unit_categories for all using (public.app_current_role() in ('admin', 'manager')) with check (public.app_current_role() in ('admin', 'manager'));
create policy unit_subcategories_read_auth on unit_subcategories for select using (auth.uid() is not null);
create policy unit_subcategories_write_admin_manager on unit_subcategories for all using (public.app_current_role() in ('admin', 'manager')) with check (public.app_current_role() in ('admin', 'manager'));

create policy tasks_select_company on tasks for select using (company_id = public.app_current_company_id());
create policy tasks_write_admin_manager on tasks for all using (company_id = public.app_current_company_id() and public.app_current_role() in ('admin', 'manager')) with check (company_id = public.app_current_company_id() and public.app_current_role() in ('admin', 'manager'));
create policy tasks_worker_update_own on tasks for update using (company_id = public.app_current_company_id() and assigned_to_user_id = auth.uid() and public.app_current_role() in ('worker', 'contractor')) with check (company_id = public.app_current_company_id() and assigned_to_user_id = auth.uid());

create policy task_images_select_company on task_images for select using (exists (select 1 from public.tasks t where t.id = task_id and t.company_id = public.app_current_company_id()));
create policy task_images_write_company on task_images for all using (exists (select 1 from public.tasks t where t.id = task_id and t.company_id = public.app_current_company_id()) and public.app_current_role() in ('admin', 'manager', 'worker', 'contractor')) with check (exists (select 1 from public.tasks t where t.id = task_id and t.company_id = public.app_current_company_id()) and public.app_current_role() in ('admin', 'manager', 'worker', 'contractor'));
create policy task_comments_select_company on task_comments for select using (exists (select 1 from public.tasks t where t.id = task_id and t.company_id = public.app_current_company_id()));
create policy task_comments_write_company on task_comments for all using (exists (select 1 from public.tasks t where t.id = task_id and t.company_id = public.app_current_company_id()) and public.app_current_role() in ('admin', 'manager', 'worker', 'contractor')) with check (exists (select 1 from public.tasks t where t.id = task_id and t.company_id = public.app_current_company_id()) and public.app_current_role() in ('admin', 'manager', 'worker', 'contractor'));
create policy task_status_history_select_company on task_status_history for select using (exists (select 1 from public.tasks t where t.id = task_id and t.company_id = public.app_current_company_id()));
create policy task_activity_log_select_company on task_activity_log for select using (exists (select 1 from public.tasks t where t.id = task_id and t.company_id = public.app_current_company_id()));

insert into storage.buckets (id, name, public)
values ('task-images', 'task-images', true)
on conflict (id) do nothing;
