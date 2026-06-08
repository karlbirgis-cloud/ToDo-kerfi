update tasks
set status = 'open'
where status = 'blocked';

update task_status_history
set old_status = 'open'
where old_status = 'blocked';

update task_status_history
set new_status = 'open'
where new_status = 'blocked';

alter table tasks
alter column status type text using status::text;

alter table task_status_history
alter column old_status type text using old_status::text,
alter column new_status type text using new_status::text;

drop type task_status;
create type task_status as enum ('open', 'in_progress', 'done');

alter table tasks
alter column status type task_status using status::task_status,
alter column status set default 'open';

alter table task_status_history
alter column old_status type task_status using old_status::task_status,
alter column new_status type task_status using new_status::task_status;
