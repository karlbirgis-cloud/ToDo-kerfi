create type inspection_run_item_status as enum ('unchecked', 'ok', 'issue', 'not_applicable');

create table inspection_templates (
  id uuid primary key default gen_random_uuid(),
  inspection_type_id uuid not null,
  name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table inspection_checklist_items (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references inspection_templates(id) on delete cascade,
  section text not null,
  title text not null,
  description text not null,
  category_id uuid references categories(id) on delete set null,
  subcategory_id uuid references subcategories(id) on delete set null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table inspection_runs (
  id uuid primary key default gen_random_uuid(),
  inspection_type_id uuid not null,
  template_id uuid not null references inspection_templates(id) on delete restrict,
  project_id uuid not null references projects(id) on delete cascade,
  location_id uuid not null references locations(id) on delete cascade,
  unit_id uuid not null references units(id) on delete cascade,
  started_by_user_id uuid not null references profiles(id) on delete restrict,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (template_id, unit_id)
);

create table inspection_run_items (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references inspection_runs(id) on delete cascade,
  checklist_item_id uuid not null references inspection_checklist_items(id) on delete restrict,
  status inspection_run_item_status not null default 'unchecked',
  task_id uuid references tasks(id) on delete set null,
  checked_by_user_id uuid references profiles(id) on delete set null,
  checked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (run_id, checklist_item_id)
);

alter table tasks
add column if not exists inspection_run_item_id uuid references inspection_run_items(id) on delete set null;

create index idx_inspection_checklist_template on inspection_checklist_items(template_id, sort_order);
create index idx_inspection_runs_scope on inspection_runs(project_id, location_id, unit_id);
create index idx_inspection_run_items_run on inspection_run_items(run_id, status);
create index idx_tasks_inspection_run_item on tasks(inspection_run_item_id);

create trigger inspection_templates_touch_updated before update on inspection_templates for each row execute function touch_updated_at();
create trigger inspection_checklist_items_touch_updated before update on inspection_checklist_items for each row execute function touch_updated_at();
create trigger inspection_runs_touch_updated before update on inspection_runs for each row execute function touch_updated_at();
create trigger inspection_run_items_touch_updated before update on inspection_run_items for each row execute function touch_updated_at();

alter table inspection_templates enable row level security;
alter table inspection_checklist_items enable row level security;
alter table inspection_runs enable row level security;
alter table inspection_run_items enable row level security;

create policy inspection_templates_read_auth on inspection_templates for select using (auth.uid() is not null);
create policy inspection_templates_write_admin on inspection_templates for all using (public.app_current_role() = 'admin') with check (public.app_current_role() = 'admin');

create policy inspection_checklist_items_read_auth on inspection_checklist_items for select using (auth.uid() is not null);
create policy inspection_checklist_items_write_admin on inspection_checklist_items for all using (public.app_current_role() = 'admin') with check (public.app_current_role() = 'admin');

create policy inspection_runs_select_company on inspection_runs for select using (
  exists (select 1 from public.projects p where p.id = project_id and p.company_id = public.app_current_company_id())
);
create policy inspection_runs_write_admin_manager on inspection_runs for all using (
  public.app_current_role() in ('admin', 'manager') and
  exists (select 1 from public.projects p where p.id = project_id and p.company_id = public.app_current_company_id())
) with check (
  public.app_current_role() in ('admin', 'manager') and
  exists (select 1 from public.projects p where p.id = project_id and p.company_id = public.app_current_company_id())
);

create policy inspection_run_items_select_company on inspection_run_items for select using (
  exists (
    select 1
    from public.inspection_runs r
    join public.projects p on p.id = r.project_id
    where r.id = run_id and p.company_id = public.app_current_company_id()
  )
);
create policy inspection_run_items_write_admin_manager on inspection_run_items for all using (
  public.app_current_role() in ('admin', 'manager') and
  exists (
    select 1
    from public.inspection_runs r
    join public.projects p on p.id = r.project_id
    where r.id = run_id and p.company_id = public.app_current_company_id()
  )
) with check (
  public.app_current_role() in ('admin', 'manager') and
  exists (
    select 1
    from public.inspection_runs r
    join public.projects p on p.id = r.project_id
    where r.id = run_id and p.company_id = public.app_current_company_id()
  )
);
