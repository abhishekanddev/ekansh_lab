# Ekansh LIMS — Web Lab Report Builder

React web version of the Flutter lab/LIMS product (`../ekansh_portal`). Connects to the
**same Firebase project** (`dukannwalaa-70a0b`), so reports, patients, drafts, catalog and
invoices created here appear in the Flutter app and vice-versa.

## Stack
React 18 · Vite 5 · TypeScript · Tailwind 4 · React Router 6 · TanStack Query · Firebase 11
(Auth + Firestore + Storage) · pdfmake (client-side PDFs) · qrcode.

## Run
```bash
npm install
npm run dev      # http://localhost:5174
npm run build    # type-check + production build
```
Firebase config lives in `.env.local` (already pointed at the portal's project).

## Layout
- **Public** — `/` marketing landing (navy + gold, ported from `ekansh_portal/marketing/lab.html`),
  `/verify?r=<hid>/<reportId>` public QR report verification.
- **App** (`/app/*`, auth-gated, clinical-blue theme) — dashboard, new report wizard,
  report history, report verify/edit, test catalog, patients, billing, report config,
  staff, activity log.

## Data model
All under `hospitals/{hospitalId}/…` — matches the Flutter schema exactly. The 80 pre-built
test templates are generated from the Flutter source by `scripts/convert_templates.py` into
`src/data/labTestTemplates.ts`. Flag (H/L) and reference-range logic mirror the Flutter
`lab_result_model.dart` / `TemplateParameter.resolveRange`.

## Out of scope (Phase 2)
Gemini AI image extraction, WhatsApp delivery, multi-report combined PDF, ABDM/ABHA.

# ekansh_lab
