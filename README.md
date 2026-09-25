# Worldloom — local worldbuilding

An original local worldbuilding workspace: visual, integrated, free to use, and no login. It is not affiliated with vvd.

## Open it

For a fresh GitHub download, install **Node.js 22 or newer** from [nodejs.org](https://nodejs.org/), download this repository using **Code → Download ZIP**, and extract it. On Windows, double-click **Launch.cmd**. There are no npm dependencies to install. If this folder already includes `runtime/node.exe`, no Node installation is needed. The runtime executable is not stored in Git.

On macOS or Linux, or to run in a terminal on Windows, use `node server.mjs` from the extracted folder, then open http://127.0.0.1:43127. Stop a terminal-launched server with Ctrl+C.

For a Windows desktop shortcut, right-click **Launch.cmd**, choose **Show more options → Send to → Desktop (create shortcut)**. Keep the extracted folder in a permanent location.

The launcher starts a small server bound to **127.0.0.1:43127** on your computer and opens an Edge app window (or your default browser if Edge is unavailable). This is a local web application in a desktop-style window, not a separately compiled native executable. It makes no external requests.

If it is already running, open http://127.0.0.1:43127. Closing the window leaves the local server available for reopening. **Stop.cmd** stops the server started by the launcher; wait for the saved indicator before using it.

## Start with the sample

The Waking Coast is an original editable example. Explore its cards, map, relationships, events, and canvas. To start fresh, open **World settings → Create a blank world**. This saves a backup of the active world first.

## What works

- **Entries:** characters, locations, factions, creatures, ecology, items, events, lore, and custom type names. Names, summaries, tags, images, custom fields, and a lightweight Markdown editor.
- **Shared references:** `[[Entry name]]` wiki links, backlinks, explicit named relationships, and automatic rewriting of exact wiki links when an entry is renamed.
- **Atlas:** multiple maps, imported local images, entry-linked pins, draggable pins, polygon regions optionally linked to entries, and marker removal.
- **Time:** custom month names and lengths, custom weekday names, negative years and year zero, an era suffix, dated entries, a clickable calendar, and a zoomable chronological overview plus event list.
- **Relationships:** directed relationship graph and a hierarchical family/tree view. Family relationships are also visible on entry pages and canvases.
- **Canvas:** multiple scrollable boards, draggable linked entry cards, editable text notes, and lines from shared relationships.
- **Wiki:** a reading view over the same entries. Export a complete, self-contained HTML wiki with working internal links and embedded entry images.
- **Search:** entry names, types, tags, summaries, and lore. Ctrl K focuses search.
- **Recovery:** autosaved committed changes, full JSON import/export, Markdown export, automatic snapshots, and a restore interface.

The entry editor has an explicit **Save entry** button. Other edits such as dragging a pin or connecting entries save automatically. The status at the bottom of the sidebar confirms the disk save. An unsaved editor warns before you close or reload the window.

## Where your world lives

- `world/world.json`: the active world, including images, relationships, map annotations, canvases, and calendar.
- `world/backups/`: up to 40 snapshots. Normal edits create at most one snapshot per minute; replacement, deletion, and calendar changes request a checkpoint.
- `server.log` and `server-error.log`: startup diagnostics.

Copy the entire `world` folder or use **Export full backup** for an independent backup. JSON is the complete format. Markdown and HTML are readable exports of entries, not full-fidelity exports of the map and canvas workspace. Exporting the HTML wiki does not publish it online.

### Move to another computer

Download the app on the other computer and install Node.js as above. To continue your existing world, use **Export full backup** on the first computer and import that JSON in **World settings** on the second. Alternatively, stop the app before copying its `world` folder. GitHub contains the application and original sample only: your active world, snapshots, logs, and bundled runtime are ignored. Worlds do not sync automatically; export again when switching computers.

### Work on the code

Clone the repository, edit its source, run `node --test tests/*.test.mjs`, and start it with `node server.mjs`. No build step is required. Preserve your `world` folder when updating the app. Review files before committing; private world exports should be kept outside this repository.

## Current limits

This is version 0.1, a foundation for testing the workflow, not full vvd parity.

- One active world; use JSON exports to switch worlds. A multi-world library is not implemented.
- Images are limited to 6 MB each; a world save is limited to 48 MB. Large media libraries need separate asset storage in a later version.
- The editor supports headings, paragraphs, bold, italic, and wiki links. It is not yet a full rich-text block editor or manuscript system.
- Dates are points in time. Event durations, recurring events, leap rules, moons, historical object versions, and multiple simultaneous calendars are not implemented.
- Maps support pins and polygon outlines, but not pan/zoom, nested layers, polygon vertex editing, or terrain painting. Replacing an image preserves annotations at their percentage coordinates.
- Canvases have a fixed 1800×1200 scrollable surface, not an infinite zoomable canvas. No freehand drawing yet.
- Graph layouts are basic. Relation-tree direction follows the source → target relationship. Cycles are shown at the top level rather than interpreted as genealogy. No complex spouse/union junctions or manual graph layout yet.
- Custom properties are text fields, not a typed schema/template system. Ecology is represented through entries and relations, not a simulation.
- No undo stack, collaboration, cloud sync, or hosted publishing. Use snapshots to recover previous saved versions.
- Optimized for Windows desktop. Smaller layouts adapt, but touch interactions have not been fully tested.

## Implementation and verification

No third-party application dependencies. Node built-in HTTP and filesystem modules serve plain HTML/CSS/JavaScript. Writes are serialized, validated, written to a temporary file, flushed, and renamed. Revision checks reject stale writes from another window. The server accepts local hostnames only, requires a per-session save token, and restricts network access with a content security policy.

Run `node --test tests/model.test.mjs tests/server.test.mjs` (or use `runtime\node.exe` if bundled) from this folder to check calendar arithmetic, cascading deletion, import validation, tree ordering/cycles, disk persistence, backup recovery, stale-write rejection, and request isolation.

Browser checks exercised entry creation and editing, wiki links, a family relationship, an event created through the custom calendar, timeline display, a linked map pin, adding and dragging a canvas card, and reloading saved data.

Final verification also completed a real stop/relaunch through the supplied PowerShell launchers. The saved world file's SHA-256 hash was unchanged, the app reopened with all saved records, and the backup list loaded. The stop launcher now verifies the bundled runtime with `Get-Process`, avoiding a dependency on restricted Windows CIM access. Save requests preserve UTF-8 text across network-chunk boundaries; a regression check covers accented text, Chinese characters, and emoji. The sidebar distinguishes an open entry editor from fully saved changes.

## Source files

`public/app.js` implements the interface. `public/style.css` contains the visual design. `model.mjs` validates data and handles shared logic. `server.mjs` owns disk persistence. `seed.mjs` contains the original demo world. `public/landscape.svg` is the original sample map artwork.

Node.js is third-party software installed separately for the source distribution; its licensing information is available at https://github.com/nodejs/node/blob/main/LICENSE.
