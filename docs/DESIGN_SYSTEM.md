# DESIGN_SYSTEM.md

Milestone 03. Visual identity and reusable interface system for EffiQuest 3D.
A live reference of every token and component is at **`/design`** in the running app (Settings → Design system reference).

## 1. Direction: "lab notebook + instrument panel"

The interface should feel like a working science bench, not a dashboard template.

| Principle | How it shows up |
|---|---|
| Paper and rules, not floating cards | Warm off-white "notebook" surface; containers are ruled sheets (`Panel`) with 1px rules and 6px corners. Lists are ruled rows inside one sheet instead of many separate cards. Only overlays (dialog, tooltip, toast) have shadows. |
| Serif titles, sans body, mono numbers | A book serif for titles gives an academic, printed feel; system sans for reading and controls; monospace tabular digits for every measured value so columns of numbers align. |
| Color means physics | Three reserved hues encode the physical role of a quantity everywhere: **blue = input/effort**, **amber-brown = output/load/useful**, **crimson = loss**. They appear identically in diagrams, readouts, the energy bar and (later) charts. The brand teal is the only other accent. |
| Graph paper only where you measure | The grid background is used only behind diagrams and apparatus, so it marks "this is the experiment". |
| Honest placeholders | Anything not real is labeled with a dashed amber **Sample** / **Preview** badge, or a dashed empty state. Unavailable actions are disabled and explained in text next to them. |
| Motion only for feedback | 150-300 ms color/position transitions for state changes (tabs, switch, progress, hover). No decorative animation. `prefers-reduced-motion` removes all transitions. |

Avoided deliberately: gradients (except the functional slider fill and graph paper), glassmorphism (one 4px blur on the phone top bar for legibility over scrolled content), card grids, illustration filler, generic headings ("Welcome back!").

## 2. Tokens (`src/styles/index.css`)

All colors are CSS variables mapped into Tailwind (`bg-surface`, `text-muted`, `border-rule`, `bg-input`, ...). Components never hard-code colors.

### 2.1 Color

| Token | Light | Dark | Use |
|---|---|---|---|
| `--bg` | #f4f2ec | #0e1413 | Page |
| `--surface` | #fbfaf6 | #151d1c | Panels, inputs |
| `--surface-2` | #ece9e0 | #1d2827 | Hover, insets, tracks |
| `--ink` | #1b1f1e | #e6ebe8 | Primary text |
| `--muted` | #565c59 | #a0aca8 | Secondary text |
| `--rule` | #d9d4c7 | #2b3836 | Dividers, panel borders (decorative) |
| `--rule-strong` | #857e70 | #667a76 | Control boundaries (inputs, unchecked switch, slider track) |
| `--brand` / `--brand-ink` / `--brand-soft` | #0b6e66 / #fff / #dcebe7 | #4fd1c0 / #04201d / #173a36 | Primary actions, selection, focus |
| `--input` | #2453b8 | #8fb0ff | Effort, input force/work |
| `--output` | #96460a | #f2aa55 | Load, useful output |
| `--loss` | #b4123a | #ff8098 | Friction, energy lost (always with hatch or dashes) |
| `--success` / `--warning` / `--danger` | #17703a / #8a5a00 / #b42318 | #5fd68a / #f5c84c / #ff8a80 | Status (always with icon + text) |
| `--chart-1` / `--chart-2` | #6f5cc4 / #00897b | #8a7ae6 / #16a090 | Chart series (baseline / post) |

**Measured contrast (WCAG 2.x):**

| Pair | Light | Dark |
|---|---|---|
| ink on surface | 15.9 | 14.2 |
| muted on surface / bg / surface-2 | 6.6 / 6.1 / 5.6 | 7.3 / 7.9 / 6.5 |
| brand on surface (links) | 5.9 | 9.2 |
| brand-ink on brand (buttons) | 6.1 | 9.1 |
| input / output / loss on surface | 6.7 / 6.3 / 6.5 | 8.0 / 8.7 / 7.2 |
| success / warning / danger on surface | 5.9 / 5.7 / 6.3 | 9.4 / 10.8 / 7.5 |
| rule-strong on surface (non-text, needs 3:1) | 3.9 | 3.8 |

Every text pair meets AA (4.5:1). The chart pair passed the dataviz palette validator in both themes (lightness band, chroma floor, CVD separation ΔE ≥ 14, normal-vision ΔE ≥ 20, ≥ 3:1 against the surface).

