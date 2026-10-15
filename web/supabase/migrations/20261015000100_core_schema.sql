-- Layakari: normalized tables that replace the JSON blobs.
-- New tables only. Nothing here touches profiles, ledger or enroll, so the current site keeps working.

-- ---------------------------------------------------------------- helpers

create or replace function public.slugify(t text)
returns text language sql immutable set search_path = '' as $$
  select coalesce(
    nullif(left(trim(both '-' from regexp_replace(
      lower(translate(coalesce(t, ''),
        'ÀÁÂÃÄÅàáâãäåÈÉÊËèéêëÌÍÎÏìíîïÒÓÔÕÖòóôõöÙÚÛÜùúûüÑñÇçĀāĪīŪū',
        'AAAAAAaaaaaaEEEEeeeeIIIIiiiiOOOOOoooooUUUUuuuuNnCcAaIiUu')),
      '[^a-z0-9]+', '-', 'g')), 60), ''),
    'item')
$$;

-- Finds a free slug in tbl.col: base, base-2, base-3 ...
-- Security definer so it also sees rows the caller can't (other people's drafts).
create or replace function public.unique_slug(base text, tbl regclass, col text)
returns text language plpgsql security definer set search_path = '' as $$
declare
  candidate text := trim(both '-' from left(base, 60));
  n int := 1;
  taken boolean;
begin
  loop
    execute format('select exists (select 1 from %s where lower(%I) = lower($1))', tbl, col) into taken using candidate;
    exit when not taken;
    n := n + 1;
    candidate := trim(both '-' from left(base, 56)) || '-' || n;
  end loop;
  return candidate;
end $$;

create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- ---------------------------------------------------------------- members (public profiles)

