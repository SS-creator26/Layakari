-- Who can read and change what. Every table is locked by row-level security;
-- purchases and earnings go through the functions below, never through direct writes.

-- ---------------------------------------------------------------- access functions

-- The signed-in person's licence rank for a composition:
-- 9 = they wrote it, 3 = Teach, 2 = Perform or a choreography licence, 1 = Listen, 0 = none.
create or replace function public.licence_rank(p_composition uuid)
returns int language sql stable security definer set search_path = '' as $$
  select case
    when auth.uid() is null then 0
    when exists (select 1 from public.compositions c where c.id = p_composition and c.owner_id = auth.uid()) then 9
    else coalesce((
      select max(case l.kind when 'listen' then 1 when 'perform' then 2 when 'teach' then 3 when 'choreo' then 2 end)
        from public.licences l
       where l.buyer_id = auth.uid() and l.composition_id = p_composition
    ), 0)
  end
$$;

-- "Academy · Level" when a guru has released this piece to the signed-in student's level or one below it.
create or replace function public.academy_access(p_composition uuid)
returns text language sql stable security definer set search_path = '' as $$
  select a.name || ' · ' || l.name
    from public.enrollments e
    join public.academies a on a.id = e.academy_id
    join public.academy_levels l on l.id = e.level_id
   where e.student_id = auth.uid()
     and e.status = 'active'
     and exists (
       select 1 from public.level_pieces lp
         join public.academy_levels l2 on l2.id = lp.level_id
        where lp.composition_id = p_composition
          and l2.academy_id = e.academy_id
          and l2.position <= l.position)
   order by a.name
   limit 1
$$;

