-- Gemify cloud sync — run once in the Supabase SQL editor.
--
-- The server is deliberately dumb: one generic row store plus one private
-- bucket. It never models dreams or habits, so adding a column (or a whole
-- table) to the local SQLite schema needs no change here. All it enforces is
-- ownership (row level security) and last-write-wins ordering.
--
-- Two more things have to be set in the dashboard:
--   * Authentication -> Providers -> Email: enabled, "Confirm email" on.
--   * Authentication -> Emails -> Magic Link: the template must contain
--     {{ .Token }}. The app asks for a typed six-digit code, and Supabase
--     only puts the code in the email when the template renders it.

-- ---------------------------------------------------------------------------
-- Row store
-- ---------------------------------------------------------------------------

create table if not exists public.sync_rows (
  user_id           uuid        not null default auth.uid()
                                references auth.users (id) on delete cascade,
  -- Local SQLite table the row belongs to.
  table_name        text        not null,
  -- The row's identity across devices (the local `uid` column).
  uid               text        not null,
  -- Every synced column, with foreign keys carrying the parent's uid.
  data              jsonb,
  deleted           boolean     not null default false,
  -- The authoring device's clock; what conflicts are decided on.
  client_updated_at text        not null,
  -- Server clock; only ever used as the other devices' pull cursor.
  server_updated_at timestamptz not null default now(),
  primary key (user_id, table_name, uid)
);

-- The one query devices run: "everything of mine since this timestamp".
create index if not exists sync_rows_pull_idx
  on public.sync_rows (user_id, server_updated_at);

alter table public.sync_rows enable row level security;

drop policy if exists "Rows are private to their owner" on public.sync_rows;
create policy "Rows are private to their owner"
  on public.sync_rows
  for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Last write wins, judged by the authoring device rather than arrival order,
-- so a slow upload cannot overwrite a later edit. Returning null from a BEFORE
-- trigger drops the write: that is what makes an equal timestamp a no-op, and
-- keeps a device from echoing back rows it has only just pulled.
create or replace function public.sync_rows_before_write()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' and new.client_updated_at <= old.client_updated_at then
    return null;
  end if;
  new.server_updated_at := now();
  return new;
end;
$$;

drop trigger if exists sync_rows_before_write on public.sync_rows;
create trigger sync_rows_before_write
  before insert or update on public.sync_rows
  for each row execute function public.sync_rows_before_write();

-- ---------------------------------------------------------------------------
-- Photo storage
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
  values ('gemify-photos', 'gemify-photos', false)
  on conflict (id) do nothing;

-- Objects live under a folder named after the owner's user id, which is what
-- the policy checks — a signed-in user can reach their own folder and no
-- other. The app only ever reads through short-lived signed URLs.
drop policy if exists "Photos are private to their owner" on storage.objects;
create policy "Photos are private to their owner"
  on storage.objects
  for all
  to authenticated
  using (
    bucket_id = 'gemify-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'gemify-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
