# REALISTIC_3D.md

Milestone 15: realistic 3D labs. The owner chose all four parts (2026-11-23, D-23): real materials and light, true-to-life proportions, physical motion effects, and realistic objects as loads.

**Principle:** **everything is generated in code.**
- **No downloaded 3D models, images or environment maps.** The app stays fully offline (D-08), nothing loads from the internet, and the 3D download grew by only about 4 kB compressed.
- **The 3D view never computes efficiency.** Every number still comes from the tested physics model (`physics-core`). Motion effects are visual only.

## 1. The realism kit (`src/scene/realism/`)

| File | What it does |
|---|---|
| `quality.ts` | What Settings → 3D quality turns on (table below) |
| `textures.ts` | Surfaces drawn on small canvases: wood grain, brushed steel, concrete, burlap, kraft paper, rope. Seeded, so screenshots are stable |
| `materials.ts` | Shared physically based materials. **Physics role colours stay fixed:** parts the learner pushes or pulls (glove, handle grip, spring scale, wheel rim) are in the effort colour; loads keep their real look |
| `LabStage.tsx` | Studio reflections from three.js `RoomEnvironment` (generated, no download), key light with shadows, fill light, concrete floor. `Shadowed` makes every part cast and receive shadows |
| `Rope.tsx` | Rope that sags under gravity and swings (verlet simulation). Its ends follow the model's positions every frame. **Stops asking for frames about 3 s after its ends stop**, to save battery |
| `swing.ts` | Damped pendulum swing of a hanging load after lift-off (shared by the pulley and the winch) |
| `GlovedHand.tsx` | A true-size gloved hand (palm about 9 cm) at the effort point |
| `loadSize.ts`, `Loads.tsx` | Loads sized from their **real mass and density**: wooden crate (400 kg/m³), rice sack (750), cement bag (1300), bucket of water (1000), concrete block (2300), steel billet (7850) |

### Quality tiers (Settings → 3D quality, D-08)

| | Low | Auto (default) | High |
|---|---|---|---|
| Shadows | off | 1024 px map | 2048 px map |
| Studio reflections | off | on | on |
| Generated textures | off (plain colours) | on | on |
| Rope and swing motion | off (straight ropes) | on | on |
| Pixel ratio | 1 | up to 1.5 | up to 2 |

## 2. The seven scenes at true size (1 m in the scene = 1 m real)

| Lab | Scene | Load | Effort |
|---|---|---|---|
| Inclined plane | wooden plank ramp on a steel stand | wooden crate (load mass) | rope up the slope to a gloved hand |
| Lever | wooden plank on a steel A-frame with the pivot pin (the friction loss) | cement bag | hand pressing down, palm on the plank |
| Pulley | steel frame 3 m high, fixed and movable blocks with the model's 4 cm sheaves, the real 1 m lift | rice sack on a hook; swings a little after lift-off | hand with spring scale at chest height; **the hauled rope piles on the floor**, as in a real lift, instead of the hand sinking into the floor |
| Wheel and axle | well winch: wooden frame, steel rim and spokes, rope wound on the axle | bucket of water | hand at the wheel rope; the pulled rope piles on the floor; the label shows the true length pulled |
| Hydraulic press | glass cylinders showing the oil, real piston diameters | concrete block on a platform | hand pressing the small piston, **pumped in 10 cm strokes** as a real jack is (the model adds them as one long push; the readouts show the total) |
| Screw jack | real 12 mm thread with the true pitch (one turn of thread per pitch), the real handle | steel billet (500 kg ≈ a 0.40 m cube) | hand on the handle; the load rises its true 20 mm |
| Wedge | hardwood wedge sliding under a guided block | concrete block resting on its uphill edge | hand pushing the thick end |

