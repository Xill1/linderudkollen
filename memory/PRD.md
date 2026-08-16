# Linderudkollen Sportsstue — Nettside PRD

## Opprinnelig forespørsel
Brukeren ønsket først en moderne redesign av Ullevålseter-nettsiden, deretter en fullstendig omgjøring til **Linderudkollen Sportsstue** i Lillomarka, Oslo. Deretter ba brukeren om backend, admin-panel, kontaktskjema og bildegalleri.

## Produktbeskrivelse
En moderne, fullstack nettside for Linderudkollen Sportsstue — en kafé/sportsstue i Lillomarka, Oslo.

### Nøkkelfunksjoner
- **Offentlig nettside**: Hero, Om oss, Meny, Aktiviteter, Galleri, Løypekart, Åpningstider, Kontaktskjema, Footer
- **Bildegalleri**: Bilder lagret i Emergent Object Storage, servert via backend
- **Kontaktskjema**: Sender meldinger til database, admin kan lese/håndtere
- **Åpningstider**: Dynamisk fra database, redigerbart i admin-panel
- **Admin-panel**: Innlogging, galleriforvaltning (last opp/slett), meldinger, åpningstiderredigering
- **Løypekart**: Loyper.net iframe for Lillomarka

## Teknisk arkitektur
- **Frontend**: React + Tailwind CSS + Shadcn/UI + Lucide Icons + React Router + @dnd-kit
- **Backend**: FastAPI med JWT-autentisering
- **Database**: MongoDB (collections: users, gallery, contact_messages, opening_hours, menu_items, menu_categories)
- **Bildlagring**: Emergent Object Storage
- **Auth**: JWT + bcrypt, admin-konto seeded ved oppstart
- **Fargetema**: Amber/brun (varm, rustikk skogstemning)
- **Font**: Playfair Display (headings) + Inter (body)

## Filstruktur
```
/app/
├── backend/
│   └── server.py              # Alle API-ruter og konfig
├── frontend/src/
│   ├── data/mock.js           # Sentral mock-/statisk data
│   ├── contexts/AuthContext.jsx
│   ├── components/
│   │   ├── Navbar.jsx, Hero.jsx, About.jsx, Menu.jsx
│   │   ├── Activities.jsx, Gallery.jsx, SkiMap.jsx
│   │   ├── OpeningHours.jsx, ContactForm.jsx, Footer.jsx
│   │   └── ui/ (shadcn)
│   ├── pages/
│   │   ├── AdminLogin.jsx
│   │   └── AdminDashboard.jsx
│   └── App.js (React Router)
```

## API-endepunkter
| Metode | Endepunkt | Beskrivelse | Auth |
|--------|-----------|-------------|------|
| POST | /api/auth/login | Admin-innlogging | Nei |
| POST | /api/auth/logout | Logg ut | Nei |
| GET | /api/auth/me | Hent bruker | Ja |
| GET | /api/gallery | Hent alle bilder | Nei |
| POST | /api/gallery/upload | Last opp bilde | Admin |
| DELETE | /api/gallery/{id} | Slett bilde | Admin |
| GET | /api/gallery/image/{id} | Server bilde | Nei |
| POST | /api/contact | Send melding | Nei |
| GET | /api/contact/messages | Hent meldinger | Admin |
| PATCH | /api/contact/messages/{id}/read | Merk lest | Admin |
| GET | /api/opening-hours | Hent åpningstider | Nei |
| PUT | /api/opening-hours | Oppdater åpningstider | Admin |
| GET | /api/menu | Hent meny | Nei |
| POST | /api/menu | Opprett menyelement | Admin |
| PUT | /api/menu/reorder | Omorganiser menyelementer | Admin |
| PUT | /api/menu/{id} | Oppdater menyelement | Admin |
| DELETE | /api/menu/{id} | Slett menyelement | Admin |
| GET | /api/menu/categories | Hent kategorier | Nei |
| POST | /api/menu/categories | Opprett kategori | Admin |
| PUT | /api/menu/categories/reorder | Omorganiser kategorier | Admin |
| PUT | /api/menu/categories/{id} | Oppdater kategori | Admin |
| DELETE | /api/menu/categories/{id} | Slett kategori | Admin |
| GET | /api/users | Hent brukere | Admin |
| POST | /api/users | Opprett bruker | Admin |
| DELETE | /api/users/{id} | Slett bruker | Admin |

## Fullført (januar 2026)
- [x] Fullstendig omgjøring fra Ullevålseter til Linderudkollen
- [x] Backend med FastAPI + MongoDB
- [x] JWT-autentisering med brukernavn (ikke e-post)
- [x] Bildegalleri med Emergent Object Storage + lightbox
- [x] Kontaktskjema med meldingshåndtering
- [x] Dynamiske åpningstider fra database
- [x] Redigerbar meny med priser — full CRUD fra admin-panel
- [x] Egne menykategorier — admin kan opprette/slette kategorier dynamisk
- [x] Brukeradministrasjon — admin kan legge til/slette brukere med brukernavn
- [x] Admin-panel med 5 faner (Galleri, Meny, Meldinger, Åpningstider, Brukere)
- [x] SEO-optimalisering (meta-tags, Open Graph, Twitter Card, JSON-LD, sitemap, robots.txt)
- [x] **Drag-and-drop menyhåndtering** — kan dra for å omorganisere både kategorier og menyelementer
- [x] All testing bestått (100% i alle iterasjoner)

## Backlog
- **P2**: E-postintegrasjon for kontaktskjema (SendGrid/Resend)
- **P2**: Arrangementer-modul (admin kan legge inn kommende hendelser)
- **P3**: Bildegallerikategorier
- **P3**: «Slik finner du oss»-seksjon med kart
