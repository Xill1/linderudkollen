# Linderudkollen Sportsstue

Nettsiden til Linderudkollen Sportsstue i Lillomarka, med admin-panel for meny, blogg, bilder, tekster, åpningstider og brukere.

- **Frontend:** React 19 + Vite + Tailwind, ligger i `frontend/`. Hostes på Vercel.
- **Database, innlogging og bildelager:** Supabase (prosjekt `linderudkollen`, region Stockholm). Ingen egen backend-server.
- **Skjema og serverkode:** `supabase/migrations/` (SQL) og `supabase/functions/admin-users/` (brukeradministrasjon).

## Kjøre lokalt

```bash
cd frontend
cp .env.example .env.local        # inneholder Supabase-URL og publiserbar nøkkel
npm install
npm run dev                       # http://localhost:3000
```

`npm run build` lager produksjonsbygget i `frontend/dist/`.

## Deploy på Vercel

1. Importer GitHub-repoet i Vercel.
2. **Root Directory:** `frontend`. Framework oppdages som Vite.
3. **Environment Variables:** `VITE_SUPABASE_URL` og `VITE_SUPABASE_ANON_KEY` (verdiene står i `frontend/.env.example`).
4. Deploy. `frontend/vercel.json` sørger for at alle ruter går til `index.html`.
5. Domene: legg til domenet under *Settings → Domains* og opprett CNAME-posten Vercel oppgir hos domeneleverandøren.

## Admin-panel

`/admin/login`. Brukernavn og passord, ikke e-post. Den første brukeren som ble opprettet er **hovedadmin** og kan ikke slettes; bare hovedadmin ser aktivitetsloggen. Nye brukere opprettes under *Brukere* i panelet.

Passord glemt? Sett nytt passord i Supabase-dashbordet under *Authentication → Users* (brukeren heter `<brukernavn>@linderudkollen.local`).

## Slik henger det sammen

| Hva | Hvor |
|---|---|
| Alt datakall fra frontend | `frontend/src/lib/db.js` |
| Tabeller, tilgangsregler (RLS), logg-triggere, bildelager | `supabase/migrations/20260925000000_init.sql` |
| Startdata (meny, åpningstider, bildeplasser) | `supabase/migrations/20260925000001_seed.sql` |
| Opprette, endre og slette brukere | `supabase/functions/admin-users/index.ts` |

Tilgangsregler i korte trekk: alle kan lese publisert innhold; bare innloggede admin-brukere kan skrive; upubliserte blogginnlegg er skjult for andre. Bilder ligger i Storage-bucketen `images` og er offentlig lesbare.

### Endre skjemaet

Legg til en ny fil i `supabase/migrations/` og kjør den mot prosjektet (Supabase-dashbordet → SQL Editor, eller `supabase db push` med CLI). Ikke rediger gamle migrasjoner som allerede er kjørt.

### Edge Function

`admin-users` deployes med Supabase CLI: `supabase functions deploy admin-users --no-verify-jwt` (funksjonen verifiserer innlogging selv). Den bruker prosjektets service-nøkkel, som Supabase gir den automatisk.
