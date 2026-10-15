-- Access rules, purchases and earnings, checked against the seeded local database.
-- Run with: npm run test:db   (everything happens in one transaction that is rolled back)
\set ON_ERROR_STOP on
begin;

create function pg_temp.act_as(who text) returns void language plpgsql as $$
begin
  if who = 'anon' then
    perform set_config('request.jwt.claims', '{"role":"anon"}', true);
    set local role anon;
  else
    perform set_config('request.jwt.claims', json_build_object('sub', who, 'role', 'authenticated')::text, true);
    set local role authenticated;
  end if;
end $$;

create function pg_temp.expect_error(stmt text, code text) returns void language plpgsql as $$
begin
  execute stmt;
  raise exception 'expected error % from: %', code, stmt;
exception when others then
  if sqlstate = 'P0001' and sqlerrm like 'expected error%' then raise; end if;
  if code is not null and sqlstate <> code then
    raise exception 'expected % but got % (%) from: %', code, sqlstate, sqlerrm, stmt;
  end if;
end $$;

create function pg_temp.check(ok boolean, what text) returns void language plpgsql as $$
begin
  if not coalesce(ok, false) then raise exception 'FAILED: %', what; end if;
  raise notice 'ok: %', what;
end $$;

grant execute on all functions in schema pg_temp to anon, authenticated;

-- Fixed ids from seed.sql
\set meera '11111111-1111-4111-8111-111111111111'
\set arjun '22222222-2222-4222-8222-222222222222'
\set nalini '33333333-3333-4333-8333-333333333333'
\set kabir '44444444-4444-4444-8444-444444444444'
\set asha '55555555-5555-4555-8555-555555555555'

-- ------------------------------------------------------------ importer
select pg_temp.check((select (r -> 'before') = (r -> 'after') and (r -> 'skipped') = '[]'::jsonb from (select public.layakari_import_legacy() as r) x),
  'running the import a second time adds and skips nothing');

-- ------------------------------------------------------------ visitors (not signed in)
select pg_temp.act_as('anon');
select pg_temp.check((select count(*) = 8 from public.compositions), 'visitors see published compositions');
select pg_temp.check((select count(*) = 5 from public.members), 'visitors see public profiles');
select pg_temp.check((select count(*) = 3 from public.academies), 'visitors see academies');
select pg_temp.expect_error('select * from public.composition_notation', '42501');
select pg_temp.expect_error('select * from public.enrollments', '42501');
select pg_temp.check((select count(*) = 0 from public.licences), 'visitors see no purchases');
select pg_temp.expect_error($q$select public.purchase_licence('00000000-0000-0000-0000-000000000000', 'listen')$q$, '42501');
reset role;

-- ------------------------------------------------------------ notation access
select pg_temp.act_as(:'asha');
select pg_temp.check((select count(*) = 3 from public.composition_notation), 'Asha reads 3 notations: her licence plus what her level and the one below hold');
select pg_temp.check(public.academy_access((select id from public.compositions where slug = 'radha-kavitt')) = 'Nritya Sadhana Academy · Madhyama', 'academy access names the academy and level');
select pg_temp.check(public.academy_access((select id from public.compositions where slug = 'basant-tatkar-set')) is null, 'a pending request unlocks nothing');
select pg_temp.check(public.licence_rank((select id from public.compositions where slug = 'megh-malhar-paran')) = 2, 'a choreography licence counts as Perform');
reset role;

select pg_temp.act_as(:'kabir');
select pg_temp.check((select count(*) = 2 from public.composition_notation), 'Kabir reads only his own two notations');
reset role;

-- ------------------------------------------------------------ purchases
select pg_temp.act_as(:'asha');
select pg_temp.expect_error($q$insert into public.licences (buyer_id, kind, price) values ('55555555-5555-4555-8555-555555555555', 'teach', 0)$q$, '42501');
select pg_temp.expect_error($q$select public.purchase_licence((select id from public.compositions where slug = 'megh-malhar-paran'), 'listen')$q$, '23505');
select pg_temp.expect_error($q$select public.purchase_licence((select id from public.compositions where slug = 'megh-malhar-paran'), 'free')$q$, '22023');
select pg_temp.check((select (public.purchase_licence((select id from public.compositions where slug = 'megh-malhar-paran'), 'teach')).price = 99), 'Teach costs what the composer set, not what the buyer sends');
select pg_temp.check(public.licence_rank((select id from public.compositions where slug = 'megh-malhar-paran')) = 3, 'Teach now included');
select pg_temp.check((select (public.purchase_licence((select id from public.compositions where slug = 'basant-tatkar-set'), 'listen')).is_demo), 'purchases are marked demo');
select pg_temp.check((select count(*) = 4 from public.composition_notation), 'a new licence unlocks that notation');
select pg_temp.expect_error($q$select public.purchase_choreography((select id from public.choreographies where title = 'Varsha'))$q$, '23505');
select pg_temp.check((select count(*) = 4 from public.licences), 'Asha sees her own 4 purchases');
reset role;

select pg_temp.act_as(:'meera');
select pg_temp.expect_error($q$select public.purchase_licence((select id from public.compositions where slug = 'megh-malhar-paran'), 'listen')$q$, '22023');
reset role;

