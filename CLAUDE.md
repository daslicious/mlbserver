# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

mlbserver is a Node.js server that provides MLB.tv streaming capabilities. It acts as a local HTTP server that authenticates with MLB's API, proxies HLS video streams, and serves a web UI for browsing games. Distributed via npm (`mlbserver`) and Docker (`tonywagner/mlbserver`).

## Running

```bash
# Install dependencies
npm install

# Run locally (interactive prompts for credentials on first run)
node index.js

# Run with options
node index.js --port 9999 --debug

# Docker
docker-compose up --detach
```

Default port is 9999. Multiview port defaults to primary port + 1.

## Architecture

The entire application is two files:

- **`index.js`** (~3800 lines) — HTTP server using the `root` framework. Defines all route handlers and serves the web UI (HTML generated inline). Handles HLS stream proxying, playlist manipulation (resolution filtering, skip markers, captions), multiview via ffmpeg, and gamechanger features.
- **`session.js`** (~5600 lines) — `sessionClass` that manages all MLB API interaction. Handles authentication (GraphQL to `media-gateway.mlb.com`), game schedule lookups, media ID resolution, stream URL retrieval, skip/break marker calculation, IPTV channel/guide generation, and persistent state (credentials, cookies, cache stored as JSON files on disk).

### Key Route Endpoints (index.js)

| Route | Purpose |
|---|---|
| `/` | Main web UI — game listings with date/team/level selectors |
| `/stream.m3u8` | Primary stream endpoint — resolves team/game to HLS stream |
| `/master.m3u8` | Master playlist proxy with resolution/audio filtering |
| `/playlist.m3u8` | Media playlist proxy with skip marker injection |
| `/segment.ts` | TS segment proxy |
| `/gamechanger.m3u8` | Auto-switching multi-game stream |
| `/multiview` | Multi-game picture-in-picture via ffmpeg |
| `/channels.m3u` | IPTV channel list (M3U format) |
| `/guide.xml` | EPG/XMLTV guide |
| `/calendar.ics` | iCal schedule |
| `/highlights` | Game highlights browser |
| `/download.ts` | Full game download |
| `/comskip.edl`, `/comskip.txt` | Commercial skip markers for DVR software |

### Data Flow

1. User requests a stream (by team abbreviation, game ID, or media ID)
2. `session.js` authenticates with MLB's GraphQL API if needed
3. Session resolves the request to a `mediaId` → calls `getStreamURL()` to get an HLS master playlist URL
4. `index.js` proxies and transforms the HLS playlist (filtering resolution, injecting skip segments, handling encryption keys)
5. Client plays the rewritten playlist, with segments proxied through `/segment.ts`

### Persistent State

Stored as JSON files in the data directory (configurable via `--data_directory`):
- `credentials.json` — account username/password
- `protection.json` — content protection key
- `data/cookies.json` — session cookies
- `data/data.json` — user preferences (scan mode, link type, favorites)
- `cache/cache.json` — API response cache

### Team Abbreviations

Both files reference MLB teams by standard abbreviations (e.g., `ATH`, `ATL`, `AZ`, `BAL`). Team IDs, colors, affiliate IDs, and radio logos are defined as constants at the top of `session.js`. Minor league levels: `AAA`, `AA`, `A+`, `A`, `WINTER`.

## No Tests

This project has no test suite or linter configured.
