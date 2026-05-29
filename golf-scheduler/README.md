# Golf Course Schedule Maker

A small, dependency-free web app for building a daily golf course staff schedule from:

- required shifts and staffing counts,
- employee availability windows,
- preferred roles,
- roles a person cannot work,
- maximum shifts per person.

## Run locally

```sh
npm start
```

Then open `http://localhost:4173`.

## Test

```sh
npm test
```

## Scheduling behavior

The scheduler expands every shift into one slot per needed employee. For each slot it chooses from
employees who are available, not already assigned to an overlapping shift, not blocked from that
role, and below their max shift count. It favors preferred roles first, then balances total assigned
minutes across the team.