create table public.members (
  id uuid primary key references auth.users (id) on delete cascade,
  handle text not null check (handle ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(handle) <= 64),
  name text not null check (char_length(btrim(name)) between 1 and 60),
  city text not null default '' check (char_length(city) <= 60),
  bio text not null default '' check (char_length(bio) <= 600),
  roles text[] not null default '{}'
    check (roles <@ array['listener', 'dancer', 'tabla', 'composer', 'choreographer', 'guru', 'student']),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index members_handle_key on public.members (lower(handle));
comment on table public.members is 'Public profile for each signed-up person. Replaces profiles.data {name, city, bio, roles}.';

create or replace function public.members_before_insert()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.handle is null or new.handle = '' then
    new.handle := public.unique_slug(public.slugify(new.name), 'public.members', 'handle');
  end if;
  return new;
end $$;
create trigger members_before_insert before insert on public.members for each row execute function public.members_before_insert();
create trigger members_touch before update on public.members for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------- compositions

create table public.compositions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.members (id) on delete cascade,
  slug text not null,
  title text not null check (char_length(btrim(title)) between 1 and 80),
  form text not null check (form in ('Paran', 'Tukda', 'Tihai', 'Chakradar', 'Kavitt', 'Gat', 'Tatkar', 'Amad', 'Thaat', 'Peshkar', 'Kaida', 'Rela')),
  taal text not null check (taal in ('teentaal', 'jhaptaal', 'rupak', 'ektaal', 'dhamar')),
  laya text not null check (laya in ('Vilambit', 'Madhya', 'Drut')),
  bpm int not null default 90 check (bpm between 30 and 240),
  price_listen numeric(10, 2) not null default 2 check (price_listen >= 0),
  price_perform numeric(10, 2) not null default 25 check (price_perform >= 0),
  price_teach numeric(10, 2) not null default 99 check (price_teach >= 0),
  preview text not null default '',
  line_count int not null default 0,
  status text not null default 'published' check (status in ('published', 'draft')),
  legacy_key text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index compositions_slug_key on public.compositions (lower(slug));
create index compositions_owner_idx on public.compositions (owner_id);
create index compositions_taal_idx on public.compositions (taal) where status = 'published';
comment on column public.compositions.preview is 'First line of the notation: the free public preview. Kept in sync from composition_notation.';

-- Full notation lives apart from the public row so it can have its own read rule.
create table public.composition_notation (
  composition_id uuid primary key references public.compositions (id) on delete cascade,
  bols text not null default '' check (char_length(bols) <= 4000)
);

create or replace function public.compositions_before_insert()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.slug is null or new.slug = '' then
    new.slug := public.unique_slug(public.slugify(new.title), 'public.compositions', 'slug');
  end if;
  return new;
end $$;
create trigger compositions_before_insert before insert on public.compositions for each row execute function public.compositions_before_insert();
create trigger compositions_touch before update on public.compositions for each row execute function public.touch_updated_at();

create or replace function public.notation_sync_preview()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  lines text[] := string_to_array(regexp_replace(new.bols, '\s+$', ''), E'\n');
begin
  update public.compositions
     set preview = coalesce(lines[1], ''),
         line_count = coalesce(array_length(lines, 1), 0)
   where id = new.composition_id;
  return new;
end $$;
create trigger notation_sync_preview after insert or update of bols on public.composition_notation
  for each row execute function public.notation_sync_preview();

-- ---------------------------------------------------------------- choreographies

create table public.choreographies (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.members (id) on delete cascade,
  composition_id uuid references public.compositions (id) on delete set null,
  title text not null check (char_length(btrim(title)) between 1 and 80),
  about text not null default '' check (char_length(about) <= 140),
  price numeric(10, 2) not null default 49 check (price >= 0),
  legacy_key text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index choreographies_composition_idx on public.choreographies (composition_id);
create index choreographies_owner_idx on public.choreographies (owner_id);
create trigger choreographies_touch before update on public.choreographies for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------- academies

create table public.academies (
  id uuid primary key default gen_random_uuid(),
  guru_id uuid not null unique references public.members (id) on delete cascade,
  slug text not null,
  name text not null check (char_length(btrim(name)) between 1 and 80),
  about text not null default '' check (char_length(about) <= 600),
  fee numeric(10, 2) not null default 40 check (fee >= 0),
  open boolean not null default true,
  legacy_key text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index academies_slug_key on public.academies (lower(slug));

create or replace function public.academies_before_insert()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.slug is null or new.slug = '' then
    new.slug := public.unique_slug(public.slugify(new.name), 'public.academies', 'slug');
  end if;
  return new;
end $$;
create trigger academies_before_insert before insert on public.academies for each row execute function public.academies_before_insert();
create trigger academies_touch before update on public.academies for each row execute function public.touch_updated_at();

create table public.academy_levels (
  id uuid primary key default gen_random_uuid(),
  academy_id uuid not null references public.academies (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 40),
  position int not null default 0,
  legacy_key text unique,
  created_at timestamptz not null default now()
);
create index academy_levels_academy_idx on public.academy_levels (academy_id, position);

create table public.level_pieces (
  level_id uuid not null references public.academy_levels (id) on delete cascade,
  composition_id uuid not null references public.compositions (id) on delete cascade,
  added_at timestamptz not null default now(),
  primary key (level_id, composition_id)
);
create index level_pieces_composition_idx on public.level_pieces (composition_id);

create table public.enrollments (
  academy_id uuid not null references public.academies (id) on delete cascade,
  student_id uuid not null references public.members (id) on delete cascade,
  level_id uuid references public.academy_levels (id) on delete set null,
  status text not null default 'pending' check (status in ('pending', 'active', 'declined')),
  requested_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (academy_id, student_id)
);
create index enrollments_student_idx on public.enrollments (student_id);
comment on table public.enrollments is 'A student''s request to join an academy. The guru accepts (active, with a level) or declines. An active row whose level was removed reads as pending.';

-- Keeps enrollments honest: who and when never change, and an active student sits in a level of this academy.
-- Skipped for cascades (trigger depth > 1), such as a level or academy being deleted.
create or replace function public.enrollments_validate()
returns trigger language plpgsql set search_path = '' as $$
begin
  if pg_trigger_depth() > 1 then
    return new;
  end if;
  if tg_op = 'UPDATE' then
    if new.academy_id <> old.academy_id or new.student_id <> old.student_id or new.requested_at <> old.requested_at then
      raise exception 'An enrollment''s academy, student and request date can''t change' using errcode = '22023';
    end if;
    new.updated_at := now();
  end if;
  if new.status = 'active' and new.level_id is null then
    raise exception 'Place the student in a level' using errcode = '22023';
  end if;
  if new.level_id is not null and not exists (
    select 1 from public.academy_levels l where l.id = new.level_id and l.academy_id = new.academy_id
  ) then
    raise exception 'That level belongs to another academy' using errcode = '22023';
  end if;
  return new;
end $$;
create trigger enrollments_validate before insert or update on public.enrollments
  for each row execute function public.enrollments_validate();

-- Deleting a level moves its students to the academy's first remaining level (as the current site does),
-- or back to waiting when there is none.
create or replace function public.academy_levels_before_delete()
returns trigger language plpgsql set search_path = '' as $$
declare
  fallback uuid;
begin
  if pg_trigger_depth() > 1 then
    return old;
  end if;
  select id into fallback from public.academy_levels
   where academy_id = old.academy_id and id <> old.id
   order by position, created_at limit 1;
  update public.enrollments
     set level_id = fallback,
         status = case when fallback is null and status = 'active' then 'pending' else status end
   where level_id = old.id;
  return old;
end $$;
create trigger academy_levels_before_delete before delete on public.academy_levels
  for each row execute function public.academy_levels_before_delete();

-- ---------------------------------------------------------------- licences (purchases)

create table public.licences (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid references public.members (id) on delete set null,
  kind text not null check (kind in ('listen', 'perform', 'teach', 'choreo')),
  composition_id uuid references public.compositions (id) on delete set null,
  choreography_id uuid references public.choreographies (id) on delete set null,
  seller_id uuid references public.members (id) on delete set null,
  composer_id uuid references public.members (id) on delete set null,
  price numeric(10, 2) not null check (price >= 0),
  is_demo boolean not null default true,
  payment_ref text,
  legacy_key text unique,
  created_at timestamptz not null default now()
);
create index licences_buyer_idx on public.licences (buyer_id, composition_id);
create index licences_seller_idx on public.licences (seller_id);
create index licences_composer_idx on public.licences (composer_id);
comment on table public.licences is 'One row per purchase. seller_id is who sold it (composer, or choreographer for choreo); composer_id is the piece''s composer. Rows are only created by purchase_licence / purchase_choreography. is_demo marks checkouts where no money moved.';
