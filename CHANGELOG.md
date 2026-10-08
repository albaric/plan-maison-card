# Changelog

**English** · [Français](CHANGELOG.fr.md)

## 1.10.3

- Documentation in English (README and changelog); the French versions are kept in `README.fr.md` and `CHANGELOG.fr.md`.

## 1.10.2

- Watch list (« À regarder »): each alert has a ✕ button to hide it (remembered per user). For a health indicator, it is ignored just as from the health sheet (re-enable it with « Suivre »); other alerts come back with the « Réafficher » (show again) link at the bottom of the list.
- More accurate device health:
  - a network link that is down is no longer a fault when another link of the same device is up (unplugged Ethernet on an SLZB running on Wi-Fi: "Non utilisé", not used);
  - chip and CPU temperatures are only reported from 82 °C (problem at 92 °C), since 60–80 °C is normal for these devices.

## 1.10.1

- Fix: an indicator ignored in a device's health status no longer appears in the watch list at all — neither as a health indicator, nor through a custom alert rule (`alerts.rules`), nor through the automatic low-battery or update alerts, nor through the device's `warn` threshold.

## 1.10.0

- New animated icons: NAS (drive bays with activity LEDs), Proxmox hypervisor (host with stacked virtual machines), virtual machine (window with a container), towel rail (heating bars, towel). 50 icons in total.
- Automatic choice: "NAS", Synology, QNAP, TrueNAS, Unraid → NAS; Proxmox, PVE, ESXi, hypervisor → hypervisor; VM, LXC, container, Docker → virtual machine; towel rail → towel rail; "server" → server.
- NAS, hypervisor and virtual machine stay animated as long as they respond, like the server; the towel rail heats up when it is on.

## 1.9.1

- Device health: a specific indicator can be ignored (for example the Ethernet link of a Zigbee coordinator deliberately connected over Wi-Fi). « Ignorer » / « Suivre » (ignore / track) button on each indicator of the health sheet (remembered per user), or one checkbox per indicator in the editor (`health_ignore` in the config). The indicator stays visible with a dotted outline, with no effect on the status, the marker ring or the watch list. « Les intégrer ici » (integrate) copies indicators ignored on the card into the config.

## 1.9.0

- Device health: for a server, a router, a Zigbee sensor or any field device, the card gathers every entity of its Home Assistant device (connectivity, CPU, memory, disk, internal temperature, battery, signal, link quality, last seen, boot time, updates, reported problems) and derives a status: healthy, needs attention, problem or offline.
- Orange or red ring on the marker when the device needs attention; health sheet when tapping the marker (or long press on a toggle marker) with every indicator, the reasons and a link to the device in Home Assistant; indicators in alert are reported in the watch list.
- Editor: "device health" checkbox per device, with the list of indicators found (`health: false` to disable).

## 1.8.2

- Leaner overview panel: it now only shows the watch list (no more "N rooms, N devices" title, help text or room list). The room list comes back with `panel_rooms: true`.
- Adjustable overview width: in the editor (Settings, slider from 200 to 700 px, `panel_width`) or by dragging the left edge of the panel on the card (remembered per user, double-click to go back to the setting). The overview can also be hidden (`panel: false`).

## 1.8.1

- Cameras: new icon (camera on its bracket, lens, sweeping field of view, recording LED) shown in blue when working. A camera that is "idle" in Home Assistant is running: it now shows "En ligne" (online) — or recording / live — instead of "standby".
- Temperature: continuous colour following the value (icy blue, blue, turquoise, green, yellow, orange, red), applied to the thermometer, the marker and the number; same principle for humidity.
- String lights when on: soft glowing halo, bulbs twinkling per colour and a white filament; when off, bulbs are dull.
- More legible rain gauge: higher-contrast cloud and jar, bigger drops, level visible from a few millimetres (jar full around 30 mm), marker tinted blue when it has rained.

## 1.8.0

- New furniture: straight and quarter-turn staircases (for houses with several floors), car and bicycle (for the garage). 77 items in the catalogue.
- A room's declared area (`area`, for example from the architect's plan) is shown on the plan and in the panel instead of the computed area; without `area`, the computed area is still shown with "≈".

## 1.7.1

- Tapping a terrace, the pergola or a room also lists the string lights hanging there, with their switch; hovering the row highlights the string lights on the plan. They count in the number of devices of each room or area.

## 1.7.0

- Furniture completely redrawn: a dedicated drawing for each piece, with details and bright colours (tableware on the table, books on the shelves, a laptop on the desk, duvet and throw on the bed, towels and a duck in the bath…).
- 73 pieces sorted by room in the library (living room, dining, bedroom, office, kitchen, bathroom, garden). New: fitted kitchen run, worktop, corner kitchen, island with stools, bar, double sink, hob, American fridge, dishwasher; double vanity, towel rail, bath mat; stove, fireplace, round coffee table, table with chairs; bedside table, office chair; swimming pool, hot tub, wisteria pergola, vegetable patch, flower bed, lavender, hedge, olive tree, palm tree, fruit tree, flower pot, garden lounge set and table, fire pit, hammock, trampoline, robot mower.
- Resizable furniture in the editor (width and depth): worktops, pool, vegetable patch, hedge, rugs, beds… Fabrics change colour (14 shades), in the editor and on the card.
- Editor: an « Illustrer » button replaces furniture drawn with simple shapes by catalogue illustrations, at the same place and size (beds and sofas oriented from their pillows or backrest, sink and hob placed on worktops, stools split).
- Outdoor areas "pool" and "flower bed, vegetable patch" are drawn (water, rubber ring, flowers, rows of vegetables).

