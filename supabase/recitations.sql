-- Layakari: recitations (the audio of a composition). Run once in the Supabase SQL editor; safe to run again.
--
-- A composition can have a recitation:
--   * its first cycle is free for everyone to hear       -> bucket "previews"    (public)
--   * the whole recitation only for the composer, anyone  -> bucket "recitations" (private)
--     holding a licence, and students it was released to    (the same people who can read the full notation)
-- Files live in a folder named after the composition's id, and only the composer can add, replace or remove them.

-- ---------- what the app needs to know about a recitation ----------
alter table public.compositions add column if not exists recitation jsonb;
-- null when there is none, otherwise for example:
--   {"full": "<composition id>/full.mp3", "preview": "<composition id>/preview.wav",
--    "beats": [3.62, 4.52, ...],   -- second at which each matra starts in the full recording
--    "preview_end": 12.25,          -- where the free first cycle ends
--    "credit": "Sharang Sinha", "updated_at": "2026-10-26T00:00:00Z"}
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'compositions_recitation_is_object') then
    alter table public.compositions add constraint compositions_recitation_is_object
      check (recitation is null or jsonb_typeof(recitation) = 'object');
  end if;
end $$;

-- ---------- the two buckets ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('previews', 'previews', true, 5242880,
        array['audio/mpeg', 'audio/mp4', 'audio/x-m4a', 'audio/aac', 'audio/wav', 'audio/x-wav', 'audio/wave', 'audio/webm', 'audio/ogg']),
       ('recitations', 'recitations', false, 26214400,
        array['audio/mpeg', 'audio/mp4', 'audio/x-m4a', 'audio/aac', 'audio/wav', 'audio/x-wav', 'audio/wave', 'audio/webm', 'audio/ogg'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit,
                               allowed_mime_types = excluded.allowed_mime_types;

-- ---------- who may do what with the files ----------
-- the composition a file belongs to is the folder it sits in
create or replace function public.recitation_folder(object_name text) returns uuid
language sql immutable set search_path = public as $$
  select case when split_part(object_name, '/', 1) ~ '^[0-9a-fA-F]{8}-([0-9a-fA-F]{4}-){3}[0-9a-fA-F]{12}$'
              then split_part(object_name, '/', 1)::uuid end
$$;
create or replace function public.owns_recitation_folder(object_name text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from compositions c where c.id = public.recitation_folder(object_name) and c.owner_id = auth.uid())
$$;
create or replace function public.can_hear_recitation(object_name text) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(public.can_read_notation(public.recitation_folder(object_name)), false)
$$;

do $$
declare p text;
begin
  for p in select policyname from pg_policies where schemaname = 'storage' and tablename = 'objects'
      and policyname in ('previews: anyone can listen', 'previews: composer adds', 'previews: composer replaces', 'previews: composer removes',
                         'recitations: listeners with access', 'recitations: composer adds', 'recitations: composer replaces', 'recitations: composer removes')
  loop execute format('drop policy %I on storage.objects', p); end loop;
end $$;

create policy "previews: anyone can listen" on storage.objects for select to anon, authenticated
  using (bucket_id = 'previews');
create policy "previews: composer adds" on storage.objects for insert to authenticated
  with check (bucket_id = 'previews' and public.owns_recitation_folder(name));
create policy "previews: composer replaces" on storage.objects for update to authenticated
  using (bucket_id = 'previews' and public.owns_recitation_folder(name))
  with check (bucket_id = 'previews' and public.owns_recitation_folder(name));
create policy "previews: composer removes" on storage.objects for delete to authenticated
  using (bucket_id = 'previews' and public.owns_recitation_folder(name));

create policy "recitations: listeners with access" on storage.objects for select to authenticated
  using (bucket_id = 'recitations' and public.can_hear_recitation(name));
create policy "recitations: composer adds" on storage.objects for insert to authenticated
  with check (bucket_id = 'recitations' and public.owns_recitation_folder(name));
create policy "recitations: composer replaces" on storage.objects for update to authenticated
  using (bucket_id = 'recitations' and public.owns_recitation_folder(name))
  with check (bucket_id = 'recitations' and public.owns_recitation_folder(name));
create policy "recitations: composer removes" on storage.objects for delete to authenticated
  using (bucket_id = 'recitations' and public.owns_recitation_folder(name));

revoke all on function public.owns_recitation_folder(text) from public, anon;
revoke all on function public.can_hear_recitation(text) from public, anon;
grant execute on function public.recitation_folder(text) to anon, authenticated;
grant execute on function public.owns_recitation_folder(text) to authenticated;
grant execute on function public.can_hear_recitation(text) to authenticated;

-- What changed (Supabase shows this as the result)
select (select count(*) from storage.buckets where id in ('previews', 'recitations')) as buckets,
       (select count(*) from pg_policies where schemaname = 'storage' and tablename = 'objects'
          and (policyname like 'previews:%' or policyname like 'recitations:%')) as file_rules,
       (select count(*) from public.compositions where recitation is not null) as compositions_with_a_recitation;
