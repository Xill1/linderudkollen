-- Linderudkollen Sportsstue: skjema, sikkerhet (RLS), logging og bildelager.
-- Kjøres én gang mot et tomt Supabase-prosjekt.

create extension if not exists citext with schema extensions;
create extension if not exists moddatetime with schema extensions;

-- ═══════════════════════════════════════════
-- Brukere
-- ═══════════════════════════════════════════
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  username    extensions.citext not null unique,
  name        text not null default '',
  role        text not null default 'admin' check (role in ('admin')),
  is_owner    boolean not null default false,
  created_at  timestamptz not null default now()
);
create unique index profiles_single_owner on public.profiles (is_owner) where is_owner;

-- Første bruker som opprettes blir hovedadmin.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, username, name, is_owner)
  values (
    new.id,
    lower(coalesce(nullif(new.raw_user_meta_data->>'username', ''), split_part(new.email, '@', 1))),
    coalesce(new.raw_user_meta_data->>'name', ''),
    not exists (select 1 from public.profiles)
  );
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function public.is_owner()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and is_owner);
$$;

-- ═══════════════════════════════════════════
-- Aktivitetslogg (skrives kun av triggere og RPC-er)
-- ═══════════════════════════════════════════
create table public.activity_log (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid,
  username    text not null default '',
  name        text not null default '',
  action      text not null,
  target      text not null default '',
  created_at  timestamptz not null default now()
);
create index activity_log_created_at on public.activity_log (created_at desc);

create or replace function public.write_log(p_action text, p_target text default '')
returns void language plpgsql security definer set search_path = public as $$
declare v_profile public.profiles;
begin
  if current_setting('app.skip_log', true) = 'on' then return; end if;
  if auth.uid() is null then return; end if;
  select * into v_profile from public.profiles where id = auth.uid();
  insert into public.activity_log (user_id, username, name, action, target)
  values (auth.uid(), coalesce(v_profile.username::text, ''), coalesce(v_profile.name, ''), p_action, coalesce(p_target, ''));
end $$;
revoke execute on function public.write_log(text, text) from public, anon, authenticated;

-- Generisk radlogging. Argumenter: (etikett, kolonne som brukes som "target").
-- Hopper over oppdateringer som bare endrer sort_order/updated_at (rekkefølge logges av reorder_rows).
create or replace function public.log_row_change()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_label   text := tg_argv[0];
  v_col     text := tg_argv[1];
  v_action  text;
  v_row     jsonb;
  v_old     jsonb;
begin
  if current_setting('app.skip_log', true) = 'on' then return null; end if;
  if tg_op = 'DELETE' then
    v_row := to_jsonb(old);
    v_action := 'Slettet ' || v_label;
  elsif tg_op = 'INSERT' then
    v_row := to_jsonb(new);
    v_action := 'La til ' || v_label;
  else
    v_row := to_jsonb(new);
    v_old := to_jsonb(old);
    if (v_row - 'sort_order' - 'updated_at') = (v_old - 'sort_order' - 'updated_at') then return null; end if;
    if (v_row ? 'is_deleted') and (v_row->>'is_deleted')::boolean and not (v_old->>'is_deleted')::boolean then
      v_action := 'Slettet ' || v_label;
    else
      v_action := 'Oppdaterte ' || v_label;
    end if;
  end if;
  perform public.write_log(v_action, coalesce(v_row->>v_col, ''));
  return null;
end $$;

create or replace function public.log_statement()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.write_log(tg_argv[0], '');
  return null;
end $$;

-- ═══════════════════════════════════════════
-- Meny
-- ═══════════════════════════════════════════
create table public.menu_categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (length(trim(name)) between 1 and 60),
  sort_order  integer not null default 0,
  icon        text check (icon is null or icon in (
                'coffee','wheat','soup','leaf','cup-soda','utensils-crossed','flame','cake',
                'sandwich','apple','wine','cookie','pizza','star','sun','gift')),
  is_deleted  boolean not null default false,
  created_at  timestamptz not null default now()
);
create unique index menu_categories_active_name on public.menu_categories (lower(name)) where not is_deleted;

