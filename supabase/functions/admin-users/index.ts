// Brukeradministrasjon for admin-panelet. Krever service-rollen, derfor Edge Function.
// Handlinger: bootstrap (kun når ingen brukere finnes), create, update, delete.
import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const EMAIL_DOMAIN = "linderudkollen.local";
const USERNAME_RE = /^[a-z0-9._-]{2,32}$/;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

class HttpError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

function normalizeUsername(raw: unknown): string {
  const u = String(raw ?? "").trim().toLowerCase();
  if (!USERNAME_RE.test(u)) {
    throw new HttpError(400, "Brukernavn må være 2–32 tegn: små bokstaver, tall, punktum, bindestrek eller understrek");
  }
  return u;
}

function checkPassword(raw: unknown): string {
  const p = String(raw ?? "");
  if (p.length < 8) throw new HttpError(400, "Passordet må ha minst 8 tegn");
  return p;
}

function mapAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("already") && (m.includes("registered") || m.includes("exists"))) return "Brukernavnet er allerede i bruk";
  if (m.includes("password")) return "Passordet ble ikke godtatt";
  return message;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json(405, { error: "Bare POST" });

  const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });

  try {
    const body = await req.json().catch(() => ({}));
    const action = String(body.action ?? "");

    // ── Bootstrap: første bruker, kun når profiles er tom ──
    if (action === "bootstrap") {
      const { count } = await admin.from("profiles").select("id", { count: "exact", head: true });
      if ((count ?? 0) > 0) throw new HttpError(403, "Det finnes allerede brukere");
      const username = normalizeUsername(body.username);
      const password = checkPassword(body.password);
      const { data, error } = await admin.auth.admin.createUser({
        email: `${username}@${EMAIL_DOMAIN}`,
        password,
        email_confirm: true,
        user_metadata: { username, name: String(body.name ?? "") },
      });
      if (error) throw new HttpError(400, mapAuthError(error.message));
      return json(200, { id: data.user.id, username });
    }

    // ── Alle andre handlinger krever innlogget admin ──
    const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
    if (!token) throw new HttpError(401, "Ikke innlogget");
    const { data: { user: caller }, error: callerErr } = await admin.auth.getUser(token);
    if (callerErr || !caller) throw new HttpError(401, "Ikke innlogget");

    const { data: callerProfile } = await admin.from("profiles").select("id, username, name, role, is_owner").eq("id", caller.id).maybeSingle();
    if (!callerProfile || callerProfile.role !== "admin") throw new HttpError(403, "Bare admin");

    const log = async (actionText: string, target: string) => {
      await admin.from("activity_log").insert({
        user_id: callerProfile.id, username: callerProfile.username, name: callerProfile.name ?? "",
        action: actionText, target,
      });
    };

    if (action === "create") {
      const username = normalizeUsername(body.username);
      const password = checkPassword(body.password);
      const name = String(body.name ?? "").trim();
      const { data, error } = await admin.auth.admin.createUser({
        email: `${username}@${EMAIL_DOMAIN}`,
        password,
        email_confirm: true,
        user_metadata: { username, name },
      });
      if (error) throw new HttpError(400, mapAuthError(error.message));
      await log("La til bruker", username);
      return json(200, { id: data.user.id, username, name, role: "admin" });
    }

    if (action === "update" || action === "delete") {
      const id = String(body.id ?? "");
      if (!id) throw new HttpError(400, "Mangler bruker-id");
      const { data: target } = await admin.from("profiles").select("id, username, name, is_owner").eq("id", id).maybeSingle();
      if (!target) throw new HttpError(404, "Bruker ikke funnet");

      if (action === "delete") {
        if (target.id === callerProfile.id) throw new HttpError(400, "Du kan ikke slette deg selv");
        if (target.is_owner) throw new HttpError(403, "Hovedadmin kan ikke slettes");
        const { error } = await admin.auth.admin.deleteUser(target.id);
        if (error) throw new HttpError(400, mapAuthError(error.message));
        await log("Slettet bruker", target.username);
        return json(200, { ok: true });
      }

      if (target.is_owner && target.id !== callerProfile.id) throw new HttpError(403, "Bare hovedadmin kan endre hovedadmin");

      const authPatch: Record<string, unknown> = {};
      const profilePatch: Record<string, unknown> = {};
      const meta: Record<string, unknown> = {};

      if (body.username !== undefined) {
        const username = normalizeUsername(body.username);
        if (username !== target.username) {
          const { data: taken } = await admin.from("profiles").select("id").eq("username", username).neq("id", target.id).maybeSingle();
          if (taken) throw new HttpError(400, "Brukernavnet er allerede i bruk");
          authPatch.email = `${username}@${EMAIL_DOMAIN}`;
          profilePatch.username = username;
          meta.username = username;
        }
      }
      if (body.name !== undefined) {
        const name = String(body.name ?? "").trim();
        profilePatch.name = name;
        meta.name = name;
      }
      if (body.password) authPatch.password = checkPassword(body.password);
      if (Object.keys(meta).length) authPatch.user_metadata = meta;

      if (Object.keys(authPatch).length) {
        const { error } = await admin.auth.admin.updateUserById(target.id, authPatch);
        if (error) throw new HttpError(400, mapAuthError(error.message));
      }
      if (Object.keys(profilePatch).length) {
        const { error } = await admin.from("profiles").update(profilePatch).eq("id", target.id);
        if (error) throw new HttpError(400, error.message);
      }
      await log("Oppdaterte bruker", (profilePatch.username as string) ?? target.username);
      return json(200, { id: target.id, username: (profilePatch.username as string) ?? target.username, name: (profilePatch.name as string) ?? target.name, role: "admin" });
    }

    throw new HttpError(400, "Ukjent handling");
  } catch (e) {
    if (e instanceof HttpError) return json(e.status, { error: e.message });
    console.error(e);
    return json(500, { error: "Noe gikk galt på serveren" });
  }
});
