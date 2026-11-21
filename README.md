# SHIFTGEAR — Breakwater

Explore a coastal city on foot, take control of a sedan, and transform it to race through the streets, fly over the skyline, or dive into the bay. **Breakwater** is the playable single player browser demo. The repository also contains an earlier Godot prototype of the vehicle transformation loop.

## Play the browser demo

Use a desktop browser with WebGL 2 and a keyboard and mouse. An offline build opens directly from `index.html`. To build it from this repository, install Node.js 24 with npm and run:

```sh
cd web
npm ci
npm run build
```

Open **`web/dist/index.html`** in the browser and choose **Enter Breakwater**. The build bundles JavaScript, Three.js, and CSS into one HTML file. It runs offline and does not require a backend. The [web guide](web/README.md) covers the full control list and offline packaging.

| To do this | Use |
| --- | --- |
| Move or drive | **W A S D** or arrow keys |
| Enter, exit, or interact | **F** |
| Select a vehicle mode | **1–4** for Road, Supercar, Flight, and Underwater |
| Ascend or descend | **Q / E** in Flight or Underwater |
| Equip gear | **1–5** on foot |
| Look around | Move the mouse with the pistol equipped. Otherwise hold the right mouse button and drag. |
| Use equipped gear or boost | Left mouse button. Hold for nitro in Supercar mode. |
| Explore the map and track a heist | **M** or click the minimap |
| Jump or handbrake | **Space** |
| Sprint / reload / recover | **Shift / X / R** |

### What to try

- **Signal Run.** Follow the waypoints to take a sedan, clear the street and air checkpoints, recover a submerged core, and deliver it at the dock.
- **The Night Ledger.** Track Vela Exchange on the map, enter on foot, and get the ledger to the handoff before lockdown.
- **Floodgate Cache.** Bypass the Cinder Freight gate, retrieve the module, and reach the dock handoff.
- **Delivery contracts.** Finish Signal Run to unlock two optional deliveries. Fast deliveries earn a credit bonus.

Breakwater includes a district map, three walkable interiors, on-foot equipment, weather, synthesized audio, and locally retained credits. The demo covers one district and uses desktop controls. Full mission playthroughs and performance measurements are release verification work.

## Open the Godot prototype

Use **Godot 4.7.2**. Import [project.godot](project.godot) into Godot and press **F5** after the initial import. The startup scene is [scenes/main.tscn](scenes/main.tscn). The project uses the Compatibility renderer and Jolt physics. The base prototype runs with its own scenes and scripts. It does not require Godot editor addons.

The Godot prototype has a different key map. Use **E** to interact, **T/R** to cycle modes, and **V** to switch the camera. The [alternate Godot district](scenes/world/blockout/antigravity_district.tscn) is an editor scene for world development. Breakwater's browser heists and city geometry live in the web source.

## Repository guide

| Path | Purpose |
| --- | --- |
| [`web/src/`](web/src/) | Browser renderer, district geometry, interiors, mission content, input, HUD, and audio |
| [`web/build.mjs`](web/build.mjs) | Reproducible offline HTML build |
| [`scenes/`](scenes/), [`scripts/`](scripts/), [`resources/`](resources/) | Godot prototype scenes and gameplay systems |
| [`.github/workflows/web-build.yml`](.github/workflows/web-build.yml) | GitHub Actions browser build and downloadable artifact |
| [`docs/roadmap.md`](docs/roadmap.md) | Priorities, release checks, and future milestones |

The browser entry point is `web/src/index.html`, and the generated page is `web/dist/index.html`. Commit source changes and the npm lockfile. Build output, release packages, editor caches, and locally downloaded addon experiments belong outside the source history.

See [Third-party notices](THIRD_PARTY_NOTICES.md) for component licenses and attribution. The project source does not currently declare a license.
