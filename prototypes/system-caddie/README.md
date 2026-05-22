# System Caddie Prototype

This is a dependency-free browser prototype for the manual-entry golf leveling app. It stores demo progress in `localStorage`.

## Run it

From the repository root:

```bash
python3 -m http.server 8000 --directory prototypes/system-caddie
```

Then open:

```text
http://localhost:8000
```

You can also open `index.html` directly in a browser, but using a local server is closer to how it would be hosted.

## What you can test

- Enter practice sessions.
- Enter round scorecard stats.
- Complete quests.
- Gain XP and stat progress.
- Rank up based on logged evidence.
- Reset demo data.
