-- The importer copes with messy blobs: it logs and skips rather than failing.
\set ON_ERROR_STOP on
begin;

create function pg_temp.check(ok boolean, what text) returns void language plpgsql as $$
begin
  if not coalesce(ok, false) then raise exception 'FAILED: %', what; end if;
  raise notice 'ok: %', what;
end $$;

insert into auth.users (instance_id, id, aud, role, email, encrypted_password, created_at, updated_at)
values ('00000000-0000-0000-0000-000000000000', '66666666-6666-4666-8666-666666666666', 'authenticated', 'authenticated', 'messy@example.com', '', now(), now());

insert into public.profiles (id, data, updated_at) values
('66666666-6666-4666-8666-666666666666', $${
  "name": "", "roles": ["composer", "astronaut"],
  "compositions": [
    {"id": "ok1", "title": "Odd Taal Piece", "type": "Bandish", "taal": "matta", "laya": "Ati-drut", "bpm": 900, "prices": {"listen": "abc"}, "bols": "One\nTwo"},
    {"title": "No id"}
  ],
  "choreographies": [{"id": "c1", "title": "Orphan", "comp": "nobody:nothing", "price": 10}],
  "academy": {"name": "Messy Academy", "open": false, "roster": {"77777777-7777-4777-8777-777777777777": "x"},
              "levels": [{"id": "l1", "name": "", "pieces": ["nobody:nothing", "66666666-6666-4666-8666-666666666666:ok1"]}]}
}$$, now()),
('99999999-9999-4999-8999-999999999999', '{"name": "Ghost"}', now());

insert into public.ledger (id, data, updated_at) values
('66666666-6666-4666-8666-666666666666', $${"items": [
  {"key": "11111111-1111-4111-8111-111111111111:megh", "kind": "listen", "seller": "11111111-1111-4111-8111-111111111111", "price": 2},
  {"id": "z", "key": "gone:gone", "kind": "teach", "price": 50},
  {"id": "w", "key": "x:y", "kind": "rent", "price": 5}
]}$$, now());

create temp table report as select public.layakari_import_legacy() as r;

select pg_temp.check((select r -> 'skipped' @> '[{"table":"profiles","id":"99999999-9999-4999-8999-999999999999"}]' from report), 'a profile with no sign-in account is skipped and reported');
select pg_temp.check((select name = 'Layakari member' and roles = '{composer}' from public.members where id = '66666666-6666-4666-8666-666666666666'), 'missing name gets a placeholder; unknown roles are dropped');
select pg_temp.check((select form = 'Paran' and taal = 'teentaal' and laya = 'Madhya' and bpm = 240 and price_listen = 2 and line_count = 2
                        from public.compositions where legacy_key = '66666666-6666-4666-8666-666666666666:ok1'), 'bad form, taal, laya, tempo and price fall back to defaults');
select pg_temp.check((select r -> 'skipped' @> '[{"table":"compositions","reason":"composition without an id"}]' from report), 'a composition without an id is reported');
select pg_temp.check((select composition_id is null from public.choreographies where legacy_key = '66666666-6666-4666-8666-666666666666:c1'), 'a choreography to a missing piece is kept, unlinked');
select pg_temp.check((select not open from public.academies where name = 'Messy Academy'), 'a closed academy stays closed');
select pg_temp.check((select name = 'Level 1' from public.academy_levels where legacy_key = '66666666-6666-4666-8666-666666666666:l1'), 'a nameless level gets a name');
select pg_temp.check((select count(*) = 1 from public.level_pieces lp join public.academy_levels l on l.id = lp.level_id where l.legacy_key = '66666666-6666-4666-8666-666666666666:l1'), 'only pieces that still exist are released');
select pg_temp.check((select count(*) = 2 from public.licences where buyer_id = '66666666-6666-4666-8666-666666666666'), 'purchases are kept even when the piece is gone; unknown kinds are skipped');
select pg_temp.check((select composer_id is null and price = 50 from public.licences where legacy_key = '66666666-6666-4666-8666-666666666666:z'), 'a sale of a deleted piece keeps its price');
select pg_temp.check((select r -> 'skipped' @> '[{"table":"ledger","reason":"unknown licence kind rent"}]' from report), 'unknown licence kinds are reported');

rollback;
