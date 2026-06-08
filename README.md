# Verklisti bygginga

Next.js app fyrir to do / úttektarkerfi í byggingarverkefnum. Kerfið notar React, TypeScript, Tailwind CSS og Supabase fyrir database, auth og myndageymslu.

## Arkitektúr

- `src/app`: Next.js App Router síður fyrir innskráningu, dashboard, verkefni, götur, rými, atriði, mín atriði og admin.
- `src/components`: Endurnýtanleg UI, kort, töflur, shell og form.
- `src/lib/data-provider.tsx`: LocalStorage gagnalag fyrir demo/local prófanir.
- `src/lib/services`: Supabase service functions fyrir production gagnalag.
- `src/lib/supabase/client.ts`: Browser-safe Supabase client.
- `supabase/migrations`: SQL schema, RLS, Storage policies, indexes og triggers.
- `supabase/seed`: Seed gögn fyrir flokka og undirflokka.

## Local Setup

```bash
npm install
npm run dev
```

Opnaðu `http://localhost:3000`.

Til að prófa í síma á sama Wi-Fi:

```bash
npm run dev:public
```

Opnaðu síðan IP tölu tölvunnar í símanum, til dæmis `http://192.168.8.121:3001`.

## Deployment

Ráðlögð production leið er:

- Source control: GitHub repository
- Hosting: Vercel með Next.js preset
- Database: Supabase PostgreSQL production project
- Authentication: Supabase Auth
- File storage: Supabase Storage bucket `task-images`
- Deployment workflow: `main` fer í production, pull requests fá preview deployments

### Environment Variables

Settu þessi gildi í `.env.local` fyrir local development og í Vercel Project Settings fyrir production.

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_SITE_URL=https://to-do-kerfi.vercel.app
NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET=task-images
SUPABASE_SERVICE_ROLE_KEY=
```

Public browser-safe breytur:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET`

Server-only secrets:

- `SUPABASE_SERVICE_ROLE_KEY`
- Database password
- Access tokens

Settu aldrei server-only secrets í client components, browser code eða GitHub. `.env.local` á að vera local-only og er í `.gitignore`.

Production appið notar `SUPABASE_SERVICE_ROLE_KEY` aðeins í server-side API route til að vista sameiginlegt app state í Supabase. Þetta gildi þarf að vera í Vercel Environment Variables, en það má aldrei byrja á `NEXT_PUBLIC_`.

### GitHub Setup

1. Stofnaðu GitHub repository, til dæmis `todo-kerfi`.
2. Keyrðu í project möppunni:

```bash
git init
git add .
git commit -m "Prepare app for production deployment"
git branch -M main
git remote add origin https://github.com/<notandi>/<repo>.git
git push -u origin main
```

3. Ekki committa `.env.local`, logga, `.next`, `node_modules` eða local tunnel binaries.

### Supabase Production Setup

1. Stofnaðu nýtt Supabase project fyrir production.
2. Afritaðu `Project URL` og `anon public key` í Vercel env.
3. Keyrðu migrations:

```bash
supabase login
supabase link --project-ref <PROJECT_REF>
supabase db push
```

4. Keyrðu seed fyrir flokka og undirflokka:

```bash
supabase db execute --file supabase/seed/001_categories.sql
```

5. Staðfestu að RLS sé virkt á öllum app-töflum.
6. Staðfestu að Storage bucket `task-images` sé private.
7. Staðfestu að `app_state` taflan sé til. Hún geymir sameiginlegt production state svo sími og tölva sjái sömu atriði.
8. Prófaðu login, task creation og myndaupphleðslu í production.

Varúð:

- `supabase db reset` eyðir local database og keyrir migrations aftur. Ekki nota það á production.
- `supabase db push` ber local migrations saman við linked project og keyrir þær á production.
- Schema breytingar eiga að fara í `supabase/migrations`, ekki handvirkt í production nema í neyð.

### Database Migrations

Workflow:

- Allar schema breytingar fara í `supabase/migrations`.
- Ný migration:

```bash
supabase migration new <migration_name>
```

- Local prófun:

```bash
supabase db reset
```

- Production:

```bash
supabase link --project-ref <PROJECT_REF>
supabase db push
```

Taktu backup áður en stór schema breyting er keyrð á production. Forðastu breaking migration nema rollback SQL sé til.

### Supabase Storage

Bucket:

```text
task-images
```

Mælt production setup:

- Bucket er private.
- Myndir vistast undir:

```text
task-images/{companyId}/{projectId}/{taskId}/{filename}
```

- `task_images.storage_path` geymir slóð innan buckets.
- Appið býr til signed URL þegar myndir eru sóttar.
- Storage policies takmarka lestur/skrif við notendur í sama `company_id`.

### Supabase Auth Redirect URLs

Í Supabase Dashboard, stilltu Authentication URL Configuration:

Local:

```text
http://localhost:3000
http://localhost:3001
```

Production:

```text
https://to-do-kerfi.vercel.app
```

Vercel preview:

```text
https://*.vercel.app
https://to-do-kerfi.vercel.app
```

`NEXT_PUBLIC_SITE_URL` þarf að passa við production domain. Prófaðu login, logout, password reset og magic links eftir að domain er tengt.

### Vercel Deployment