create or replace function public.can_read_notation(p_composition uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select public.licence_rank(p_composition) > 0 or public.academy_access(p_composition) is not null
$$;

create or replace function public.is_guru_of(p_academy uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.academies a where a.id = p_academy and a.guru_id = auth.uid())
$$;

create or replace function public.is_guru_of_level(p_level uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.academy_levels l join public.academies a on a.id = l.academy_id
     where l.id = p_level and a.guru_id = auth.uid())
$$;

create or replace function public.owns_composition(p_composition uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.compositions c where c.id = p_composition and c.owner_id = auth.uid())
$$;

-- ---------------------------------------------------------------- row-level security

alter table public.members enable row level security;
alter table public.compositions enable row level security;
alter table public.composition_notation enable row level security;
alter table public.choreographies enable row level security;
alter table public.academies enable row level security;
alter table public.academy_levels enable row level security;
alter table public.level_pieces enable row level security;
alter table public.enrollments enable row level security;
alter table public.licences enable row level security;

-- members: public profiles; you edit only your own.
create policy members_read on public.members for select using (true);
create policy members_insert on public.members for insert to authenticated with check (id = auth.uid());
create policy members_update on public.members for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- compositions: published ones are public; owners see their drafts and do all writes.
create policy compositions_read on public.compositions for select using (status = 'published' or owner_id = auth.uid());
create policy compositions_insert on public.compositions for insert to authenticated with check (owner_id = auth.uid());
create policy compositions_update on public.compositions for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy compositions_delete on public.compositions for delete to authenticated using (owner_id = auth.uid());

-- notation: the owner, licence holders, and students the piece was released to.
create policy notation_read on public.composition_notation for select using (public.can_read_notation(composition_id));
create policy notation_insert on public.composition_notation for insert to authenticated with check (public.owns_composition(composition_id));
create policy notation_update on public.composition_notation for update to authenticated
  using (public.owns_composition(composition_id)) with check (public.owns_composition(composition_id));
create policy notation_delete on public.composition_notation for delete to authenticated using (public.owns_composition(composition_id));

-- choreographies: public; set only to a published piece (or your own).
create policy choreographies_read on public.choreographies for select using (true);
create policy choreographies_insert on public.choreographies for insert to authenticated with check (
  owner_id = auth.uid()
  and (composition_id is null or exists (
    select 1 from public.compositions c where c.id = composition_id and (c.status = 'published' or c.owner_id = auth.uid()))));
create policy choreographies_update on public.choreographies for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy choreographies_delete on public.choreographies for delete to authenticated using (owner_id = auth.uid());

-- academies, levels and released pieces: public syllabus; only the guru edits.
create policy academies_read on public.academies for select using (true);
create policy academies_insert on public.academies for insert to authenticated with check (guru_id = auth.uid());
create policy academies_update on public.academies for update to authenticated using (guru_id = auth.uid()) with check (guru_id = auth.uid());
create policy academies_delete on public.academies for delete to authenticated using (guru_id = auth.uid());

create policy levels_read on public.academy_levels for select using (true);
create policy levels_insert on public.academy_levels for insert to authenticated with check (public.is_guru_of(academy_id));
create policy levels_update on public.academy_levels for update to authenticated using (public.is_guru_of(academy_id)) with check (public.is_guru_of(academy_id));
create policy levels_delete on public.academy_levels for delete to authenticated using (public.is_guru_of(academy_id));

-- A guru can release a piece they wrote or hold a Teach licence for.
create policy level_pieces_read on public.level_pieces for select using (true);
create policy level_pieces_insert on public.level_pieces for insert to authenticated with check (
  public.is_guru_of_level(level_id) and public.licence_rank(composition_id) >= 3);
create policy level_pieces_delete on public.level_pieces for delete to authenticated using (public.is_guru_of_level(level_id));

-- enrollments: students ask to join an open academy and can withdraw; the guru places, moves, declines and removes.
create policy enrollments_read on public.enrollments for select to authenticated using (student_id = auth.uid() or public.is_guru_of(academy_id));
create policy enrollments_request on public.enrollments for insert to authenticated with check (
  student_id = auth.uid() and status = 'pending' and level_id is null
  and exists (select 1 from public.academies a where a.id = academy_id and a.open and a.guru_id <> auth.uid()));
create policy enrollments_guru_update on public.enrollments for update to authenticated
  using (public.is_guru_of(academy_id)) with check (public.is_guru_of(academy_id));
create policy enrollments_delete on public.enrollments for delete to authenticated using (student_id = auth.uid() or public.is_guru_of(academy_id));

-- licences: buyers see their purchases, sellers and composers see their sales. No direct writes.
create policy licences_read on public.licences for select to authenticated
  using (buyer_id = auth.uid() or seller_id = auth.uid() or composer_id = auth.uid());

-- Table access for the API roles. Rows are still limited by the policies above. Newer Supabase projects no longer
-- grant this automatically, so it is spelled out here.
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.members, public.compositions, public.composition_notation,
  public.choreographies, public.academies, public.academy_levels, public.level_pieces, public.enrollments,
  public.licences to anon, authenticated;
revoke insert, update, delete on public.licences from anon, authenticated;
revoke all on public.enrollments, public.composition_notation from anon;

-- ---------------------------------------------------------------- purchases (demo checkout)

-- Share of a sale paid to one person: composers keep 80% of Listen/Perform/Teach;
-- for a choreography the choreographer keeps 70% and the composer of the piece 15%.
create or replace function public.revenue_share(p_kind text, p_price numeric, p_is_seller boolean, p_is_composer boolean)
returns numeric language sql immutable set search_path = '' as $$
  select round(case
    when p_kind = 'choreo' then p_price * ((case when p_is_seller then 0.70 else 0 end) + (case when p_is_composer then 0.15 else 0 end))
    when p_is_composer or p_is_seller then p_price * 0.80
    else 0
  end, 2)
$$;

create or replace function public.purchase_licence(p_composition uuid, p_kind text)
returns public.licences language plpgsql security definer set search_path = '' as $$
declare
  c public.compositions;
  need int := case p_kind when 'listen' then 1 when 'perform' then 2 when 'teach' then 3 end;
  result public.licences;
begin
  if auth.uid() is null then
    raise exception 'Sign in to license a composition' using errcode = '28000';
  end if;
  if not exists (select 1 from public.members m where m.id = auth.uid()) then
    raise exception 'Create your profile first' using errcode = '22023';
  end if;
  if need is null then
    raise exception 'Unknown licence type' using errcode = '22023';
  end if;
  select * into c from public.compositions where id = p_composition and status = 'published';
  if not found then
    raise exception 'This composition is no longer available' using errcode = 'P0002';
  end if;
  if c.owner_id = auth.uid() then
    raise exception 'This is your own composition' using errcode = '22023';
  end if;
  if public.licence_rank(p_composition) >= need then
    raise exception 'You already hold this licence' using errcode = '23505';
  end if;
  insert into public.licences (buyer_id, kind, composition_id, seller_id, composer_id, price, is_demo, payment_ref)
  values (auth.uid(), p_kind, c.id, c.owner_id, c.owner_id,
          case p_kind when 'listen' then c.price_listen when 'perform' then c.price_perform else c.price_teach end,
          true, 'demo')
  returning * into result;
  return result;
end $$;

create or replace function public.purchase_choreography(p_choreography uuid)
returns public.licences language plpgsql security definer set search_path = '' as $$
declare
  ch public.choreographies;
  composer uuid;
  result public.licences;
begin
  if auth.uid() is null then
    raise exception 'Sign in to license a choreography' using errcode = '28000';
  end if;
  if not exists (select 1 from public.members m where m.id = auth.uid()) then
    raise exception 'Create your profile first' using errcode = '22023';
  end if;
  select * into ch from public.choreographies where id = p_choreography;
  if not found then
    raise exception 'This choreography is no longer available' using errcode = 'P0002';
  end if;
  if ch.owner_id = auth.uid() then
    raise exception 'This is your own choreography' using errcode = '22023';
  end if;
  if exists (select 1 from public.licences l where l.buyer_id = auth.uid() and l.choreography_id = ch.id) then
    raise exception 'You already hold this licence' using errcode = '23505';
  end if;
  select owner_id into composer from public.compositions where id = ch.composition_id;
  insert into public.licences (buyer_id, kind, composition_id, choreography_id, seller_id, composer_id, price, is_demo, payment_ref)
  values (auth.uid(), 'choreo', ch.composition_id, ch.id, ch.owner_id, composer, ch.price, true, 'demo')
  returning * into result;
  return result;
end $$;

-- The signed-in person's sales, with their share of each.
create or replace function public.my_sales()
returns table (
  licence_id uuid, sold_at timestamptz, kind text, price numeric, share numeric, is_demo boolean,
  composition_id uuid, composition_title text, choreography_title text, buyer_name text,
  as_seller boolean, as_composer boolean)
language sql stable security definer set search_path = '' as $$
  select l.id, l.created_at, l.kind, l.price,
         public.revenue_share(l.kind, l.price, l.seller_id = auth.uid(), l.composer_id = auth.uid()),
         l.is_demo, l.composition_id, c.title, ch.title, coalesce(b.name, 'Former member'),
         l.seller_id = auth.uid(), l.composer_id = auth.uid()
    from public.licences l
    left join public.compositions c on c.id = l.composition_id
    left join public.choreographies ch on ch.id = l.choreography_id
    left join public.members b on b.id = l.buyer_id
   where auth.uid() is not null and (l.seller_id = auth.uid() or l.composer_id = auth.uid())
   order by l.created_at desc
$$;

-- Function grants: purchases and private reads for signed-in people only; helpers for nobody outside the database.
revoke execute on function public.unique_slug(text, regclass, text) from public, anon, authenticated;
revoke execute on function public.purchase_licence(uuid, text), public.purchase_choreography(uuid), public.my_sales() from public, anon;
grant execute on function public.purchase_licence(uuid, text), public.purchase_choreography(uuid), public.my_sales() to authenticated;
