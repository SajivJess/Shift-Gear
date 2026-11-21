# SHIFTGEAR — Breakwater

Open `index.html` from the extracted demo ZIP in a desktop browser with WebGL 2. Select **Enter Breakwater** and follow the Signal Run objectives. The packaged build is self-contained and runs offline.

| Key | Action |
| --- | --- |
| WASD or arrow keys | Move, drive, or steer |
| F | Enter vehicle, exit at a stop on land, or interact with the objective |
| Q / E | Ascend / descend in Flight or Underwater |
| Space | Jump on foot or handbrake on the road |
| 1–5 on foot | Equip pulse pistol, scanner, repair kit, beacon, or data pad |
| 1–4 while driving | Road, Supercar, Flight, or Underwater |
| Shift | Sprint on foot |
| Mouse with pulse pistol equipped | Aim and turn the camera directly |
| Hold right mouse and drag | Look around with other gear or while driving |
| Left mouse | Use equipped gear on foot. Hold in Supercar to use nitro. |
| X | Reload the pulse pistol |
| V | Switch between close and wide vehicle camera views |
| M or minimap click | Open the larger map panel |
| R / Esc | Recover at checkpoint / pause for controls |

Enter Breakwater requests fullscreen. Use the fullscreen button beside the help button to toggle it again.

The pulse pistol aims at the center reticle. The training plates are in the plaza just east of the starting sedan. The other four slots track the current objective, recharge the sedan, place a personal waypoint, or open the district map. The nitro meter supports up to four seconds per full charge and recovers after you release the button.

After you deliver the Signal Run core, open the map to accept one of two delivery contracts. Deliver before its bonus timer expires for extra credits. The weather panel cycles through clear skies, overcast, and showers.

## Interiors and heists

Open **M** and select a heist to mark its entrance. Both are available from the start. Park outside and enter on foot. Inside, the camera switches to first person. Follow each prompt with **F**. The timer starts when you take the loot, and the handoff can be completed on foot or in a stopped vehicle. **R** restarts an active heist at its entrance.

- **The Night Ledger** at Vela Exchange. Override the security desk, collect the ledger, and reach the Market Way handoff.
- **Floodgate Cache** at Cinder Freight. Enable the breaker, unlock the cargo cage, and deliver the module to the dock.
- **Tideglass Café** in Foundry Court. Walk in from the plaza and use the counter to recharge the sedan's nanotech reserve.

## Build from source

Run `npm ci` and `npm run build` from the `web` directory. Then open `dist/index.html`. The frontend uses JavaScript, Three.js, HTML, and CSS. Three.js runs under its included MIT license.

For an offline download, put `dist/index.html`, `dist/THREE-LICENSE.txt`, and this README at the top level of a ZIP archive. The GitHub Actions build provides those files as the `SHIFTGEAR-Breakwater` artifact.