create table public.menu_items (
  id            uuid primary key default gen_random_uuid(),
  category_id   uuid not null references public.menu_categories(id),
  name          text not null check (length(trim(name)) between 1 and 120),
  description   text not null default '',
  price         numeric(8,2) check (price is null or price >= 0),
  is_available  boolean not null default true,
  sort_order    integer not null default 0,
  allergens     text[] not null default '{}',
  is_deleted    boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index menu_items_category on public.menu_items (category_id) where not is_deleted;

create trigger menu_items_set_updated before update on public.menu_items
  for each row execute function extensions.moddatetime(updated_at);

create or replace function public.guard_category_delete()
returns trigger language plpgsql as $$
begin
  if new.is_deleted and not old.is_deleted
     and exists (select 1 from public.menu_items where category_id = old.id and not is_deleted) then
    raise exception 'Kategorien «%» har fortsatt varer. Flytt eller slett varene først.', old.name
      using errcode = 'check_violation';
  end if;
  return new;
end $$;
create trigger menu_categories_guard_delete before update on public.menu_categories
  for each row execute function public.guard_category_delete();

create trigger menu_items_log after insert or update on public.menu_items
  for each row execute function public.log_row_change('meny-vare', 'name');
create trigger menu_categories_log after insert or update on public.menu_categories
  for each row execute function public.log_row_change('kategori', 'name');

-- Rekkefølge for meny-varer, kategorier og slideshow i ett kall.
create or replace function public.reorder_rows(p_table text, p_items jsonb)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_item jsonb;
  v_label text;
begin
  if not public.is_admin() then raise exception 'Ikke tilgang' using errcode = 'insufficient_privilege'; end if;
  v_label := case p_table
    when 'menu_items' then 'Omorganiserte meny-varer'
    when 'menu_categories' then 'Omorganiserte kategorier'
    when 'arrangement_slides' then 'Omorganiserte slideshow (arrangement)'
    else null end;
  if v_label is null then raise exception 'Ukjent tabell' using errcode = 'invalid_parameter_value'; end if;
  if jsonb_typeof(p_items) <> 'array' then raise exception 'Ugyldig liste' using errcode = 'invalid_parameter_value'; end if;

  for v_item in select * from jsonb_array_elements(p_items) loop
    execute format('update public.%I set sort_order = $1 where id = $2', p_table)
      using (v_item->>'sort_order')::integer, (v_item->>'id')::uuid;
  end loop;
  perform public.write_log(v_label, '');
end $$;

-- Erstatter hele menyen med innholdet i en eksportfil. Godtar både ny (category_id)
-- og gammel (category = navn) form på varene.
create or replace function public.import_menu(p_categories jsonb, p_items jsonb)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_cat   jsonb;
  v_item  jsonb;
  v_cat_id uuid;
  v_ncat  integer := 0;
  v_nitem integer := 0;
  v_idx   integer := 0;
begin
  if not public.is_admin() then raise exception 'Ikke tilgang' using errcode = 'insufficient_privilege'; end if;
  if jsonb_typeof(p_categories) <> 'array' or jsonb_typeof(p_items) <> 'array' then
    raise exception 'Filen må inneholde «categories» og «items» som lister' using errcode = 'invalid_parameter_value';
  end if;
  perform set_config('app.skip_log', 'on', true);

  update public.menu_items set is_deleted = true where not is_deleted;
  update public.menu_categories set is_deleted = true where not is_deleted;

  for v_cat in select * from jsonb_array_elements(p_categories) loop
    v_idx := v_idx + 1;
    insert into public.menu_categories (id, name, sort_order, icon, is_deleted)
    values (
      coalesce((v_cat->>'id')::uuid, gen_random_uuid()),
      trim(v_cat->>'name'),
      coalesce((v_cat->>'sort_order')::integer, v_idx),
      nullif(v_cat->>'icon', ''),
      false
    )
    on conflict (id) do update set
      name = excluded.name, sort_order = excluded.sort_order, icon = excluded.icon, is_deleted = false;
    v_ncat := v_ncat + 1;
  end loop;

  v_idx := 0;
  for v_item in select * from jsonb_array_elements(p_items) loop
    v_idx := v_idx + 1;
    v_cat_id := (v_item->>'category_id')::uuid;
    if v_cat_id is null and v_item ? 'category' then
      select id into v_cat_id from public.menu_categories
        where not is_deleted and lower(name) = lower(trim(v_item->>'category')) limit 1;
    end if;
    if v_cat_id is null or not exists (select 1 from public.menu_categories where id = v_cat_id and not is_deleted) then
      raise exception 'Varen «%» peker på en kategori som ikke finnes i filen', coalesce(v_item->>'name', '?')
        using errcode = 'invalid_parameter_value';
    end if;
    insert into public.menu_items (id, category_id, name, description, price, is_available, sort_order, allergens, is_deleted)
    values (
      coalesce((v_item->>'id')::uuid, gen_random_uuid()),
      v_cat_id,
      trim(v_item->>'name'),
      coalesce(v_item->>'description', ''),
      nullif(v_item->>'price', '')::numeric,
      coalesce((v_item->>'is_available')::boolean, true),
      coalesce((v_item->>'sort_order')::integer, v_idx),
      coalesce((select array_agg(x) from jsonb_array_elements_text(coalesce(v_item->'allergens', '[]'::jsonb)) x), '{}'),
      false
    )
    on conflict (id) do update set
      category_id = excluded.category_id, name = excluded.name, description = excluded.description,
      price = excluded.price, is_available = excluded.is_available, sort_order = excluded.sort_order,
      allergens = excluded.allergens, is_deleted = false;
    v_nitem := v_nitem + 1;
  end loop;

  perform set_config('app.skip_log', 'off', true);
  perform public.write_log('Importerte meny', v_ncat || ' kategorier, ' || v_nitem || ' varer');
  return jsonb_build_object('categories', v_ncat, 'items', v_nitem);
end $$;

-- ═══════════════════════════════════════════
-- Åpningstider (én rad)
-- ═══════════════════════════════════════════
create table public.opening_hours (
  id           text primary key default 'current' check (id = 'current'),
  period       text not null default '',
  schedule     jsonb not null default '[]' check (jsonb_typeof(schedule) = 'array'),
  notices      jsonb not null default '[]' check (jsonb_typeof(notices) = 'array'),
  footer_note  text not null default '',
  updated_at   timestamptz not null default now()
);
create trigger opening_hours_set_updated before update on public.opening_hours
  for each row execute function extensions.moddatetime(updated_at);
create trigger opening_hours_log after update on public.opening_hours
  for each statement execute function public.log_statement('Oppdaterte åpningstider');

-- ═══════════════════════════════════════════
-- Tekster (nøkkel/verdi)
-- ═══════════════════════════════════════════
create table public.site_text (
  key         text primary key check (key ~ '^[a-z0-9_]{1,60}$'),
  value       text not null default '',
  updated_at  timestamptz not null default now()
);
create trigger site_text_set_updated before update on public.site_text
  for each row execute function extensions.moddatetime(updated_at);
create trigger site_text_log after insert or update on public.site_text
  for each statement execute function public.log_statement('Oppdaterte tekster');

-- ═══════════════════════════════════════════
-- Faste bildeplasser
-- ═══════════════════════════════════════════
create table public.site_images (
  slot          text primary key check (slot in (
                  'hero_bakgrunn','om_oss_bilde','menu_hero','arrangement_hero','arrangement_tilbyr',
                  'arrangement_galleri_1','arrangement_galleri_2','arrangement_galleri_3','arrangement_galleri_4')),
  storage_path  text,
  focus_x       smallint not null default 50 check (focus_x between 0 and 100),
  focus_y       smallint not null default 50 check (focus_y between 0 and 100),
  updated_at    timestamptz not null default now()
);
create trigger site_images_set_updated before update on public.site_images
  for each row execute function extensions.moddatetime(updated_at);

create or replace function public.log_site_image_change()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.storage_path is distinct from old.storage_path then
    perform public.write_log(case when new.storage_path is null then 'Tilbakestilte bilde' else 'Lastet opp bilde' end, new.slot);
  elsif new.focus_x <> old.focus_x or new.focus_y <> old.focus_y then
    perform public.write_log('Endret bildefokus', new.slot);
  end if;
  return null;
end $$;
create trigger site_images_log after update on public.site_images
  for each row execute function public.log_site_image_change();

-- ═══════════════════════════════════════════
-- Slideshow (arrangement)
-- ═══════════════════════════════════════════
create table public.arrangement_slides (
  id            uuid primary key default gen_random_uuid(),
  storage_path  text not null,
  sort_order    integer,
  created_at    timestamptz not null default now()
);

create or replace function public.slides_default_sort_order()
returns trigger language plpgsql as $$
begin
  if new.sort_order is null then
    select coalesce(max(sort_order), 0) + 1 into new.sort_order from public.arrangement_slides;
  end if;
  return new;
end $$;
create trigger arrangement_slides_sort before insert on public.arrangement_slides
  for each row execute function public.slides_default_sort_order();
create trigger arrangement_slides_log after insert or delete on public.arrangement_slides
  for each row execute function public.log_row_change('slideshow-bilde (arrangement)', 'id');

-- ═══════════════════════════════════════════
-- Blogg
-- ═══════════════════════════════════════════
create table public.blog_posts (
  id                  uuid primary key default gen_random_uuid(),
  title               text not null check (length(trim(title)) between 1 and 200),
  body                text not null default '',
  image_path          text,
  is_published        boolean not null default false,
  category            text not null default 'Nyheter' check (category in ('Nyheter','Galleri','Om oss','Samarbeid')),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index blog_posts_published on public.blog_posts (created_at desc) where is_published;
create trigger blog_posts_set_updated before update on public.blog_posts
  for each row execute function extensions.moddatetime(updated_at);
create trigger blog_posts_log after insert or update or delete on public.blog_posts
  for each row execute function public.log_row_change('blogginnlegg', 'title');

-- ═══════════════════════════════════════════
-- Row Level Security
-- ═══════════════════════════════════════════
alter table public.profiles           enable row level security;
alter table public.activity_log       enable row level security;
alter table public.menu_categories    enable row level security;
alter table public.menu_items         enable row level security;
alter table public.opening_hours      enable row level security;
alter table public.site_text          enable row level security;
alter table public.site_images        enable row level security;
alter table public.arrangement_slides enable row level security;
alter table public.blog_posts         enable row level security;

create policy "profiles: innloggede leser"   on public.profiles for select to authenticated using (true);

create policy "log: hovedadmin leser"        on public.activity_log for select to authenticated using (public.is_owner());

create policy "kategorier: alle leser aktive" on public.menu_categories for select using (not is_deleted);
create policy "kategorier: admin legger til"  on public.menu_categories for insert to authenticated with check (public.is_admin());
create policy "kategorier: admin endrer"      on public.menu_categories for update to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "varer: alle leser aktive"      on public.menu_items for select using (not is_deleted);
create policy "varer: admin legger til"       on public.menu_items for insert to authenticated with check (public.is_admin());
create policy "varer: admin endrer"           on public.menu_items for update to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "åpningstider: alle leser"      on public.opening_hours for select using (true);
create policy "åpningstider: admin endrer"    on public.opening_hours for update to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "tekster: alle leser"           on public.site_text for select using (true);
create policy "tekster: admin legger til"     on public.site_text for insert to authenticated with check (public.is_admin());
create policy "tekster: admin endrer"         on public.site_text for update to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "bilder: alle leser"            on public.site_images for select using (true);
create policy "bilder: admin endrer"          on public.site_images for update to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "slides: alle leser"            on public.arrangement_slides for select using (true);
create policy "slides: admin legger til"      on public.arrangement_slides for insert to authenticated with check (public.is_admin());
create policy "slides: admin endrer"          on public.arrangement_slides for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "slides: admin sletter"         on public.arrangement_slides for delete to authenticated using (public.is_admin());

create policy "blogg: publiserte er åpne"     on public.blog_posts for select using (is_published or public.is_admin());
create policy "blogg: admin legger til"       on public.blog_posts for insert to authenticated with check (public.is_admin());
create policy "blogg: admin endrer"           on public.blog_posts for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "blogg: admin sletter"          on public.blog_posts for delete to authenticated using (public.is_admin());

-- ═══════════════════════════════════════════
-- Bildelager
-- ═══════════════════════════════════════════
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('images', 'images', true, 10485760, array['image/jpeg','image/png','image/webp','image/gif']);

create policy "images: alle leser"     on storage.objects for select using (bucket_id = 'images');
create policy "images: admin laster opp" on storage.objects for insert to authenticated with check (bucket_id = 'images' and public.is_admin());
create policy "images: admin endrer"   on storage.objects for update to authenticated using (bucket_id = 'images' and public.is_admin());
create policy "images: admin sletter"  on storage.objects for delete to authenticated using (bucket_id = 'images' and public.is_admin());
