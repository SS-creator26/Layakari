-- LOCAL DEVELOPMENT AND TESTS ONLY. Never run against the live project.
-- Creates five sign-in accounts (password: layakari-demo) and writes their data the way the
-- current site does (JSON blobs), then runs the importer, so local data takes the same path real data will.

create extension if not exists pgcrypto;

insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
                        raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
                        confirmation_token, recovery_token, email_change_token_new, email_change)
select '00000000-0000-0000-0000-000000000000', u.id::uuid, 'authenticated', 'authenticated', u.email,
       crypt('layakari-demo', gen_salt('bf')), now(),
       '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''
  from (values
    ('11111111-1111-4111-8111-111111111111', 'meera@example.com'),
    ('22222222-2222-4222-8222-222222222222', 'arjun@example.com'),
    ('33333333-3333-4333-8333-333333333333', 'nalini@example.com'),
    ('44444444-4444-4444-8444-444444444444', 'kabir@example.com'),
    ('55555555-5555-4555-8555-555555555555', 'asha@example.com')) as u(id, email)
on conflict (id) do nothing;

insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
select gen_random_uuid(), u.id, u.id::text, jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true),
       'email', now(), now(), now()
  from auth.users u
 where u.email like '%@example.com'
   and not exists (select 1 from auth.identities i where i.user_id = u.id);

insert into public.profiles (id, data, updated_at) values
('11111111-1111-4111-8111-111111111111', $${
  "name": "Meera Iyer", "city": "Toronto, ON", "roles": ["composer", "guru"], "created": 1760000000000,
  "bio": "Kathak dancer and composer of the Jaipur gharana. Writes parans and tukdas for stage and for students.",
  "compositions": [
    {"id": "megh", "title": "Megh Malhar Paran", "type": "Paran", "taal": "teentaal", "laya": "Madhya", "bpm": 96, "created": 1760000001000,
     "prices": {"listen": 2, "perform": 25, "teach": 99},
     "bols": "Dha-ge-tita Kat-ta Gadi-gana Dha\nKran-dha Kran-dha Dha-ge Na-dha\nTira-kita Taka Dhum-kita Taka\nDha – Kran-dha Kran-dha Dha (×3)"},
    {"id": "barkha", "title": "Barkha Tukda", "type": "Tukda", "taal": "jhaptaal", "laya": "Madhya", "bpm": 88, "created": 1760000002000,
     "prices": {"listen": 1, "perform": 15, "teach": 69},
     "bols": "Ta Thei Thei Tat | Aa Thei\nThei Tat Ta | Thei Ta Thei\nTigdha Dig Dig Thei (×3)"}
  ],
  "choreographies": [],
  "academy": {"name": "Meera Iyer Kathak", "about": "Small-group Kathak focused on abhinaya and composition.", "fee": 45, "open": false,
    "created": 1760000003000, "roster": {}, "declined": {},
    "levels": [{"id": "m1", "name": "Prarambhik", "pieces": ["11111111-1111-4111-8111-111111111111:barkha"]},
               {"id": "m2", "name": "Madhyama", "pieces": []},
               {"id": "m3", "name": "Visharad", "pieces": []}]}
}$$, now()),
('22222222-2222-4222-8222-222222222222', $${
  "name": "Arjun Deshpande", "city": "Oakville, ON", "roles": ["composer", "choreographer"], "created": 1760000010000,
  "bio": "Tabla player turned choreographer. Sets fast footwork to long chakradars.",
  "compositions": [
    {"id": "chakra7", "title": "Chakradar Tihai No. 7", "type": "Chakradar", "taal": "teentaal", "laya": "Drut", "bpm": 132, "created": 1760000011000,
     "prices": {"listen": 2, "perform": 20, "teach": 79},
     "bols": "Dhit-ta Dhit-ta Kat-ta Ga-di\nGa-na Dha – Dhit-ta Dhit-ta\nKat-ta Ga-di Ga-na Dha –\n(whole phrase three times, landing on sam)"},
    {"id": "rela", "title": "Jhaptaal Rela", "type": "Rela", "taal": "jhaptaal", "laya": "Drut", "bpm": 140, "created": 1760000012000,
     "prices": {"listen": 2, "perform": 20, "teach": 79},
     "bols": "Dhira-dhira Kita-taka | Dhin-na\nTira-kita Dhira-dhira | Kita-taka Dhin-na\nTa – Dhira-dhira Kita-taka (×3)"}
  ],
  "choreographies": [
    {"id": "varsha", "title": "Varsha", "comp": "11111111-1111-4111-8111-111111111111:megh", "price": 15, "about": "Solo, about 4 minutes", "created": 1760000013000}
  ]
}$$, now()),
('33333333-3333-4333-8333-333333333333', $${
  "name": "Nalini Sharma", "city": "Vancouver, BC", "roles": ["composer", "guru"], "created": 1760000020000,
  "bio": "Runs Nritya Sadhana Academy. Thirty years teaching Kathak to children and adults.",
  "compositions": [
    {"id": "radha", "title": "Radha Kavitt", "type": "Kavitt", "taal": "rupak", "laya": "Vilambit", "bpm": 66, "created": 1760000021000,
     "prices": {"listen": 3, "perform": 20, "teach": 69},
     "bols": "Shyam kahe sun Radhe pyari\nBansi baje Yamuna kinare\nDha Ki Ta Dha | Thei Thei Tat\nTigdha Dig Dig Thei (×3)"},
    {"id": "gat", "title": "Ektaal Gat Nikas", "type": "Gat", "taal": "ektaal", "laya": "Madhya", "bpm": 84, "created": 1760000022000,
     "prices": {"listen": 2, "perform": 15, "teach": 69},
     "bols": "Ta – Thei – | Tat – Aa –\nThei Thei Tat | Ta Thei Thei\nGat walk: right, left, chakkar on sam"}
  ],
  "choreographies": [],
  "academy": {"name": "Nritya Sadhana Academy", "about": "Weekly Kathak classes for children and adults, from first tatkar to stage repertoire.",
    "fee": 40, "open": true, "created": 1760000023000,
    "roster": {"55555555-5555-4555-8555-555555555555": "n2"}, "declined": {},
    "levels": [{"id": "n1", "name": "Prarambhik", "pieces": ["33333333-3333-4333-8333-333333333333:gat"]},
               {"id": "n2", "name": "Madhyama", "pieces": ["33333333-3333-4333-8333-333333333333:radha", "11111111-1111-4111-8111-111111111111:megh"]},
               {"id": "n3", "name": "Visharad", "pieces": []}]}
}$$, now()),
('44444444-4444-4444-8444-444444444444', $${
  "name": "Kabir Sethi", "city": "Montréal, QC", "roles": ["tabla", "composer", "guru"], "created": 1760000030000,
  "bio": "Tabla soloist and accompanist. Teaches kaida and rela from the first bol.",
  "compositions": [
    {"id": "tatkar", "title": "Basant Tatkar Set", "type": "Tatkar", "taal": "teentaal", "laya": "Vilambit", "bpm": 60, "created": 1760000031000,
     "prices": {"listen": 1, "perform": 10, "teach": 49},
     "bols": "Ta Thei Thei Tat | Aa Thei Thei Tat\nTa Thei Thei Tat | Aa Thei Thei Tat\nThen dugun and chaugun"},
    {"id": "peshkar", "title": "Dhamar Peshkar", "type": "Peshkar", "taal": "dhamar", "laya": "Vilambit", "bpm": 58, "created": 1760000032000,
     "prices": {"listen": 2, "perform": 15, "teach": 59},
     "bols": "Ka Dhi Ta Dhi Ta | Dha – \nGa Ti Ta | Ti Ta Ta –\nDhi – Ka Dhi Ta (×3)"}
  ],
  "choreographies": [],
  "academy": {"name": "Taal Ghar Tabla School", "about": "Tabla for beginners and accompanists, with kaida and rela built up level by level.",
    "fee": 35, "open": true, "created": 1760000033000, "roster": {}, "declined": {},
    "levels": [{"id": "k1", "name": "Prarambhik", "pieces": ["44444444-4444-4444-8444-444444444444:tatkar"]},
               {"id": "k2", "name": "Madhyama", "pieces": ["44444444-4444-4444-8444-444444444444:peshkar"]}]}
}$$, now()),
('55555555-5555-4555-8555-555555555555', $${
  "name": "Asha Rao", "city": "Calgary, AB", "roles": ["dancer", "student"], "created": 1760000040000,
  "bio": "Learning Kathak at Nritya Sadhana.", "compositions": [], "choreographies": []
}$$, now())
on conflict (id) do nothing;

