# SHIFTGEAR roadmap

**Current release track:** Breakwater, the browser vertical slice. Finish and verify that experience before expanding the map again. The Godot project remains a separate native prototype for exploring vehicle physics and world systems.

## Available now

- **Browser:** One coastal district, four modes on the same sedan, three walkable interiors, an equipment hotbar, weather, a district map, and an offline build. Signal Run introduces the transformations. The Night Ledger and Floodgate Cache introduce timed heists. Two delivery contracts unlock after Signal Run.
- **Godot:** A compact test district with on-foot controls, vehicle entry and mode switching, and a prototype mission. Police, reputation, vehicle interaction, and save-slot code are available for integration. The alternate district is available as a separate scene.

## Next release

| Priority | Work | Ready when |
| --- | --- | --- |
| 1 | Play through Signal Run, both heists, and both deliveries from a fresh browser session. Check indoor aim, shoreline conversion, recovery after missed handoffs, and offline launch. | Each mission can be started, completed, and retried without getting stuck. Payouts happen once per completion. |
| 2 | Improve the first five minutes. Tune camera transitions, improve visual cues at entrances and the dive site, and rebalance nitro and steering around narrow streets. | A new player can reach the first heist or finish Signal Run using only the in-game prompts. |
| 3 | Measure browser performance on the i3-1215U at 1280×720. Add a lower graphics setting if frame times spike through the port, in rain, or during transformations. | The release notes state the tested browser, settings, and measured performance. The target is 60 FPS. |
| 4 | Publish a versioned offline ZIP with the license notice, controls, and release notes. Add a public web preview when hosting is selected. | A fresh checkout builds the same game and a downloaded release opens directly in a supported browser. |

## Later milestones

1. **A livelier Breakwater.** Add lightweight traffic and pedestrians, visible security responses during heists, and a small set of activities between missions. Give each existing neighborhood a reason to visit it before building more land.
2. **More mission variety.** Add original missions with multiple approaches, such as a rooftop recovery, a flooded research facility, and a cargo intercept. Use the same objective and reward rules across missions.
3. **Progression and persistence.** Save mission completion, inventory, and vehicle unlocks as well as credits. Add session recovery and settings for mouse sensitivity, remapping, and audio.
4. **World expansion.** Add new districts in the order they unlock useful gameplay. A longer coastal route and an industrial airfield would give Flight and Underwater more purpose. Profile every new region before expanding farther.
5. **Native prototype integration.** Bring the alternate district, traffic, police, and save slots into a playable Godot scene incrementally. Pin the exact engine and addon versions and record redistributable licenses for anything used by the project.
6. **Release size and polish.** Compare browser and native performance on the target laptop. Expand vehicle models and effects within the measured budget, and use profiling data to decide what can ship.

The roadmap is ordered by what should work before the next milestone. It has no fixed release dates.