1. Stofnaðu eða opnaðu Vercel account.
2. Tengdu Vercel við GitHub.
3. Veldu Import Project og veldu GitHub repository.
4. Framework preset: Next.js.
5. Root directory: project root, nema appið sé flutt í subfolder.
6. Build command: `npm run build`.
7. Output directory: Vercel sér sjálft um Next.js output.
8. Settu environment variables í Project Settings.
9. Deploy-aðu production.
10. Prófaðu `/dashboard`, `/projects`, `/my-tasks` og `/admin/users`.
11. Tengdu custom domain, til dæmis:

```text
app.fyrirtaeki.is
verkefni.fyrirtaeki.is
todo.fyrirtaeki.is
```

12. Bættu production domain við Supabase Auth redirect URLs.

Production deployment kemur frá `main`. Preview deployment kemur sjálfkrafa fyrir pull requests. Local development keyrir á þinni vél og notar `.env.local`.

### Branch Workflow

Ráðlagt Git workflow:

- `main`: stable production branch, deploy-ar sjálfkrafa á Vercel production.
- `develop`: development branch fyrir samþættingu og preview/staging.
- `feature/*`: afmarkaðar breytingar.

Dæmi:

```bash
git checkout -b feature/vercel-deployment
git add .
git commit -m "Prepare app for production deployment"
git push origin feature/vercel-deployment
```

Pull request býr til Vercel preview deployment. Merge í `main` fer í production þegar build og prófanir eru í lagi.

### RLS / Security Checklist

- RLS er virkt á öllum app-töflum.
- Notandi sér aðeins gögn síns `company_id`.
- Admin getur breytt öllu innan síns fyrirtækis.
- Verkstjóri getur breytt verkefnum og atriðum innan síns fyrirtækis.
- Starfsmaður og verktaki geta uppfært eigin/úthlutuð atriði samkvæmt policies.
- `SUPABASE_SERVICE_ROLE_KEY` er aðeins server-side.
- Service role key fer aldrei í browser.
- `.env.local` er í `.gitignore`.
- Production secrets eru aðeins í Vercel Environment Variables.
- Storage bucket fyrir myndir er private.
- Storage policies takmarka aðgang að myndum.
- Auth redirect URLs eru rétt stillt.
- HTTPS er virkt.
- Error messages og console logs leka ekki secrets.

### Production Readiness Checklist

- `npm run build` keyrir án villna.
- `npm run lint` keyrir án alvarlegra villna eða lint script er uppfært fyrir Next útgáfuna.
- TypeScript villur eru lagaðar.
- Login og logout prófað.
- Admin, verkstjóri, starfsmaður og verktaki prófaðir.
- Stofna verkefni prófað.
- Stofna götu prófað.
- Stofna íbúð/rými prófað.
- Auto-populate flokkar prófað.
- Stofna task prófað.
- Breyta task prófað.
- Merkja task lokið prófað.
- Hlaða upp mynd úr síma prófað.
- Hlaða upp mynd úr tölvu prófað.
- Dashboard prófað.
- Mín atriði prófað.
- Mobile layout prófað.
- Production domain prófað.
- Supabase Auth redirect prófað.
- RLS policies prófaðar með mismunandi hlutverkum.
- Backup og restore ferli staðfest.

### Backup og Rollback

Backup:

- Virkjaðu Supabase database backups.
- Taktu export áður en stór migration er keyrð.
- Metið hvort Storage backup þurfi fyrir `task-images`.
- Skráðu hver ber ábyrgð á backup.
- Prófaðu restore reglulega, ekki bara treysta á að backup sé til.

Ef deployment bilar:

- Notaðu Vercel rollback í fyrra deployment.
- Skoðaðu Vercel deployment logs og function logs.
- Ekki keyra breaking database migration án rollback script.

Ef migration bilar:

- Stöðvaðu deploy.
- Skoðaðu Supabase logs.
- Endurkeyrðu migration aðeins ef það er öruggt.
- Keyrðu rollback SQL eða restore-aðu backup ef þörf er á.

### Monitoring

Byrjaðu einfalt:

- Vercel deployment logs.
- Vercel runtime/function logs.
- Supabase API, Auth og Postgres logs.
- React error boundary síðar ef appið fær server/client villur í production.
- Sentry eða sambærilegt error reporting þegar kerfið fer í daglega notkun.

### Troubleshooting

- Ef Vercel build failar, keyrðu `npm run build` local og lagaðu TypeScript/build villur fyrst.
- Ef login redirect fer á ranga slóð, berðu saman `NEXT_PUBLIC_SITE_URL` og Supabase Auth redirect URLs.
- Ef myndaupphleðsla failar, athugaðu `task-images` bucket, Storage policies og að notandinn hafi rétt hlutverk.
- Ef production sýnir engin gögn, athugaðu að migrations og seed hafi verið keyrð á réttu Supabase project.
- Ef gögn sem eru stofnuð í síma birtast ekki í tölvu, athugaðu að `SUPABASE_SERVICE_ROLE_KEY` sé til í Vercel og að deployment hafi verið redeploy-að eftir að breytan var sett inn.
- Ef secrets sjást í GitHub, rotate-aðu þeim strax í Supabase/Vercel og fjarlægðu úr git history.
