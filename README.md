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
- Add league bio, by-laws, and general information.
- Add member-visible online payment links for league dues, defaulting to the Oaks/CandiaWoods secure payment portal.
- Gate each league portal behind roster-email member login or manager passcode access.
- Add and remove rostered players.
- Import roster spreadsheets from Excel-exported CSV/TSV files.
- Create fixed scramble teams and assign rostered players to team rosters.
- Track player statuses, contact details, notes, and paid/unpaid payments.
- Show customer-visible scramble teams, active roster, and sub directory with contact links.
- Add rounds with course, date, tee slots, and notes.
- Treat every active roster player as playing each round by default, grouped by fixed scramble teams with per-date can't-play availability and visible sub requests.
- Let signed-in members post league messages and update only their own round availability.
- Persist data in the browser with `localStorage`.

## New concept notes

- [Golf leveling app concept](docs/golf-leveling-app.md) - a product and MVP plan for a golf practice app with RPG-style progression built around this repository's Wiimote motion-input capabilities.