## 1.6.0

- New humidity widget: a drop that fills with the humidity level, with an animated wave, a colour going from orange (dry air) to deep blue (humid air) and bubbles above 65 %. It applies automatically to humidity sensors.
- Narrow card (column of a sections dashboard, phone): the overview panel moves under the plan, out of sight. Tapping a room or an area now opens its sheet directly on the plan (readings, devices with their switches); « Fermer » (close) goes back to the overview. At normal width, the side panel updates as before.
- Panel readings: a single reading takes the full width.

## 1.5.3

- Fix for 1.5.2: weather widgets (temperature, wind, rain, pressure) turned back into plain icons when an icon was associated with them. They keep priority; `widget: false` shows the icon instead.

## 1.5.2

- A sensor with a unit (inverter, power, memory…) whose icon has been chosen now shows that animated icon on the plan, with its value in a badge below. Previously the icon chosen in the editor was ignored and only the value was shown.
- On the card, the sheet of a device shown as a value also offers the icon library; « Revenir à la valeur » (back to value) cancels that choice.
- `kind: value` is still honoured if you only want the value.

## 1.5.1

- Fix: in Home Assistant, after a first change, the Banner tab stopped responding (adding a second tile, title, order, deletion), and so did the Settings tab. Home Assistant freezes the configuration the editor sends; the editor now sends it a copy.
- The editor test bench freezes the configuration like Home Assistant, and tests adding, renaming, moving and deleting tiles in sequence.

## 1.5.0

- Animated icons completely redrawn, in colour: 46 icons (14 new: EV charger, garage door, lock, doorbell, thermostat, heat pump, air purifier, pool, washing machine, fridge, oven, coffee machine, vacuum, speaker).
- Each device family has its colour (lighting, openings, security, heating, water, kitchen, media, network…): an active marker takes that colour with a pulsing halo; an inactive marker is desaturated so that what is running stands out.
- Livelier animations: the bulb glows, the door and garage open, the lock unlocks, the vacuum moves, the washing machine spins, the coffee machine steams, the speaker vibrates, the tap runs…
- Illustrated furniture: grained wood, fabrics with cushions, beds with pillows and duvet, ceramics and water in the bathroom, stone worktop, hobs, appliances with a porthole, swaying foliage, barbecue embers, floor lamp halo. Rendering adapted to the dark theme.
- The furniture library (card and editor) shows the same illustrations.

## 1.4.1

- Reworked editor Banner tab: a « + Ajouter une tuile » (add tile) button opens the sensor search; each tile is a card with its current value, title, secondary line (with preview) and move up / move down / delete buttons.
- Another sensor's value is inserted into the secondary line of the chosen tile (button on each tile), instead of a shared field that was confusing next to "add tile".

## 1.4.0

- Editor: « Guirlande » (string lights) tool to draw string lights point by point (zigzag, line…) and link them to the switch or light that powers them, chosen by name.
- Existing string lights appear in the editor; you can move them, drag or add anchor points, and set the bulbs (multicolour festoon or warm white) and the sag.
- On the card, the string lights glow when the device is on and a click toggles it (string lights not yet linked do nothing on click).
- The device type is shown under the name in the picker, without overlapping the text.

## 1.3.0

- Devices are chosen by their friendly name: type "living room lamp" and pick from the list (name, device type and Home Assistant area). Technical IDs (`light.xxx`) no longer appear, neither in the editor (Devices, Banner, device panel) nor on the card (adding in Devices mode, side panel lists).
- Banner: a picker inserts another sensor's value into the secondary line.

## 1.2.0

- Free-shape rooms: « Forme libre » tool to draw a room corner by corner, with automatic horizontal and vertical alignment.
- "+" button in the middle of each wall of the selected room: adds a corner and drags it right away.
- A tapped corner can be set to the centimetre or deleted from the panel.
- Keyboard shortcuts (R, Delete, Ctrl+Z) stay active after adding something from the panel.

## 1.1.0

- **Visual editor** in the "Edit card" dialog: draw rooms with the mouse with snapping and dimensions, doors, windows and openings placed on walls, outdoor areas, movable corners and walls (neighbouring rooms follow), L shapes, zoom, undo.
- Devices (add, place, animated icon), Banner and Settings tabs.
- Furniture added, moved and rotated from the editor.
- Changes made on the card (saved per user) can be integrated into the configuration in one click.
- An empty plan is accepted (with a message inviting you to draw it).
- Fix: keyboard shortcuts in Furniture mode no longer worked.

## 1.0.0

First generic version.

- Plan fully described in the configuration: rooms in metres, named or automatic axes, walls derived from rooms.
- Generic Walls mode: one handle per wall, neighbouring walls pushed, table of areas.
- Doors with swing and label, passages, windows; outdoor areas (terrace, pergola, shed, pool, gravel); garden with automatic trees.
- 32 animated icons with a library, weather widgets (temperature, wind, rain, pressure), string lights.
- Coloured furniture, catalogue of 36 pieces.
- Configurable tile banner, automatic alerts and custom rules.
- Export of the configuration with the current layout.