**Themes.** Light is the default; dark follows the OS unless the user picks one in Settings (`html[data-theme]`). The dark block is duplicated on purpose instead of using `light-dark()`, which older Android WebViews may lack. Dark values are chosen separately, not inverted.

### 2.2 Typography

| Role | Stack | Size / style |
|---|---|---|
| Display (page & panel titles) | Iowan Old Style, Charter, Sitka Text, Cambria, Georgia, serif | Page title 30-36 px (60 px on the welcome hero); panel title 18 px |
| Body / UI | system-ui, Segoe UI, Roboto, Noto Sans | 16 px, line-height 1.5; small 14 px; caption 12 px |
| Numbers (`.num`) | ui-monospace, Cascadia Mono, SF Mono, Consolas | Tabular digits. Readout 20 px, headline readout 30 px; unit at 0.6 em in muted |
| Eyebrow | mono, 11.5 px, uppercase, 0.14 em tracking | Section labels: "RESULTS", "STEP 1 OF 5" |
| Symbols | display serif, italic | θ, μ, η, F<sub>in</sub> |

All system fonts: nothing to download, so the app works offline and on slow networks. Windows renders the serif as Sitka/Cambria, Android as Noto Serif/Georgia fallback.

### 2.3 Spacing, radius, elevation, motion

- **Spacing:** Tailwind's 4 px scale. Page gutters 16 / 24 / 40 px (phone / tablet / desktop); panel padding 16 / 20 px; vertical rhythm between page blocks 24 px.
- **Radius:** `sm` 3 px (badges, swatches), `md` 6 px (buttons, inputs, panels), `lg` 10 px (dialog). Pills only for the switch, progress bars and step numbers.
- **Elevation:** flat by default. `shadow-pop` for tooltips/toasts, `shadow-dialog` for modals. Panels use borders, not shadows.
- **Motion:** `ease-standard` cubic-bezier(0.2, 0, 0, 1); 150 ms for color/hover, 200 ms for diagram changes, 300 ms for progress fills. Reduced motion → near-zero durations.

### 2.4 Focus and interaction states
- Focus: 2 px brand outline with 2 px offset on every focusable element (`:focus-visible`); slider thumb gets a double ring; radio/segmented rows show the outline on the label with `has-[:focus-visible]`.
- Hover: surface shifts to `surface-2`; links/nav ink deepens. Pressed: slightly darker brand.
- Selected: brand fill (segmented, step) or brand underline (tabs) or brand-soft fill with a 3 px brand bar (navigation).
- Disabled: 50 % opacity + `not-allowed` cursor, and an adjacent text explanation when the reason isn't obvious.
- Invalid: danger border + message with `role="alert"` linked by `aria-describedby`.
- Minimum target size 44 × 44 px (`min-h-11`) for all controls.

## 3. Icons (`src/components/icons/glyphs.tsx`)

One hand-drawn family: 24 px grid, 1.75 px stroke, round caps and joins, no fills except small dots. It includes UI icons (home, learn, lab, quest, assess, progress, settings, check, close, chevrons, info, alert, help, play, reset, record, lock, sun, moon, monitor, offline, video, clock, sigma, layers) and **domain glyphs drawn in the same style** (incline, lever, pulley, hydraulic, gauge, target, eye, journal, calculator). No third-party icon library, so domain and UI icons never clash. Icons are decorative (`aria-hidden`) unless given a `label`. Add icons in `glyphs.tsx` only.

The **brand mark** is a lever on a fulcrum with a load, drawn in `--brand` / `--brand-ink`: white on teal in light theme, dark on mint in dark theme. One drawing (`src/app/brandMarkSvg.ts`) is used everywhere:
- the in-app logo (`src/app/BrandMark.tsx`);
- the **browser tab icon**: `useThemedFavicon` redraws it from the active theme's tokens, so it matches the logo for the system theme and for a theme chosen in Settings;
- `public/favicon.svg`, shown before the app starts: light colours, switching to the dark colours with a dark system setting. `src/app/BrandMark.test.tsx` fails if it drifts from the shared drawing;
- the PNG app icons (`public/icons/`: 192, 512, a maskable 512 with the mark inside the safe zone, and a 180 px Apple touch icon), rendered from the favicon in light colours by `npm run icons`. Installed-app icons cannot follow the theme. Run it after changing the mark;
- the browser `theme-color` and the manifest `theme_color` use the light `--brand` value.
