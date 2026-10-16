-- Layakari: bol vocabulary update
-- Run once in Supabase → SQL Editor → New query → paste all of this → Run. Safe to run more than once.
-- Needs the bols, bol_aliases and bol_components tables from the first bol vocabulary script.

-- 1. Let the app read the bol list (it is public reference data)
grant select on public.bols, public.bol_aliases, public.bol_components to anon, authenticated;

-- 2. Dhi is its own bol (Jhaptaal: Dhi Na Dhi Dhi Na), not another spelling of Dhin
delete from public.bol_aliases where lower(alias) = 'dhi';

-- 3. More bols used in compositions and thekas
insert into public.bols (canonical, devanagari, category, is_compound) values
  ('Dhi',  'धि',   'tabla_pakhawaj', false),
  ('Dhum', 'धुम',  'tabla_pakhawaj', false),
  ('Tu',   'तू',   'tabla_pakhawaj', false),
  ('Ka',   'क',    'tabla_pakhawaj', false),
  ('Ga',   'ग',    'tabla_pakhawaj', false),
  ('Di',   'दि',   'tabla_pakhawaj', false),
  ('Tita', 'तिट',  'tabla_pakhawaj', true),
  ('Tira', 'तिर',  'tabla_pakhawaj', true),
  ('Kita', 'किट',  'tabla_pakhawaj', true),
  ('Taka', 'तक',   'tabla_pakhawaj', true),
  ('Gadi', 'गदि',  'tabla_pakhawaj', true),
  ('Gana', 'गन',   'tabla_pakhawaj', true),
  ('Tete', 'तेटे', 'tabla_pakhawaj', true)
on conflict (canonical) do nothing;

-- 4. More alternate spellings
insert into public.bol_aliases (bol_id, alias)
select b.id, v.alias
from (values
  ('Dhi','Dhee'), ('Dhin','Dhinn'), ('Dhum','Dhoom'), ('Tu','Too'), ('Tu','Tun'), ('Tin','Tinn'),
  ('Tita','Tit'), ('Kita','Kit'), ('Taka','Tak'), ('Kat','Katt'), ('Tat','Tatt'),
  ('Thei','They'), ('Thei','Thay'), ('Tirakita','Tirkita'), ('Takita','Takit'),
  ('Tigda','Tigdha'), ('Tigda','Tigada'), ('Ki','Kee'), ('Ti','Tee'), ('Aa','Aah')
) as v(canonical, alias)
join public.bols b on b.canonical = v.canonical
on conflict do nothing;

-- 5. What each compound bol is made of, in order
insert into public.bol_components (compound_id, component_id, position)
select c.id, p.id, v.pos
from (values
  ('Tita','Ti',1), ('Tita','Ta',2),
  ('Tira','Ti',1), ('Tira','Ra',2),
  ('Kita','Ki',1), ('Kita','Ta',2),
  ('Taka','Ta',1), ('Taka','Ka',2),
  ('Gadi','Ga',1), ('Gadi','Di',2),
  ('Gana','Ga',1), ('Gana','Na',2),
  ('Tete','Te',1), ('Tete','Te',2),
  ('Kitataka','Ki',1), ('Kitataka','Ta',2), ('Kitataka','Ta',3), ('Kitataka','Ka',4),
  ('Dhirdhir','Dhi',1), ('Dhirdhir','Ra',2), ('Dhirdhir','Dhi',3), ('Dhirdhir','Ra',4)
) as v(compound, component, pos)
join public.bols c on c.canonical = v.compound
join public.bols p on p.canonical = v.component
on conflict do nothing;

-- Quick check: should return the id of Dhi, not Dhin
-- select resolve_bol('dhi');