-- ------------------------------------------------------------ earnings
select pg_temp.act_as(:'meera');
select pg_temp.check((select sum(share) = 1.60 + 79.20 + 2.25 + 79.20 from public.my_sales()), 'Meera: 80% of Listen and two Teach licences, 15% of the Varsha choreography');
select pg_temp.check((select count(*) = 4 from public.my_sales()), 'Meera sees four sales');
reset role;
select pg_temp.act_as(:'arjun');
select pg_temp.check((select sum(share) = 10.50 from public.my_sales()), 'Arjun keeps 70% of his choreography');
select pg_temp.check((select bool_and(buyer_name = 'Asha Rao') from public.my_sales()), 'sales show the buyer name');
reset role;
select pg_temp.check(public.revenue_share('choreo', 100, true, true) = 85, 'a composer who choreographs their own piece gets 85%');

-- ------------------------------------------------------------ profiles and compositions
select pg_temp.act_as(:'asha');
update public.members set name = 'Hacked' where id = :'meera';
select pg_temp.check((select name = 'Meera Iyer' from public.members where id = :'meera'), 'nobody edits someone else''s profile');
select pg_temp.expect_error($q$insert into public.compositions (owner_id, title, form, taal, laya) values ('11111111-1111-4111-8111-111111111111', 'Fake', 'Paran', 'teentaal', 'Madhya')$q$, '42501');
reset role;

select pg_temp.act_as(:'kabir');
insert into public.compositions (owner_id, title, form, taal, laya, status) values (:'kabir', 'Draft Kaida', 'Kaida', 'teentaal', 'Madhya', 'draft');
select pg_temp.check((select slug = 'draft-kaida' from public.compositions where title = 'Draft Kaida'), 'slugs come from titles');
insert into public.compositions (owner_id, title, form, taal, laya) values (:'kabir', 'Megh Malhar Paran', 'Paran', 'teentaal', 'Madhya');
select pg_temp.check((select count(*) = 1 from public.compositions where slug = 'megh-malhar-paran-2'), 'a repeated title gets a numbered slug');
insert into public.composition_notation (composition_id, bols) values ((select id from public.compositions where slug = 'megh-malhar-paran-2'), E'Line one\nLine two\n');
select pg_temp.check((select preview = 'Line one' and line_count = 2 from public.compositions where slug = 'megh-malhar-paran-2'), 'preview and line count follow the notation');
reset role;
select pg_temp.act_as(:'asha');
select pg_temp.check((select count(*) = 0 from public.compositions where title = 'Draft Kaida'), 'drafts are private');
reset role;

-- ------------------------------------------------------------ academies
select pg_temp.act_as(:'kabir');
select pg_temp.expect_error($q$insert into public.level_pieces (level_id, composition_id) values ((select id from public.academy_levels where legacy_key = '44444444-4444-4444-8444-444444444444:k1'), (select id from public.compositions where slug = 'radha-kavitt'))$q$, '42501');
select pg_temp.check((select count(*) = 1 from public.enrollments), 'a guru sees requests to their own academy only');
reset role;

select pg_temp.act_as(:'nalini');
insert into public.level_pieces (level_id, composition_id)
values ((select id from public.academy_levels where legacy_key = '33333333-3333-4333-8333-333333333333:n3'), (select id from public.compositions where slug = 'megh-malhar-paran'));
select pg_temp.check(true, 'a guru with a Teach licence can release that piece');
select pg_temp.expect_error($q$update public.enrollments set level_id = (select id from public.academy_levels where legacy_key = '44444444-4444-4444-8444-444444444444:k1') where student_id = '55555555-5555-4555-8555-555555555555'$q$, '22023');
delete from public.academy_levels where legacy_key = '33333333-3333-4333-8333-333333333333:n2';
select pg_temp.check((select l.name = 'Prarambhik' and e.status = 'active' from public.enrollments e join public.academy_levels l on l.id = e.level_id where e.student_id = :'asha'), 'deleting a level moves its students to the first level');
reset role;

select pg_temp.act_as(:'asha');
update public.enrollments set status = 'active' where academy_id = (select id from public.academies where name = 'Taal Ghar Tabla School');
select pg_temp.check((select status = 'pending' from public.enrollments where academy_id = (select id from public.academies where name = 'Taal Ghar Tabla School')), 'a student can''t accept themselves');
select pg_temp.expect_error($q$insert into public.enrollments (academy_id, student_id) values ((select id from public.academies where name = 'Meera Iyer Kathak'), '55555555-5555-4555-8555-555555555555')$q$, '42501');
delete from public.enrollments where academy_id = (select id from public.academies where name = 'Taal Ghar Tabla School');
select pg_temp.check((select count(*) = 1 from public.enrollments), 'a student can withdraw a request');
insert into public.enrollments (academy_id, student_id) values ((select id from public.academies where name = 'Taal Ghar Tabla School'), :'asha');
select pg_temp.check((select count(*) = 2 from public.enrollments), 'and ask again');
reset role;

select pg_temp.act_as(:'meera');
delete from public.academies where guru_id = :'meera';
select pg_temp.check((select count(*) = 2 from public.academies), 'a guru can close down their academy');
reset role;

rollback;
