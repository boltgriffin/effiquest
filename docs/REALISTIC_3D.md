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
