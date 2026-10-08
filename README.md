# Plan Maison Card

[![HACS](https://img.shields.io/badge/HACS-custom%20repository-41BDF5.svg)](https://hacs.xyz/docs/faq/custom_repositories/) [![Validation](https://github.com/albaric/plan-maison-card/actions/workflows/validate.yml/badge.svg)](https://github.com/albaric/plan-maison-card/actions/workflows/validate.yml)

**English** · [Français](README.fr.md)

A Lovelace card for Home Assistant that shows **the floor plan of your home**: rooms, walls, doors and windows, garden, furniture, and your devices as animated markers you can switch on, switch off or inspect with a tap.

You draw the plan with the mouse in a visual editor (or write it in YAML), then fine-tune it directly on the card: drag walls, drop devices and furniture where they belong, pick icons from a library. An **Export** button produces the complete configuration, ready to paste back or to share with another Home Assistant.

![Preview](docs/apercu.png)

> **Language.** The card's interface is currently in French. This documentation quotes the French labels you will see on screen, with their English meaning.

## Features

- **Vector floor plan**: rooms are polygons in metres. Walls are derived from the rooms: a shared edge becomes an interior wall, a free edge becomes an exterior wall (thick line). Doors, passages and windows cut through or decorate the walls.
- **Walls mode** (« Murs »): every wall has a handle. Rooms, doors and windows attached to it follow, and neighbouring walls are pushed when needed. A table compares the computed areas with the ones you declared.
- **Animated devices**: 50 colourful animated icons grouped by family (lighting, openings, security, heating, water, kitchen, media, network…): the bulb glows, the door swings open, the vacuum moves, the tap runs, the camera pans; a halo in the family colour marks active devices. The icon is guessed from the entity, and you can change it by tapping the marker in Devices mode.
- **Weather widgets** on the plan: thermometer (colour follows the temperature), anemometer (spins with the wind), rain gauge (the jar fills up), barometer (needle), hygrometer (a drop that fills with humidity, from dry orange to humid blue, bubbles above 65 %). They are picked automatically from the sensor's device class.
- **Illustrated furniture**, one drawing per piece: 77 items sorted by room (living room, dining, bedroom, office, kitchen, bathroom, garden), with their details (tableware, books, towels, a rubber duck in the bath, vegetable patch, pool, wisteria pergola…). Worktops, pool, vegetable patch, hedge… can be resized; sofas, beds, rugs… come in 14 colours.
- **String lights** drawn on the plan, which glow (halo, twinkling bulbs) when their entity is on; a click switches them.
- **Device health**: for servers, NAS, routers, Zigbee coordinators or any field device, the card gathers all the entities of the Home Assistant device (connectivity, CPU, memory, disk, temperature, battery, signal, last seen, updates…) and shows an overall status (see below).
- **Banner** of tiles (weather or any sensor) and a **watch list** panel (« À regarder »): unavailable devices, open doors, low batteries, updates, device health issues, plus your own rules.
- Light and dark themes (follows Home Assistant); animations are turned off when the system asks for reduced motion.

Layout changes made with the mouse on the card are saved **per Home Assistant user** (`frontend/user_data` storage). They do not touch the YAML configuration until you integrate or export them.

## Installation

### With HACS (recommended)

1. HACS → ⋮ menu → **Custom repositories**.
2. Add the URL `https://github.com/albaric/plan-maison-card`, category **Dashboard** (or "Lovelace", depending on your HACS version).
3. Search for **Plan Maison Card**, install it, then reload your browser (Ctrl+Shift+R, or Cmd+Shift+R on a Mac).

HACS registers the resource `/hacsfiles/plan-maison-card/plan-maison-card.js` automatically.

### Manually

1. Download `plan-maison-card.js` from the [latest release](https://github.com/albaric/plan-maison-card/releases/latest) and copy it to `/config/www/`.
2. Settings → Dashboards → ⋮ → **Resources** → Add: URL `/local/plan-maison-card.js`, type **JavaScript module**.
3. Reload your browser.

## Quick start: draw your plan with the mouse

1. Dashboard → pencil (Edit) → **Add card** → **Plan maison**.
2. The **visual editor** opens on the left, the preview on the right. It starts from a small sample plan: keep it, edit it, or click « Tout effacer » (clear all).
3. **Plan** tab:
   - **Room** tool (« Pièce »): drag to draw a rectangular room. Edges snap to existing walls and dimensions are shown in metres. Give it a name and a type in the panel below (or type its exact dimensions);
   - **Free shape** tool (« Forme libre »): click to place each corner of a non-rectangular room (L shape, cut corner, bay window…), then click the first corner, double-click or press Enter to close it. Segments snap to horizontal and vertical;
   - **Door**, **Window**, **Opening** tools (« Porte », « Fenêtre », « Ouverture »): tap a wall to place one, then set its width, swing and label;
   - **Outdoor** tool (« Extérieur »): terrace, pergola, shed, pool, vegetable patch, path;
   - **String lights** tool (« Guirlande »): click the anchor points (zigzag under a pergola, line along a terrace…), double-click to finish, then choose the switch that powers it and the bulbs (multicolour or warm white). On the card it lights up when the device is on, and a click toggles it;
   - **Select** tool (« Sélection »): drag a room, a corner (round handle) or a wall. Moving a shared wall moves both rooms and their doors. To change a room's shape, tap the **"+"** in the middle of one of its walls and drag the new corner; tap a corner to type its exact position or delete it. Mouse wheel to zoom, drag the background to pan, Ctrl+Z to undo;
   - « Ajouter un meuble… » (add furniture) opens the library; drag a piece, R rotates it, Delete removes it. Resizable pieces have width and depth fields, fabrics have colour swatches.
4. **Devices** tab (« Équipements »): type a device name ("living room lamp", "front door"…) and pick it from the list — no need to know its entity ID. It appears in the middle of the plan: drag the marker into place and tap it to choose its animated icon.
5. **Banner** (« Bandeau », weather or sensor tiles) and **Settings** (« Réglages »: title, theme, garden, overview panel, alerts) tabs.
6. **Save**.

Walls draw themselves: thick on the outside, thin between two rooms.

![Visual editor](docs/editeur.png)

Everything can also be written in YAML (Home Assistant's "Show code editor" button): start from [`examples/simple.yaml`](examples/simple.yaml), or the full example [`examples/complete.yaml`](examples/complete.yaml) (11 rooms, named walls, 38 devices, weather banner, alert rules, garden). A plan using named walls can still be edited in the visual editor: on the first wall move it is converted to plain coordinates.

The card uses the full available width. In a "Panel" or "Sections" view it adapts; below 860 px wide, the side panel moves under the plan and tapping a room opens its details directly on the plan.

```yaml
type: custom:plan-maison-card
title: My home
rooms:
  - {name: Living room, kind: living, rect: [0, 0, 6, 4.5]}
  - {name: Kitchen, kind: living, rect: [6, 0, 10, 4.5]}
  - {name: Bedroom, kind: bedroom, rect: [0, 4.5, 10, 8]}
openings:
  - {type: door, from: [2, 0], to: [2.9, 0], swing: down, label: Entrance}
  - {type: open, from: [6, 1], to: [6, 3.5]}
  - {type: door, from: [4, 4.5], to: [4.8, 4.5]}
  - {type: window, from: [7, 0], to: [9, 0]}
devices:
  - {entity: light.living_room, x: 3, y: 2}
  - {entity: sensor.living_room_temperature, x: 1, y: 3.5}
```

## Coordinates

- All dimensions are in **metres**. The origin is wherever you like (in practice the north-west corner of the house). **x** goes right (east), **y** goes down (south).
- A coordinate can be a number (`4.1`) or a **reference to an axis** (`xS`), optionally offset (`xS+0.5`, `xC1-1.1`).
- Mouse moves snap to 5 cm.

### Axes (movable walls)

Two ways to work:

- **Automatic** (when you do not declare `axes`): every x or y value used by room vertices becomes a movable wall. All rooms sharing that value move together, along with the doors and windows on that wall. This is the simplest way to start.
- **Named**: you declare axes and use them in the points. This lets you have two independent walls at the same coordinate, anchor a door to a wall (`xC1-1.1`), or keep the exterior fixed (plain numbers stay fixed).

```yaml
axes:
  xS: {value: 4.1, label: "Living room | bedroom 1"}   # label optional, otherwise computed
  yD: 4
rooms:
  - {name: Living room, points: [[0, 0], [xS, 0], [xS, yD], [0, yD]]}
```

`auto_axes: true` forces automatic mode even when axes are declared: plain numbers then become movable too.

## Configuration reference

### General

| Key | Default | Purpose |
|---|---|---|
| `title` | `Maison` | Title shown at the top. |
| `header` | `true` | `false` hides the title and clock. |
| `layout_key` | `plan_maison_<title>` | Storage key for the per-user layout. Two cards with the same key share their layout. |
| `view` | computed | Visible frame `[x, y, width, height]` in metres. |
| `theme` | `auto` | `auto`, `light` or `dark`. |
| `fonts` | `true` | `false` does not load the Google fonts (Barlow Condensed, Source Sans 3, JetBrains Mono). |
| `panel` | `true` | `false` hides the overview panel (the watch list next to the plan). |
| `panel_width` | auto | Width of the overview panel in pixels (200 to 700). On the card you can also drag the panel's left edge: that width is remembered per user; double-click to go back to the configured value. |
| `panel_rooms` | `false` | `true` adds the list of rooms and outdoor areas under the watch list. |

### `rooms`

| Key | Purpose |
|---|---|
| `id` | Stable identifier (recommended: the saved layout uses it). |
| `name` | Displayed name. |
| `kind` | Room colour: `living`, `bedroom`, `bathroom`, `utility`, `hall`, `unknown` (hatched). French equivalents: `jour`, `nuit`, `eau`, `service`, `circ`, `todo`. |
| `rect` | `[x1, y1, x2, y2]` for a rectangular room… |
| `points` | …or the list of vertices `[[x, y], …]` for any other shape. |
| `area` | Reference area in m² (from the architect's plan, for example): it is displayed on the plan instead of the computed area, and Walls mode compares the two. |
| `label` | Position of the name `[x, y]`; otherwise placed automatically, avoiding furniture and markers. |
| `label_size` | Maximum height of the name in metres. |

### `openings` — doors, passages, windows

`{type, from: [x, y], to: [x, y]}`, placed on a wall (horizontal or vertical).

| `type` | Rendering |
|---|---|
| `door` | Gap in the wall. With `swing: up/down/left/right`, the door swing is drawn (the leaf starts at `from`). `label` adds a text on the outside. |
| `passage` | Gap without a swing. |
| `open` | No wall between two rooms; dotted line unless `dashed: false`. |
| `window` | Window drawn on the wall. |

### `zones` — outdoor areas

`{id, name, type, rect: [x1, y1, x2, y2]}`. Types: `deck` (terrace, `pattern: tiles` or `slats`, `posts: true` for pergola posts), `shed`, `patch` (flower bed, or vegetable patch when its name contains "potager"), `pool`, `gravel`. `show_size: true` displays the dimensions.

### `garden`

`garden: false` removes the garden. Otherwise:

```yaml
garden:
  label: Garden
  trees: [[8, -3.8, 1.6, t1], [-3.2, -0.6, 1.1, t2]]   # x, y, radius, shade t1/t2/t3
  flowers: [[-4.4, 3.4, "#c9a3e6"]]                  # x, y, colour
  paths: [[[-2.4, -1], [0.8, -1.4]]]                 # dotted paths
```

Without `trees`, a few trees are placed automatically around the house.

### `garlands` — string lights

```yaml
garlands:
  - entity: light.terrace
    name: Festoon lights
    points: [[0.4, 10.3], [2, 11.7], [3.6, 10.3]]
    sag: 0.15          # cable sag between two points (m)
    style: warm        # warm white bulbs; multicolour otherwise
    colors: ["#e5484d", "#3e7bfa"]   # or a list of colours
    spacing: 0.33      # distance between bulbs (m)
    size: 0.11         # bulb size (m)
```

A click on the string lights toggles the entity. In the side panel, string lights are listed in the room or terrace where they hang.

### `devices`

| Key | Purpose |
|---|---|
| `entity` | Home Assistant entity (required). |
| `id` | Stable identifier (default: the entity). |
| `name` | Displayed name (default: `friendly_name`). |
| `x`, `y` | Position. Without a position, the device waits in the "to place" box (« À placer »). |
| `icon` | Animated icon from the library (see below) or a static `mdi:…` icon. Guessed by default. |
| `kind` | `toggle` (click = on/off), `info` (click = details), `value` (shows the value), `widget`. Default: `toggle` for light/switch/input_boolean/fan, `value` for a sensor with a unit, `info` otherwise. If you choose an icon for a sensor with a unit, the icon is shown with its value in a small badge (except with an explicit `kind: value`, and except for weather widgets: add `widget: false` to prefer the icon). |
| `widget` | `false` shows the raw value instead of the animated widget. |
| `health` | `false` disables the device health status (see below). |
| `health_ignore` | List of the device's entities to ignore in its health status (e.g. `binary_sensor.slzb_06_ethernet` for a coordinator deliberately on Wi-Fi). |
| `warn` | `{entity, above, below, prefix}`: "needs attention" marker when the value crosses a threshold. |
| `gust` | Anemometer: gust sensor (wind streaks above 15 km/h). |
| `intensity` | Rain gauge: rain-rate sensor (animated drops while it rains). |

Temperature, humidity, wind, precipitation and pressure sensors automatically become animated widgets. A thermometer placed outside the rooms shows a sun above 22 °C.

Long press (or right click) on a marker: the entity's Home Assistant dialog — or the device health sheet when available.

### `furniture`

`{type, x, y, rot, w, h, color}` with a catalogue type (`w` and `h` in metres to resize it, `color` for fabrics), or `{name, parts, x, y, style}` for a custom piece. In the editor, an « Illustrer » button replaces custom pieces with catalogue illustrations, at the same place and size. `parts` is a list of shapes in metres: `[r, x, y, width, height, radius]`, `[c, cx, cy, radius]`, `[e, cx, cy, rx, ry]`, `[l, x1, y1, x2, y2]`.

Styles for custom pieces: `wood`, `sofa`, `bed`, `rug`, `plant`, `ceramic`, `bath`, `shower`, `counter`, `app`, `metal`, `stove`, `stool`, `garden`, `lamp`, `tv`, `parasol`, `piano`, `dining`.

### `banner` — tiles

```yaml
banner:
  - entity: sensor.outdoor_temperature
    name: Outside
    icon: mdi:thermometer
    color: temperature            # colour from the temperature, or "#3e7bfa"
    decimals: 1
    secondary: "feels like {sensor.feels_like:1} °C"
  - entity: sensor.weather_alert
    colors: {Green: "#2f9e5a", Orange: "#f07a2c"}
    icons: {Green: mdi:shield-check-outline}
```

In `secondary`, `{sensor.x}` inserts the value of an entity and `{sensor.x:1}` rounds it to one decimal.

### `alerts` — watch list (« À regarder »)

```yaml
alerts:
  auto: true        # placed devices unavailable, doors/windows open, "warn" thresholds, device health
  battery: 20       # batteries below 20 % (whole installation), false to disable
  updates: true     # available update.* entities
  rules:
    - {entity: climate.stove, state: unavailable, level: na, title: "Stove unavailable", text: "Check its Wi-Fi."}
    - {entity: binary_sensor.door, state: "on", title: "Door open", text: "Since {since}."}
    - {entity: sensor.ram, above: 90, title: "RAM at {value:0} %"}
    - {entity: sensor.weather_alert, not: [Green, unavailable, unknown], title: "Weather alert {state}"}
```

Conditions: `state` (value or list), `not`, `above`, `below`. Levels: `na` (red), `warn` (orange), `info` (grey). Variables: `{state}`, `{value}`, `{value:N}`, `{name}`, `{since}`, `{sensor.other}`. An entity that has its own rule is no longer reported automatically.

Each item of the watch list has a ✕ button to hide it (remembered per user); a « Réafficher » (show again) link at the bottom of the list brings hidden alerts back.

## Using the card

| Mode | Gestures |
|---|---|
| **View** (« Consulter ») | Click a marker = toggle, or details; long press = details; click a room = its details in the panel. |
| **Devices** (« Équipements ») | Drag a marker; tap it to choose its icon or remove it; add an entity; restore a removed device. |
| **Furniture** (« Mobilier ») | Drag a piece; tap it to rotate it, remove it or change its colour; keyboard: arrows (Shift = 50 cm), R, Delete; « Ajouter un meuble… » opens the library. |
| **Walls** (« Murs ») | Drag the blue handles; table of areas. |

Changes made directly on the card are saved **for your account**. To make them permanent for everyone, open the card's visual editor: a banner offers to **integrate them** into the configuration (« Les intégrer ici »).

**Export** opens the complete YAML configuration with the current layout, to share it or reproduce it on another Home Assistant.

### Device health

For each placed device, the card finds the Home Assistant device the entity belongs to and gathers its other entities: connectivity, CPU, memory, disk, internal temperature, battery, signal (dBm or Zigbee link quality), last seen, last boot, updates, reported problems. From them it derives an overall status: healthy, needs attention, problem or offline.

| Indicator | Needs attention | Problem |
|---|---|---|
| Disk | 85 % | 95 % |
| Memory | 90 % | 97 % |
| CPU | 85 % | 95 % |
| Chip / CPU temperature | 82 °C | 92 °C |
| Battery | below 20 % | below 10 % |
| Zigbee link quality | below 50 | below 20 |
| Wi-Fi signal | below −80 dBm | below −90 dBm |
| Last seen | over 24 h | over 72 h |

- An orange or red ring surrounds the marker when the device needs attention.
- Tapping the marker of an information device (or a long press on a toggle) opens its health sheet: every indicator with gauges, the reasons for the alert, each entity's details and a link to the device page in Home Assistant.
- A device with several network links (Ethernet + Wi-Fi/Internet…) is not reported when only one link is down: the unused link shows "Non utilisé" (not used).
- Indicators in alert are reported in the watch list.
- An indicator that does not matter in your case can be ignored: « Ignorer » button on the indicator in the health sheet (remembered for your account), or unticked box in the editor (`health_ignore`, for everyone). It stays visible with a dotted outline, no longer affects the status and is no longer reported in the watch list, even if a custom alert rule targets it.
- `health: false` on a device, or the matching box in the editor, disables health tracking.

### Animated icons

`bulb` Bulb · `bulbrgb` Colour bulb · `lamp` Lamp · `ceiling` Ceiling / wall light · `string` String lights · `guinguette` Festoon lights · `spot` Spotlight · `flood` Outdoor floodlight · `socket` Plug · `strip` Power strip · `solar` Solar panel · `ev` EV charger · `door` Door · `window` Window, patio door · `shutter` Shutter · `garage` Garage door · `motion` Presence · `camera` Camera · `shield` Alarm · `lock` Lock · `doorbell` Doorbell · `fire` Stove, fireplace · `towel` Towel rail · `radiator` Radiator · `thermostat` Thermostat · `heatpump` Air conditioning, heat pump · `fan` Fan · `purifier` Air purifier · `mosquito` Mosquito repeller · `faucet` Tap · `sprinkler` Sprinkler · `valve` Valve · `pool` Pool · `dishwasher` Dishwasher · `washer` Washing machine · `fridge` Fridge · `oven` Oven · `coffee` Coffee machine · `vacuum` Robot vacuum · `printer` Printer · `tv` TV · `speaker` Speaker · `tablet` Tablet, screen · `server` Server · `nas` NAS, storage · `proxmox` Hypervisor (Proxmox) · `vm` Virtual machine · `router` Internet router · `zigbee` Zigbee, radio · `generic` Generic

The animation plays when the device is on, open or active. Cameras, servers, NAS, hypervisors, virtual machines, routers and Zigbee radios stay animated as long as they respond.

Icons are guessed from the entity's icon and name — for example "NAS", "Synology", "QNAP" → `nas`; "Proxmox", "PVE", "ESXi" → `proxmox`; "VM", "LXC", "Docker" → `vm`. French keywords are recognised too.

### Furniture catalogue

**Living room**: `canape` Sofa ↔ 🎨 · `canapeangle` Corner sofa 🎨 · `fauteuil` Armchair 🎨 · `pouf` Pouf 🎨 · `tablebasse` Coffee table ↔ · `tablebasseronde` Round coffee table · `meubletv` TV unit ↔ · `tvx` Television ↔ · `biblio` Bookcase ↔ · `cheminee` Fireplace · `piano` Piano · `lampadaire` Floor lamp · `tapis` Rug ↔ 🎨 · `tapisrond` Round rug 🎨 · `poele` Stove · `plante` Plant · `escalier` Straight staircase ↔ · `escalierquart` Quarter-turn staircase ↔ · `grandeplante` Large plant

**Dining**: `table` Table ↔ · `tablerepas` Table with 6 chairs 🎨 · `tableronde` Round table · `tablerondechaises` Round table with 4 chairs 🎨 · `chaise` Chair 🎨

**Bedroom**: `lit2` Double bed ↔ 🎨 · `lit1` Single bed 🎨 · `litbebe` Cot 🎨 · `chevet` Bedside table · `armoire` Wardrobe ↔ · `commode` Chest of drawers 🎨

**Office**: `bureau` Desk ↔ · `chaisebureau` Office chair 🎨

**Kitchen**: `cuisine` Fitted kitchen run ↔ · `plantravail` Worktop ↔ · `bar` Bar ↔ · `cuisineangle` Corner kitchen ↔ · `ilot` Kitchen island ↔ 🎨 · `evier` Sink · `evierdouble` Double sink · `four` Cooker · `plaque` Hob · `frigo` Fridge · `frigoamericain` American fridge · `lavevaisselle` Dishwasher · `tabouret` Stool 🎨

**Bathroom**: `baignoirex` Bathtub · `douchex` Shower ↔ · `lavabo` Washbasin · `meublevasque` Double vanity ↔ · `wcx` Toilet · `secheserviette` Towel rail 🎨 · `tapisbain` Bath mat 🎨 · `lavelinge` Washing machine · `seche` Tumble dryer · `radiateurx` Radiator ↔

**Garden**: `transat` Sun lounger 🎨 · `salonjardin` Garden lounge set 🎨 · `tablejardin` Garden table · `parasol` Parasol 🎨 · `barbecue` Barbecue · `brasero` Fire pit · `piscine` Swimming pool ↔ · `spa` Hot tub · `pergola` Wisteria pergola ↔ · `potager` Vegetable patch ↔ · `massif` Flower bed ↔ · `lavandes` Lavender row ↔ · `haie` Hedge ↔ · `olivier` Olive tree · `palmier` Palm tree · `fruitier` Fruit tree · `potfleurs` Flower pot 🎨 · `hamac` Hammock 🎨 · `trampoline` Trampoline · `tondeuse` Robot mower · `voiture` Car 🎨 · `velo` Bicycle 🎨

↔ resizable (`w`, `h`) · 🎨 colour choice (`color`): `canard` (teal), `bleu` (blue), `ciel` (sky blue), `marine` (navy), `sauge` (sage), `vert` (green), `moutarde` (mustard), `corail` (coral), `terracotta` (terracotta), `rose` (pink), `lavande` (lavender), `gris` (grey), `anthracite` (charcoal), `lin` (linen), or any `#rrggbb` colour.

## Development

```bash
npm install
npm run build        # dist/plan-maison-card.js
npm run watch        # rebuild on every change
python3 -m http.server 8790 & npm test   # Playwright test benches: card (test/index.html) and editor (test/editor.html); review sheets: test/gallery.html (icons) and test/furniture.html (furniture)
```

The test bench `test/index.html?cfg=simple` loads an example with a fake `hass` object, without Home Assistant.

The code is split into modules in `src/`: `geometry.js` (config parsing, walls, axes), `card.js` (the card), `editor.js` (the visual editor), `icons.js` (animated icons), `health.js` (device health), `furniture.js` (catalogue), `furndraw.js` and `furnart.js` (furniture drawings), `picker.js` (entity picker), `styles.js`, `yaml.js`.

Contributions are welcome, including a translation of the card's interface.

## Licence

MIT
