# Fairway League Hub

A browser-based golf league operations page for tracking leagues, roster spots, player payments, round schedules, and tee-time assignments.

## Run locally

This is a static app with no build step.

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

## Supabase setup

Run `supabase/schema.sql` in the Supabase SQL editor, then copy `supabase-config.example.js` to `supabase-config.js` and fill in your project URL and anon key.

```js
window.LEAGUE_HUB_SUPABASE = {
  url: "https://YOUR-PROJECT.supabase.co",
  anonKey: "YOUR-SUPABASE-ANON-KEY",
  stateId: "primary"
};
```

When `supabase-config.js` is present, the app stores league data in Supabase. Without it, the app uses browser storage for local development.

## Features

- Create, switch between, and delete leagues.
- Edit each league's name, season, dues, and roster capacity.
- Add league bio, by-laws, and general information.
- Add manager-controlled league logo, text size, and text-field height settings.
- Add member-visible online payment links for league dues, defaulting to the Oaks/CandiaWoods secure payment portal.
- Gate each league portal behind roster-email member login or manager passcode access.
- Split each league hub into Overview, Roster & Teams, Schedule & Tee Sheet, Messages, and Manager Tools pages.
- Add and remove rostered players.
- Import roster spreadsheets from Excel-exported CSV/TSV files.
- Create fixed scramble teams and assign rostered players to team rosters.
- Track player statuses, contact details, notes, and paid/unpaid payments.
- Show customer-visible scramble teams, active roster, and sub directory without exposing email or phone details.
- Add rounds with course, date, tee slots, tee-sheet starting times, and notes.
- Add an editable schedule calendar table whose playable rows automatically generate rounds and tee sheets from standard start times.
- Treat every active roster player as playing each round by default, grouped by fixed scramble teams with per-date can't-play availability and visible sub requests.
- Let signed-in members post league messages and update only their own round availability.
- Let signed-in members send direct portal messages to other rostered players.
- Persist data in the browser with `localStorage`.

## New concept notes

- [Golf leveling app concept](docs/golf-leveling-app.md) - a product and MVP plan for a golf practice app with RPG-style progression built around this repository's Wiimote motion-input capabilities.
- [Golf course schedule maker](golf-scheduler/README.md) - a small browser app that builds daily staff schedules from shift needs, availability, and role preferences.
