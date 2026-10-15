-- Copies the current site's JSON blobs (profiles, ledger, enroll) into the new tables.
--
-- Defining this function changes nothing. Running it is a separate, deliberate step:
--   select public.layakari_import_legacy();
-- It is safe to run more than once: every row it creates carries a legacy_key (or the member id),
-- and rows that already exist are left alone. It never modifies or deletes the blob tables.
-- It returns a report with counts and every record it skipped, and why.

create or replace function public.try_uuid(t text)
returns uuid language plpgsql immutable set search_path = '' as $$
begin
  return t::uuid;
exception when others then
  return null;
end $$;

create or replace function public.try_numeric(t text)
returns numeric language plpgsql immutable set search_path = '' as $$
begin
  return t::numeric;
exception when others then
  return null;
end $$;

create or replace function public.epoch_ms_to_ts(v jsonb, fallback timestamptz)
returns timestamptz language plpgsql immutable set search_path = '' as $$
begin
  if v is null or jsonb_typeof(v) <> 'number' then return fallback; end if;
  return to_timestamp((v #>> '{}')::double precision / 1000.0);
exception when others then
  return fallback;
end $$;

create or replace function public.layakari_import_legacy()
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  forms constant text[] := array['Paran', 'Tukda', 'Tihai', 'Chakradar', 'Kavitt', 'Gat', 'Tatkar', 'Amad', 'Thaat', 'Peshkar', 'Kaida', 'Rela'];
  taals constant text[] := array['teentaal', 'jhaptaal', 'rupak', 'ektaal', 'dhamar'];
  layas constant text[] := array['Vilambit', 'Madhya', 'Drut'];
  roles constant text[] := array['listener', 'dancer', 'tabla', 'composer', 'choreographer', 'guru', 'student'];
  skipped jsonb := '[]'::jsonb;
  counts jsonb := '{}'::jsonb;
  p record; it record; lv record; pc record; st record;
  uid uuid; d jsonb; acad jsonb; acad_id uuid; level_id uuid; comp_id uuid; chor_id uuid; n int; k text; v text;
  t_name text; t_form text; t_taal text; t_laya text;
  before_counts jsonb;
begin
  select jsonb_build_object(
    'members', (select count(*) from public.members), 'compositions', (select count(*) from public.compositions),
    'choreographies', (select count(*) from public.choreographies), 'academies', (select count(*) from public.academies),
    'levels', (select count(*) from public.academy_levels), 'level_pieces', (select count(*) from public.level_pieces),
    'enrollments', (select count(*) from public.enrollments), 'licences', (select count(*) from public.licences))
  into before_counts;

  -- Pass 1: members.
  for p in select id::text as id, data, updated_at from public.profiles loop
    uid := public.try_uuid(p.id);
    d := coalesce(p.data, '{}'::jsonb);
    if uid is null or not exists (select 1 from auth.users u where u.id = uid) then
      skipped := skipped || jsonb_build_object('table', 'profiles', 'id', p.id, 'reason', 'no matching sign-in account');
      continue;
    end if;
    t_name := left(btrim(coalesce(d ->> 'name', '')), 60);
    if t_name = '' then
      t_name := 'Layakari member';
      skipped := skipped || jsonb_build_object('table', 'profiles', 'id', p.id, 'reason', 'no name; imported as "Layakari member"', 'kept', true);
    end if;
    insert into public.members (id, handle, name, city, bio, roles, created_at)
    values (uid, null, t_name, left(coalesce(d ->> 'city', ''), 60), left(coalesce(d ->> 'bio', ''), 600),
            coalesce(array(select r from jsonb_array_elements_text(case when jsonb_typeof(d -> 'roles') = 'array' then d -> 'roles' else '[]' end) r
                            where r = any (roles)), '{}'),
            public.epoch_ms_to_ts(d -> 'created', coalesce(p.updated_at, now())))
    on conflict (id) do nothing;
  end loop;

  -- Pass 2: compositions and notation.
  for p in select pr.id::text as id, pr.data from public.profiles pr loop
    uid := public.try_uuid(p.id);
    continue when uid is null or not exists (select 1 from public.members m where m.id = uid);
    for it in select e.value as c from jsonb_array_elements(case when jsonb_typeof(p.data -> 'compositions') = 'array' then p.data -> 'compositions' else '[]' end) e loop
      if coalesce(it.c ->> 'id', '') = '' then
        skipped := skipped || jsonb_build_object('table', 'compositions', 'owner', p.id, 'reason', 'composition without an id', 'title', it.c ->> 'title');
        continue;
      end if;
      k := p.id || ':' || (it.c ->> 'id');
      continue when exists (select 1 from public.compositions where legacy_key = k);
      t_form := coalesce(nullif(it.c ->> 'type', ''), 'Paran');
      t_taal := coalesce(nullif(it.c ->> 'taal', ''), 'teentaal');
      t_laya := coalesce(nullif(it.c ->> 'laya', ''), 'Madhya');
      if not t_form = any (forms) or not t_taal = any (taals) or not t_laya = any (layas) then
        skipped := skipped || jsonb_build_object('table', 'compositions', 'key', k, 'kept', true,
          'reason', format('unknown form/taal/laya (%s/%s/%s); used Paran/teentaal/Madhya where needed', t_form, t_taal, t_laya));
        if not t_form = any (forms) then t_form := 'Paran'; end if;
        if not t_taal = any (taals) then t_taal := 'teentaal'; end if;
        if not t_laya = any (layas) then t_laya := 'Madhya'; end if;
      end if;
      insert into public.compositions (owner_id, slug, title, form, taal, laya, bpm, price_listen, price_perform, price_teach, legacy_key, created_at)
      values (uid, null, coalesce(nullif(left(btrim(coalesce(it.c ->> 'title', '')), 80), ''), 'Untitled composition'),
              t_form, t_taal, t_laya,
              least(240, greatest(30, coalesce(public.try_numeric(it.c ->> 'bpm')::int, 90))),
              greatest(0, coalesce(public.try_numeric(it.c #>> '{prices,listen}'), 2)),
              greatest(0, coalesce(public.try_numeric(it.c #>> '{prices,perform}'), 25)),
              greatest(0, coalesce(public.try_numeric(it.c #>> '{prices,teach}'), 99)),
              k, public.epoch_ms_to_ts(it.c -> 'created', now()))
      returning id into comp_id;
      insert into public.composition_notation (composition_id, bols) values (comp_id, left(coalesce(it.c ->> 'bols', ''), 4000));
    end loop;
  end loop;

  -- Pass 3: choreographies and academies (they point at compositions).
  for p in select pr.id::text as id, pr.data from public.profiles pr loop
    uid := public.try_uuid(p.id);
    continue when uid is null or not exists (select 1 from public.members m where m.id = uid);

    for it in select e.value as c from jsonb_array_elements(case when jsonb_typeof(p.data -> 'choreographies') = 'array' then p.data -> 'choreographies' else '[]' end) e loop
      if coalesce(it.c ->> 'id', '') = '' then
        skipped := skipped || jsonb_build_object('table', 'choreographies', 'owner', p.id, 'reason', 'choreography without an id');
        continue;
      end if;
      k := p.id || ':' || (it.c ->> 'id');
      continue when exists (select 1 from public.choreographies where legacy_key = k);
      select id into comp_id from public.compositions where legacy_key = it.c ->> 'comp';
      if comp_id is null then
        skipped := skipped || jsonb_build_object('table', 'choreographies', 'key', k, 'kept', true, 'reason', 'its composition no longer exists');
      end if;
      insert into public.choreographies (owner_id, composition_id, title, about, price, legacy_key, created_at)
      values (uid, comp_id, coalesce(nullif(left(btrim(coalesce(it.c ->> 'title', '')), 80), ''), 'Untitled choreography'),
              left(coalesce(it.c ->> 'about', ''), 140), greatest(0, coalesce(public.try_numeric(it.c ->> 'price'), 49)),
              k, public.epoch_ms_to_ts(it.c -> 'created', now()));
    end loop;

    acad := p.data -> 'academy';
    continue when acad is null or jsonb_typeof(acad) <> 'object' or coalesce(btrim(acad ->> 'name'), '') = '';
    select id into acad_id from public.academies where legacy_key = p.id;
    if acad_id is null then
      insert into public.academies (guru_id, slug, name, about, fee, open, legacy_key, created_at)
      values (uid, null, left(btrim(acad ->> 'name'), 80), left(coalesce(acad ->> 'about', ''), 600),
              greatest(0, coalesce(public.try_numeric(acad ->> 'fee'), 0)),
              not coalesce(acad -> 'open' = 'false'::jsonb, false), p.id, public.epoch_ms_to_ts(acad -> 'created', now()))
      on conflict (guru_id) do nothing
      returning id into acad_id;
    end if;
    continue when acad_id is null;

    n := 0;
    for lv in select e.value as l, e.ordinality as pos from jsonb_array_elements(case when jsonb_typeof(acad -> 'levels') = 'array' then acad -> 'levels' else '[]' end) with ordinality e loop
      continue when coalesce(lv.l ->> 'id', '') = '';
      k := p.id || ':' || (lv.l ->> 'id');
      select id into level_id from public.academy_levels where legacy_key = k;
      if level_id is null then
        insert into public.academy_levels (academy_id, name, position, legacy_key)
        values (acad_id, coalesce(nullif(left(btrim(coalesce(lv.l ->> 'name', '')), 40), ''), 'Level ' || lv.pos), lv.pos::int, k)
        returning id into level_id;
      end if;
      for pc in select e.value #>> '{}' as key from jsonb_array_elements(case when jsonb_typeof(lv.l -> 'pieces') = 'array' then lv.l -> 'pieces' else '[]' end) e loop
        select id into comp_id from public.compositions where legacy_key = pc.key;
        if comp_id is null then
          skipped := skipped || jsonb_build_object('table', 'level_pieces', 'level', k, 'piece', pc.key, 'reason', 'composition no longer exists');
          continue;
        end if;
        insert into public.level_pieces (level_id, composition_id) values (level_id, comp_id) on conflict do nothing;
      end loop;
    end loop;
  end loop;

  -- Pass 4: enrollments. A request lives in the student's enroll blob; placement and declines in the guru's academy.
  for st in select en.id::text as student, r.key as guru, r.value as req
              from public.enroll en, jsonb_each(case when jsonb_typeof(en.data -> 'req') = 'object' then en.data -> 'req' else '{}' end) r loop
    uid := public.try_uuid(st.student);
    select a.id, a.legacy_key, pr.data -> 'academy' into acad_id, k, acad
      from public.academies a join public.profiles pr on pr.id::text = a.legacy_key
     where a.legacy_key = st.guru;
    if acad_id is null or uid is null or not exists (select 1 from public.members m where m.id = uid) then
      skipped := skipped || jsonb_build_object('table', 'enroll', 'student', st.student, 'guru', st.guru, 'reason', 'student or academy not found');
      continue;
    end if;
    continue when exists (select 1 from public.enrollments e where e.academy_id = acad_id and e.student_id = uid);
    v := acad #>> array['roster', st.student];
    level_id := null;
    if v is not null then
      select id into level_id from public.academy_levels where legacy_key = st.guru || ':' || v and academy_id = acad_id;
    end if;
    insert into public.enrollments (academy_id, student_id, level_id, status, requested_at)
    values (acad_id, uid, level_id,
            case when level_id is not null then 'active'
                 when coalesce(acad #>> array['declined', st.student], '') = 'true' then 'declined'
                 else 'pending' end,
            public.epoch_ms_to_ts(st.req -> 'at', now()));
  end loop;

  -- Pass 5: purchases. Every one is a demo checkout, so they keep is_demo = true and payment_ref = 'demo'.
  for p in select l.id::text as id, l.data from public.ledger l loop
    uid := public.try_uuid(p.id);
    if uid is null or not exists (select 1 from public.members m where m.id = uid) then
      skipped := skipped || jsonb_build_object('table', 'ledger', 'buyer', p.id, 'reason', 'buyer has no profile');
      continue;
    end if;
    for it in select e.value as i, e.ordinality as pos from jsonb_array_elements(case when jsonb_typeof(p.data -> 'items') = 'array' then p.data -> 'items' else '[]' end) with ordinality e loop
      k := p.id || ':' || coalesce(nullif(it.i ->> 'id', ''), 'item' || it.pos || ':' || md5(it.i::text));
      continue when exists (select 1 from public.licences where legacy_key = k);
      if not coalesce(it.i ->> 'kind', '') = any (array['listen', 'perform', 'teach', 'choreo']) then
        skipped := skipped || jsonb_build_object('table', 'ledger', 'key', k, 'reason', 'unknown licence kind ' || coalesce(it.i ->> 'kind', 'null'));
        continue;
      end if;
      select id into comp_id from public.compositions where legacy_key = it.i ->> 'key';
      select id into chor_id from public.choreographies where legacy_key = it.i ->> 'chor';
      if comp_id is null then
        skipped := skipped || jsonb_build_object('table', 'ledger', 'key', k, 'kept', true, 'reason', 'composition no longer exists; sale kept for earnings');
      end if;
      insert into public.licences (buyer_id, kind, composition_id, choreography_id, seller_id, composer_id, price, is_demo, payment_ref, legacy_key, created_at)
      values (uid, it.i ->> 'kind', comp_id, chor_id,
              (select m.id from public.members m where m.id = public.try_uuid(it.i ->> 'seller')),
              (select m.id from public.members m where m.id = public.try_uuid(split_part(coalesce(it.i ->> 'key', ''), ':', 1))),
              greatest(0, coalesce(public.try_numeric(it.i ->> 'price'), 0)), true, 'demo', k,
              public.epoch_ms_to_ts(it.i -> 'at', now()));
    end loop;
  end loop;

  select jsonb_build_object(
    'members', (select count(*) from public.members), 'compositions', (select count(*) from public.compositions),
    'choreographies', (select count(*) from public.choreographies), 'academies', (select count(*) from public.academies),
    'levels', (select count(*) from public.academy_levels), 'level_pieces', (select count(*) from public.level_pieces),
    'enrollments', (select count(*) from public.enrollments), 'licences', (select count(*) from public.licences))
  into counts;

  return jsonb_build_object('before', before_counts, 'after', counts, 'skipped', skipped,
    'source', jsonb_build_object(
      'profiles', (select count(*) from public.profiles),
      'compositions', (select coalesce(sum(jsonb_array_length(data -> 'compositions')), 0) from public.profiles where jsonb_typeof(data -> 'compositions') = 'array'),
      'choreographies', (select coalesce(sum(jsonb_array_length(data -> 'choreographies')), 0) from public.profiles where jsonb_typeof(data -> 'choreographies') = 'array'),
      'academies', (select count(*) from public.profiles where jsonb_typeof(data -> 'academy') = 'object'),
      'enroll_requests', (select coalesce(sum((select count(*) from jsonb_object_keys(data -> 'req'))), 0) from public.enroll where jsonb_typeof(data -> 'req') = 'object'),
      'ledger_items', (select coalesce(sum(jsonb_array_length(data -> 'items')), 0) from public.ledger where jsonb_typeof(data -> 'items') = 'array')));
end $$;


revoke execute on function public.layakari_import_legacy() from public, anon, authenticated;
