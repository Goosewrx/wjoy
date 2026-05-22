# Fairway League Hub

A browser-based golf league operations page for tracking leagues, roster spots, player payments, round schedules, and tee-time assignments.

## Run locally

This is a static app with no build step.

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Features

- Create, switch between, and delete leagues.
- Edit each league's name, season, dues, and roster capacity.
- Add and remove rostered players.
- Track player statuses, contact details, notes, and payments.
- Add rounds with course, date, tee time, roster spots, and notes.
- Assign rostered golfers to tee-time spots and remove assignments.
- Persist data in the browser with `localStorage`.

## New concept notes

- [Golf leveling app concept](docs/golf-leveling-app.md) - a product and MVP plan for a golf practice app with RPG-style progression built around this repository's Wiimote motion-input capabilities.