insert into public.ledger (id, data, updated_at) values
('55555555-5555-4555-8555-555555555555', $${"items": [
  {"id": "a1", "key": "11111111-1111-4111-8111-111111111111:megh", "kind": "listen", "seller": "11111111-1111-4111-8111-111111111111", "price": 2, "at": 1760000050000},
  {"id": "a2", "key": "11111111-1111-4111-8111-111111111111:megh", "kind": "choreo", "chor": "22222222-2222-4222-8222-222222222222:varsha", "seller": "22222222-2222-4222-8222-222222222222", "price": 15, "at": 1760000051000}
]}$$, now()),
('33333333-3333-4333-8333-333333333333', $${"items": [
  {"id": "n1", "key": "11111111-1111-4111-8111-111111111111:megh", "kind": "teach", "seller": "11111111-1111-4111-8111-111111111111", "price": 99, "at": 1760000052000}
]}$$, now()),
('22222222-2222-4222-8222-222222222222', $${"items": [
  {"id": "r1", "key": "33333333-3333-4333-8333-333333333333:radha", "kind": "perform", "seller": "33333333-3333-4333-8333-333333333333", "price": 20, "at": 1760000053000}
]}$$, now())
on conflict (id) do nothing;

insert into public.enroll (id, data, updated_at) values
('55555555-5555-4555-8555-555555555555', $${"req": {
  "33333333-3333-4333-8333-333333333333": {"at": 1760000060000},
  "44444444-4444-4444-8444-444444444444": {"at": 1760000061000}
}}$$, now())
on conflict (id) do nothing;

select public.layakari_import_legacy() -> 'after' as imported;
