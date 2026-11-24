# RELEASE_READINESS.md

Milestone 13: getting EffiQuest ready for the classroom pilot (start March 1, 2027, D-14).

## 1. Offline (D-08, SRC-S6): verified
- The app is a PWA. After **one visit online**, the service worker stores the whole app on the device (39 files, about 2 MB), including the lab, 3D view, lessons and charts.
- **Test `e2e/offline.spec.ts`** (desktop and Pixel 7 profiles):
  1. visit once online;
  2. **cut the network**;
  3. open a lesson, a quest, Assess, Progress and the hydraulic press lab — all work;
  4. open the **3D view** of the incline lab — works;
  5. **save progress** (mark a module complete) — works.
- Learner data is saved on the device (IndexedDB) and needs no network. The optional online class needs the network only to send results.
- **Updates:** when a new version is published, learners see "A new version of EffiQuest is available" with **Update** / **Later**. Nobody is reloaded in the middle of an activity.

**Fixed: the offline notice.**
- The one-time "ready to work offline" message covered page buttons on phones. It now sits above the phone tab bar, hides itself after 8 seconds, and has a Dismiss button.
- It also used two colour classes that don't exist in the design system, so the Update button had no defined text colour. It now uses the standard design-system buttons, at the 44 px tap size.

## 2. Low-end devices (D-08): measured
Simulated low-end conditions: the processor slowed 4×, and a slow mobile connection (about 400 kbit/s, 400 ms delay). First visit, nothing cached:

| Step | Time |
|---|---|
| Home page ready | about 4.7 s |
| Open a lab with its diagram | about 3.4 s |
| Switch to the 3D view | 1–2 s |
| Any visit after the first | immediate (from the device) |

**Download sizes (compressed):**
- the app shell, which every visit needs: 94 kB, down from 105 kB, because lesson text now loads only when a module is opened;
- 3D graphics: 250 kB, only when the 3D view is opened;
- charts: 119 kB, only on Progress;
- the online class: 56 kB, only when it is used.

**Low-quality option:** Settings → 3D quality: Low, for older phones. The 2D diagram is always available.

## 3. Accessibility
Already in place and tested:
- labelled inputs and keyboard use;
- visible focus;
- status shown with text and icons, never colour alone;
- live announcements of results;
- tap targets of 44 px or more;
- reduced motion;
- a table view for the chart;
- headings on every page.

**Automated WCAG check: done** (`e2e/a11y.spec.ts`).
- **What it covers:** axe-core with the WCAG 2.1 A/AA rules, on 16 pages (every main screen, including Teacher), in light and dark themes, on the desktop and phone profiles: **64 checks, all passing**.
- **What it found and what was fixed:**
  1. **Theme flash.** The saved theme was applied after the first paint, so dark-mode users briefly saw the light theme (and contrast checks failed in that moment). A small script in `index.html` now applies the saved theme before the page draws.
  2. **Desktop brand link.** Its spoken name "EffiQuest dashboard" did not include the visible "Efficiency lab", which confuses voice-control users. The visible brand is now the name, and screen readers also hear "dashboard".
  3. **Dashboard diagram link.** It duplicated the "Inclined plane" link beside it, and its drawing's labels did not match its name. It is now a mouse-only shortcut; the lab list is the accessible way in.
- **Not covered:** the 3D canvas itself cannot be inspected automatically. Its controls, labels and the 2D diagram alternative are checked.

## 4. Hosting (decision D-16): Vercel

**Decided 2026-11-23: Vercel.** The comparison below is kept for the record.

| Option | How learners get it | Offline | Cost | Notes |
|---|---|---|---|---|
| **A. Free static host (recommended)**: Cloudflare Pages or Netlify | open a web address once (e.g. `effiquest.pages.dev`), optionally "Install app" | yes, after the first visit | free tier | HTTPS included (needed for offline). Updates appear for everyone. Data stays on devices unless the online class is used |
| B. School server or laptop on the school network | open the server's address on the school Wi-Fi | **only with HTTPS** | school equipment | Without HTTPS, browsers do not allow offline storage (except on `localhost`), so the app works only while connected |
| C. USB copy | copy the app folder to each computer | yes | none | Cannot be opened by double-click (`file://` blocks modern web apps). Needs a small local web server program on each computer. Not built yet; possible as a later step if needed |

**Recommendation:**
1. Choose **A**.
2. On each school PC and each learner phone, open the address **once while online**, before the first lesson (week 1, with the baseline diagnostic).
3. From then on, EffiQuest works without internet.
4. Keep **C** in reserve only for computers that can never go online.

**Also to decide for D-16:** who owns the hosting account, the licence of the app, and who maintains it after the pilot.

