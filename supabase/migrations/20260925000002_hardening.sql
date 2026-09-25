-- Innstramming etter Supabase sin sikkerhetssjekk: interne funksjoner skal ikke kunne kalles via API-et.

alter function public.guard_category_delete() set search_path = public;
alter function public.slides_default_sort_order() set search_path = public;

-- Trigger-funksjoner kalles av databasen, aldri av klienter.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.log_row_change() from public, anon, authenticated;
revoke execute on function public.log_statement() from public, anon, authenticated;
revoke execute on function public.log_site_image_change() from public, anon, authenticated;
revoke execute on function public.guard_category_delete() from public, anon, authenticated;
revoke execute on function public.slides_default_sort_order() from public, anon, authenticated;

-- RPC-er krever innlogging (og sjekker admin selv).
revoke execute on function public.reorder_rows(text, jsonb) from public, anon;
revoke execute on function public.import_menu(jsonb, jsonb) from public, anon;

-- is_admin()/is_owner() må kunne kjøres av anon og authenticated fordi RLS-reglene bruker dem.
