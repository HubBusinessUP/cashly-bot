# Gym Tracker

Personal gym workout tracker: log exercises, review a calendar of your sessions, track progress
stats, browse an exercise library with YouTube tutorials, export your history as CSV and get a
weekly summary email.

## Stack

- **Frontend**: React + TypeScript (Vite), Tailwind CSS, React Router
- **Auth & database**: Firebase Authentication (email/password) + Firestore
- **Backend**: Node.js serverless functions on Vercel (`/api`) using the Firebase Admin SDK, for
  server-side CSV export and the weekly summary email cron job
- **Deployment**: Vercel

## Data model

Firestore, scoped per user for security (`users/{uid}/...`):

```
users/{uid}                      { email, goal, createdAt }
users/{uid}/exercises/{id}       { name, libraryId, reps, sets, weight, date, createdAt, updatedAt }
users/{uid}/workouts/{id}        { exerciseId, date, notes, completed, createdAt, updatedAt }
```

An **exercise** is a logged performance entry (what you actually lifted). A **workout** is the
calendar entry for a session, linking back to its exercise via `exerciseId` and carrying notes /
completion status. Logging a new exercise from the UI writes both documents atomically.

## Features

1. Email-based auth with password recovery (Firebase Auth)
2. Exercise logging form with sets/reps/weight inputs and validation (react-hook-form + zod)
3. Daily workout calendar with click-to-edit
4. Progress stats: average reps, max weight, total volume, streak — update live as data changes
5. Exercise library with search/filter — 872 exercises from the [exercemus/exercises](https://github.com/exercemus/exercises) public dataset (curated from wger.de and wrkout/exercises.json), demo images cross-matched from [free-exercise-db](https://github.com/yuhonas/free-exercise-db), plus 20 hand-picked exercises. ~44 exercises have a real embedded YouTube tutorial (24 from the dataset + the 20 hand-picked); every other exercise links to a YouTube search for its tutorial, since most entries have no curated video id
6. Weekly summary email (Vercel Cron -> `/api/weekly-summary`)
7. CSV export, client-side (Dashboard/Settings) and server-side (`/api/export-csv`)
8. Mobile-responsive layout (Tailwind)
9. Dark/light theme toggle, persisted in `localStorage`
10. Body progress tracking: weight, height and an optional progress photo per check-in (Firebase
    Storage), with a weight-change summary since the first check-in

### Edge cases handled

- **Empty calendar**: shows an explicit "no workouts yet" message instead of a blank grid.
- **Form validation errors**: every required field (name, sets, reps, weight, date) is validated
  client-side with inline error messages before it reaches Firestore; Firestore security rules
  re-validate types/ranges server-side as a second line of defense.
- **Simultaneous edits to the same exercise**: updates run inside a Firestore transaction that
  compares the document's `updatedAt` against the value the editor last saw. If it changed in the
  meantime, the write is rejected and the user sees a conflict dialog instead of silently
  overwriting someone else's change.

## Security

- All Firebase/SMTP credentials are read from environment variables (see `.env.example`); nothing
  is hardcoded.
- User input (exercise names, notes) is sanitized (`src/lib/sanitize.ts`) before being written to
  Firestore, stripping HTML/control characters to prevent stored XSS.
- `firestore.rules` enforces that a user can only read/write documents under their own
  `users/{uid}` subtree, and validates field types/ranges on every write.
- `storage.rules` restricts progress photos to `users/{uid}/progress-photos/**`, readable/writable
  only by that user, and caps uploads at 8MB of JPEG/PNG/WebP.
- Every `/api/*` mutation-adjacent endpoint verifies the caller's Firebase ID token
  (`api/_lib/verifyAuth.ts`) before touching data; the cron endpoint is protected by a shared
  `CRON_SECRET`.

## Getting started

### 1. Firebase project

1. Create a project at [Firebase Console](https://console.firebase.google.com).
2. Enable **Authentication -> Email/Password**.
3. Create a **Firestore** database (production mode) and enable **Storage** (for progress photos).
4. Deploy the security rules in this repo: `firebase deploy --only firestore:rules,storage` (requires
   the [Firebase CLI](https://firebase.google.com/docs/cli) and `firebase use <project-id>`).
5. Grab your Web app config (Project settings -> General -> Your apps) for the `VITE_FIREBASE_*`
   vars, and a service account key (Project settings -> Service accounts -> Generate new private
   key) for the `FIREBASE_ADMIN_*` vars.

### 2. Install & configure

```bash
cd gym-tracker
npm install
cp .env.example .env
# fill in .env with your Firebase web config + admin service account + SMTP creds
```

### 3. Run locally

```bash
npm run dev
```

Open http://localhost:5173, create an account and start logging workouts.

### 4. Seed sample data (optional)

Create a user through the signup form first (or Firebase Auth console) to get a `uid`, then:

```bash
npm run seed -- --uid=<firebase-auth-uid>
```

This loads `sample-data/sample-workouts.json` into that user's `exercises`/`workouts`
subcollections so the dashboard, calendar and stats aren't empty on first look.
`sample-data/sample-workouts.csv` is the same data in the CSV export format for reference.

### 5. Build & typecheck

```bash
npm run typecheck
npm run build
```

## Deploying to Vercel

1. Push this repo (or the `gym-tracker` folder as its own project root) to GitHub and import it in
   Vercel, or run `vercel` from inside `gym-tracker/`.
2. Set all variables from `.env.example` in the Vercel project's Environment Variables.
3. The weekly summary cron is configured in `vercel.json` (`/api/weekly-summary`, Mondays 08:00
   UTC). Set `CRON_SECRET` in the project env vars — Vercel automatically sends it as
   `Authorization: Bearer <CRON_SECRET>` when invoking scheduled functions.
4. Firestore rules are deployed separately via the Firebase CLI, not by Vercel.

## Project structure

```
gym-tracker/
  src/
    components/    UI components (calendar, forms, modal, stats)
    context/        Auth + theme React context
    data/           Exercise library: 20 curated entries + exerciseLibrary.generated.ts (872 from
                    exercemus/exercises + free-exercise-db, regenerate via
                    scripts/build-exercise-library.py)
    hooks/          Firestore data hooks (exercises, workouts, stats, profile)
    lib/            Firebase client init, CSV builder, sanitization, validation schema
    pages/          Route-level pages
  api/               Vercel serverless functions (Node backend)
  scripts/seed.ts    Sample data loader
  sample-data/       Sample workout data (JSON + CSV)
  firestore.rules    Firestore security rules
```

## Out of scope (v1)

Social sharing, AI workout recommendations, wearable integration.