## 5. Real-device checklist (owner or teacher, before March 1)
Do this on **one low-end Android phone** and **one school PC**:
1. Open the app online. Wait for "ready to work offline" (or about a minute). Install it if the browser offers.
2. Turn on airplane mode, or unplug the network.
3. Open the app again.
4. **Pages:** check that Home, a lesson, a lab (diagram and 3D) and a knowledge check all open.
5. **3D view:** run the incline lab. If it is slow, set Settings → 3D quality → Low and try again.
6. **Saving:** answer one knowledge-check question and mark one module complete. Close and reopen the app; the progress must still be there.
7. **Results file:** Settings: save a learner code, then "Download my results". Check that the file appears in Downloads.
8. Note the phone model, the browser and its version, and anything that looked wrong. Send it to the developer.

## 6. Before the pilot: summary

| Item | Status |
|---|---|
| Labs (5), lessons (5, draft), quests (4), diagnostics and checks | built |
| Teacher review of lessons, questions and rules | **open**: review page shared with the teacher |
| D-13 bicycle example | **open**: teacher check |
| Offline | verified (tests) |
| Low-end performance | measured (simulation); **real-device check open** (§5) |
| Accessibility automated audit | done: 64 checks pass (§3) |
| Hosting (D-16) | **live** at https://effiquest.vercel.app; account ownership open (§7) |
| Online class | optional; **privacy review open** (`PRIVACY_REVIEW.md`); results files work without it |
| School calendar check (D-14) | **open** |

## 7. Deploying to Vercel

**Live (2026-11-23):** https://effiquest.vercel.app. Vercel project `boltgriffn/effiquest`, deployed from this computer with `npx vercel deploy --prod`; device-only (no Supabase variables).

**Checked after deploying:**
- the site is public (no login);
- direct links to app pages work (e.g. `/learn/torque`);
- the offline worker is served with no-cache, and the security headers are present;
- no Supabase project reference appears in any of the 33 JavaScript files.

**Redeployed (2026-11-24):** Milestones 14-16 (commit `1ebfe6b`): screw jack, wedge, realistic 3D, bicycle and hydraulic brake labs. Checked after deploying:
- the offline worker lists all nine 3D views (including bicycle, brake, screw, wedge);
- direct links work (`/lab/bicycle`, `/lab/hydraulic-brake`, `/lab/screw`, `/learn/torque`);
- `sw.js` is served with no-cache; nosniff, Referrer-Policy, X-Frame-Options and HSTS are present;
- none of the 41 JavaScript files contains a Supabase project reference (the only `supabase.co` text is the client library's generic `*.supabase.co` hostname pattern).

**Redeployed (2026-11-24):** Milestone 17 (commit `778ebbf`): welcome screen with the 3D simulation showcase, plus the logo-matched favicon and app icons (`6de6ee8`). Checked after deploying:
- the site is public; `/`, `/welcome`, `/lab/bicycle` and `/learn/torque` load;
- the offline worker lists the welcome page, the showcase 3D code and the new maskable and Apple icons; the page links `favicon.svg?v=2` with theme colour `#0b6e66`;
- `sw.js` is served with no-cache; the five security headers are present;
- no JavaScript file contains a Supabase project reference.

**To publish a new version:** commit, then run `npx vercel deploy --prod` (or connect a GitHub repository for automatic deploys).

`vercel.json` sets:
- **Build:** `npm ci`, then `npm run build`, output in `dist`.
- **Routing:** every app route (e.g. `/learn/torque`) serves the app, so deep links and refreshes work.
- **Caching:** the offline worker (`sw.js`), `index.html` and the manifest are never cached stale, so updates reach learners. Built files in `/assets` are cached for a year; their names change with every build.
- **Security headers:** no framing of the app, no MIME sniffing, a strict referrer policy, and camera, microphone and location turned off.

**Option 1: from GitHub (recommended: every push deploys)**
1. Create a **private** GitHub repository and push this project. `.env.local` and `supabase/.temp` are git-ignored and never uploaded.
2. vercel.com → **Add New → Project → Import** the repository. Vercel reads `vercel.json`; no settings need changing.
3. **Environment variables: leave empty for the pilot.** Without them the app is device-only, and results are collected by file.
4. Click **Deploy**. Vercel gives an address like `effiquest.vercel.app`.

**Option 2: from this computer (Vercel CLI)**
In a PowerShell window in the project folder:
- `npx vercel login`, once;
- `npx vercel`, for a preview;
- `npx vercel --prod`, for the live address.

**The online class on Vercel (only after the privacy review):**
- In Vercel → Project → Settings → Environment Variables, add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (the **publishable/anon** key only), then redeploy. The app reads them at build time.
- Never add a service-role or secret key.

**After the first deploy:**
1. Open the address on a phone and a PC.
2. Run the real-device checklist (§5).
3. Check that a deep link (e.g. `/learn/torque`) opens directly.
