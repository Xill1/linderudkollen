-- Startdata: standardmeny, åpningstider og de ni faste bildeplassene.
-- Logging er av mens vi seeder (ingen innlogget bruker uansett).

do $$
declare
  c_bakst uuid; c_varm uuid; c_drikke uuid; c_spesielt uuid;
begin
  insert into public.menu_categories (name, sort_order, icon) values ('Bakst', 1, 'wheat')    returning id into c_bakst;
  insert into public.menu_categories (name, sort_order, icon) values ('Varm mat', 2, 'soup')  returning id into c_varm;
  insert into public.menu_categories (name, sort_order, icon) values ('Drikke', 3, 'coffee')  returning id into c_drikke;
  insert into public.menu_categories (name, sort_order, icon) values ('Spesielt', 4, 'leaf')  returning id into c_spesielt;

  insert into public.menu_items (category_id, name, description, price, sort_order) values
    (c_bakst,    'Surdeigbrød, påsmurt',     'Hjemmelaget surdeig med smør og pålegg',   79,  1),
    (c_bakst,    'Surdeigbrød, ta med hjem', 'Helt brød til å ta med',                  89,  2),
    (c_bakst,    'Kanelsnurr',               'Klassisk nybakt kanelsnurr',              49,  3),
    (c_bakst,    'Vaffel m/ syltetøy',       'Norsk vaffel med syltetøy og rømme',      59,  4),
    (c_varm,     'Dagens kraftsuppe',        'Varm, næringsrik suppe laget fra bunnen', 119, 1),
    (c_drikke,   'Kaffe',                    'Nybrygget filterkaffe',                   39,  1),
    (c_drikke,   'Kakao',                    'Varm kakao med krem',                     49,  2),
    (c_drikke,   'Te',                       'Utvalg av te-sorter',                     39,  3),
    (c_drikke,   'Fruktsmoothie',            'Frisk smoothie med sesongens frukter',    69,  4),
    (c_spesielt, 'Glutenfritt alternativ',   'Spør oss om dagens glutenfrie tilbud',    null, 1);
end $$;

insert into public.opening_hours (id, period, schedule, notices, footer_note) values (
  'current',
  '16.02.2026 — 21.06.2026',
  '[
    {"day":"Mandag","hours":"Stengt","closed":true},
    {"day":"Tirsdag","hours":"10:00 — 20:00","closed":false},
    {"day":"Onsdag","hours":"10:00 — 20:00","closed":false},
    {"day":"Torsdag","hours":"10:00 — 20:00","closed":false},
    {"day":"Fredag","hours":"10:00 — 20:00","closed":false},
    {"day":"Lørdag","hours":"10:00 — 16:00","closed":false},
    {"day":"Søndag","hours":"10:00 — 16:00","closed":false}
  ]'::jsonb,
  '["For oppdaterte åpningstider, sjekk vår Facebook-side","Kveldsåpent tirsdag til fredag med utvidede tider","Helårsvei med stor parkeringsplass"]'::jsonb,
  'Sjekk Facebook for eventuelle endringer i åpningstider'
);

insert into public.site_images (slot) values
  ('hero_bakgrunn'), ('om_oss_bilde'), ('menu_hero'), ('arrangement_hero'), ('arrangement_tilbyr'),
  ('arrangement_galleri_1'), ('arrangement_galleri_2'), ('arrangement_galleri_3'), ('arrangement_galleri_4');
