create table if not exists app_state (
  key text primary key,
  data jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists app_state_touch_updated on app_state;
create trigger app_state_touch_updated before update on app_state for each row execute function touch_updated_at();

alter table app_state enable row level security;