**Small movements:** they are shown at true size, so they are small (e.g. the screw's 20 mm). Each lab has close-up camera views (*Thread*, *Pistons*, *Faces*...). The 2D diagram keeps its enlarged, labelled view, and readouts give exact values.

## 3. Bug found and fixed: the 3D view crashed during runs (present since Milestone 07)
- **Cause:** `isWebGLAvailable()` created a new WebGL context **every time the lab page rendered**, and never released it. During a run the page re-renders many times, so browsers hit their context limit ("Too many active WebGL contexts"), killed the 3D view and threw a React error.
- **Fix:** check once per page load and release the test context at once (`utils/webgl.ts`).
- **Tests:**
  - a unit test that the context is released;
  - an end-to-end test that runs the pulley lab in 3D and requires no context warnings and the canvas still present.

## 4. Other changes
- **Shadows:** standard shadow maps. This three.js version removed the "soft" variant, and requesting it only produced a warning.
- **Assumptions text:** the hydraulic press and screw jack assumptions now describe the true-size 3D view.

## 5. Limits (honest)
- **No people:** only a hand. A full human figure generated in code would look crude; it could be added from a licensed model, but that would be a download and needs approval.
- **Motion effects are deliberately small.** Ropes sag, hanging loads swing a little after lift-off, and the pulled rope piles up. Loads and machine parts follow the model exactly; nothing wobbles in ways the physics does not support.
- **Performance:** in the test browser's software renderer (no GPU) the busiest scene (pulley, during a run) ran at about 35 fps, and 62 fps at rest. On real low-end phones, if it is slow, choose Settings → 3D quality → Low. **A real-device check is still needed** (RELEASE_READINESS.md §5).

## 6. Welcome screen showcase (Milestone 17, D-25)

The welcome screen shows the nine labs' **own** 3D models on one round platform. Nothing is redrawn for it.

**How the lab models are reused**
- Each lab's 3D view exports a `Model` component (lab settings → scene), used by both the lab page and the showcase (`features/lab/showcase/models.tsx`, at each lab's default settings).
- **One WebGL canvas** holds them all (several canvases would hit the browser's context limit, §3).
- Inside the showcase, `ShowcaseContext` (`scene/realism/showcase.ts`) tells a scene to leave out what belongs to a single lab view: its floor and lights (`LabStage`), floating labels (`SceneLabel` and two live text readouts) and camera controls (`LabOrbitControls`). One shared stage lights the platform (`useStudioEnvironment` is shared with `LabStage`).
- Each model is **scaled as a whole** to fit its stand, so its proportions are unchanged; the panel gives its real size. Ropes are left out of the size measurement (they always run between parts of the machine).
- One change to a model on the showcase only: the bicycle's road is 2.2 m long instead of 6 m (same texture scale and speed).

**Interaction:** previous/next arrows, a selector strip, tapping a machine on the track, swiping, and the arrow keys (Home/End too) on the 3D view. The carousel loops. "Explore simulation" opens the existing route from the lab list (`content/quests.ts`); no new routes.

**Text:** title, route and question from the lab list; learning objective and the first sentence of the purpose from each lab's guide. Only the category label (simple / hydraulic / compound) is new.

**Performance**
| | Low | Auto | High |
|---|---|---|---|
| Demo motion, camera drift, particles | off (still picture) | 30 fps | 60 fps |
| Models drawn | selected ± 2 | selected ± 2 | all nine |

- The selected machine replays its own lab motion as a demonstration; nothing else moves continuously.
- Models are built when they first come near (the selected one at once, neighbours one at a time), then kept.
- Animation stops when the showcase is off screen and with reduced motion (moves are then instant).
- Without WebGL, or if the graphics context is lost, the lab's 2D diagram is shown instead.

**Tests:** `showcase/layout.test.ts` (placement, loop); `e2e/welcome.spec.ts` (all nine selections, arrows and loop, keys, swipe, every Explore route, no console errors, no sideways scroll, no-WebGL fallback). The showcase tests run after the rest of the suite, one at a time per device (`playwright.config.ts`), because test browsers draw 3D on the CPU.

**Also fixed:** the canvases now ask for standard shadow maps directly (the "PCFSoftShadowMap has been removed" warning is gone).
