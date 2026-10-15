-- The three JSON-blob tables the current site (index.html) reads and writes.
-- They already exist on the live project, so every statement here is a no-op there.
-- They are declared so a fresh local or staging database matches the live one, and so the
-- import in 20261015000300_legacy_import.sql has something to read.
--
-- Shapes, as written by index.html:
--   profiles.data = {name, city, bio, roles[], created, updated,
--                    compositions: [{id, title, type, taal, laya, bpm, bols, prices:{listen,perform,teach}, created}],
--                    choreographies: [{id, title, comp:"<ownerId>:<compId>", price, about, created}],
--                    academy: {name, about, fee, open, created, roster:{studentId: levelId}, declined:{studentId:true},
--                              levels:[{id, name, pieces:["<ownerId>:<compId>"]}]}}
--   ledger.data   = {items: [{id, key:"<ownerId>:<compId>", kind: listen|perform|teach|choreo, chor?, seller, price, at}]}
--   enroll.data   = {req: {guruId: {at}}}

create table if not exists public.profiles (id uuid primary key, data jsonb, updated_at timestamptz);
create table if not exists public.ledger (id uuid primary key, data jsonb, updated_at timestamptz);
create table if not exists public.enroll (id uuid primary key, data jsonb, updated_at timestamptz);
