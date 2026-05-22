const STORAGE_KEY = "fairway-league-hub";

const seedData = {
  selectedLeagueId: "league-demo",
  leagues: [
    {
      id: "league-demo",
      name: "Thursday Night League",
      season: "Summer 2026",
      rosterLimit: 24,
      dues: 120,
      players: [
        {
          id: "player-1",
          name: "Avery Brooks",
          email: "avery@example.com",
          phone: "555-0101",
          status: "Active",
          paid: 120,
          notes: "Prefers early tee times"
        },
        {
          id: "player-2",
          name: "Sam Carter",
          email: "sam@example.com",
          phone: "555-0102",
          status: "Active",
          paid: 60,
          notes: "Needs cart"
        },
        {
          id: "player-3",
          name: "Riley Chen",
          email: "riley@example.com",
          phone: "",
          status: "Waitlist",
          paid: 0,
          notes: "Available as sub"
        }
      ],
      rounds: [
        {
          id: "round-1",
          course: "Pine Ridge Golf Club",
          date: "2026-06-04",
          teeTime: "17:30",
          spots: 16,
          notes: "Front nine",
          playerIds: ["player-1", "player-2"]
        }
      ]
    }
  ]
};

let state = loadState();

const elements = {
  activeLeagueSubtitle: document.querySelector("#active-league-subtitle"),
  activeLeagueTitle: document.querySelector("#active-league-title"),
  deleteLeague: document.querySelector("#delete-league"),
  emptyState: document.querySelector("#empty-state"),
  leagueCount: document.querySelector("#league-count"),
  leagueForm: document.querySelector("#league-form"),
  leagueList: document.querySelector("#league-list"),
  leagueWorkspace: document.querySelector("#league-workspace"),
  metricCardTemplate: document.querySelector("#metric-card-template"),
  metrics: document.querySelector("#metrics"),
  playerForm: document.querySelector("#player-form"),
  playerTable: document.querySelector("#player-table"),
  rosterStatus: document.querySelector("#roster-status"),
  roundForm: document.querySelector("#round-form"),
  roundList: document.querySelector("#round-list"),
  scheduleStatus: document.querySelector("#schedule-status"),
  settingsForm: document.querySelector("#settings-form")
};

elements.leagueForm.addEventListener("submit", createLeague);
elements.settingsForm.addEventListener("input", updateSettings);
elements.playerForm.addEventListener("submit", addPlayer);
elements.roundForm.addEventListener("submit", addRound);
elements.deleteLeague.addEventListener("click", deleteActiveLeague);

render();

function loadState() {
  const saved = window.localStorage.getItem(STORAGE_KEY);

  if (!saved) {
    return structuredClone(seedData);
  }

  try {
    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed.leagues)) {
      return structuredClone(seedData);
    }
    return parsed;
  } catch {
    return structuredClone(seedData);
  }
}

function saveState() {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function activeLeague() {
  return state.leagues.find((league) => league.id === state.selectedLeagueId) ?? state.leagues[0];
}

function uid(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function money(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(Number(value) || 0);
}

function formatDate(value) {
  if (!value) {
    return "Date TBD";
  }

  const date = new Date(`${value}T12:00:00`);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(date);
}

function formatTime(value) {
  if (!value) {
    return "Time TBD";
  }

  const [hour = "0", minute = "0"] = value.split(":");
  const date = new Date();
  date.setHours(Number(hour), Number(minute));
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit"
  }).format(date);
}

function createLeague(event) {
  event.preventDefault();
  const data = Object.fromEntries(new FormData(event.currentTarget));
  const league = {
    id: uid("league"),
    name: data.name.trim(),
    season: data.season.trim(),
    rosterLimit: Number(data.rosterLimit),
    dues: Number(data.dues),
    players: [],
    rounds: []
  };

  state.leagues.push(league);
  state.selectedLeagueId = league.id;
  event.currentTarget.reset();
  event.currentTarget.rosterLimit.value = 24;
  event.currentTarget.dues.value = 120;
  persistAndRender();
}

function updateSettings(event) {
  const league = activeLeague();
  if (!league) {
    return;
  }

  const field = event.target.name;
  const value = event.target.value;

  if (field === "rosterLimit" || field === "dues") {
    league[field] = Math.max(0, Number(value));
  } else {
    league[field] = value;
  }

  persistAndRender();
}

function addPlayer(event) {
  event.preventDefault();
  const league = activeLeague();
  const data = Object.fromEntries(new FormData(event.currentTarget));

  if (!league || !data.name.trim()) {
    return;
  }

  league.players.push({
    id: uid("player"),
    name: data.name.trim(),
    email: data.email.trim(),
    phone: data.phone.trim(),
    status: data.status,
    paid: Number(data.paid) || 0,
    notes: data.notes.trim()
  });

  event.currentTarget.reset();
  event.currentTarget.status.value = "Active";
  event.currentTarget.paid.value = 0;
  persistAndRender();
}

function addRound(event) {
  event.preventDefault();
  const league = activeLeague();
  const data = Object.fromEntries(new FormData(event.currentTarget));

  if (!league || !data.course.trim()) {
    return;
  }

  league.rounds.push({
    id: uid("round"),
    course: data.course.trim(),
    date: data.date,
    teeTime: data.teeTime,
    spots: Number(data.spots) || 1,
    notes: data.notes.trim(),
    playerIds: []
  });

  event.currentTarget.reset();
  event.currentTarget.spots.value = 16;
  persistAndRender();
}

function deleteActiveLeague() {
  const league = activeLeague();
  if (!league) {
    return;
  }

  const confirmed = window.confirm(`Delete ${league.name}? This removes its roster, payments, and schedule.`);
  if (!confirmed) {
    return;
  }

  state.leagues = state.leagues.filter((item) => item.id !== league.id);
  state.selectedLeagueId = state.leagues[0]?.id ?? null;
  persistAndRender();
}

function persistAndRender() {
  saveState();
  render();
}

function render() {
  const league = activeLeague();
  state.selectedLeagueId = league?.id ?? null;

  renderLeagueList();

  if (!league) {
    elements.emptyState.hidden = false;
    elements.leagueWorkspace.hidden = true;
    elements.deleteLeague.hidden = true;
    elements.activeLeagueTitle.textContent = "Create a league to get started";
    elements.activeLeagueSubtitle.textContent = "Track rosters, dues, schedule, tee times, and available spots in one place.";
    return;
  }

  elements.emptyState.hidden = true;
  elements.leagueWorkspace.hidden = false;
  elements.deleteLeague.hidden = false;
  elements.activeLeagueTitle.textContent = league.name;
  elements.activeLeagueSubtitle.textContent = `${league.season} - ${league.players.length} players - ${league.rounds.length} scheduled rounds`;

  elements.settingsForm.name.value = league.name;
  elements.settingsForm.season.value = league.season;
  elements.settingsForm.rosterLimit.value = league.rosterLimit;
  elements.settingsForm.dues.value = league.dues;

  renderMetrics(league);
  renderPlayers(league);
  renderRounds(league);
}

function renderLeagueList() {
  elements.leagueCount.textContent = state.leagues.length;
  elements.leagueList.replaceChildren();

  if (!state.leagues.length) {
    const empty = document.createElement("p");
    empty.className = "empty-copy";
    empty.textContent = "No leagues created.";
    elements.leagueList.append(empty);
    return;
  }

  state.leagues.forEach((league) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `league-button${league.id === state.selectedLeagueId ? " active" : ""}`;
    button.innerHTML = `<strong>${escapeHtml(league.name)}</strong><small>${escapeHtml(league.season)} - ${league.players.length}/${league.rosterLimit} players</small>`;
    button.addEventListener("click", () => {
      state.selectedLeagueId = league.id;
      persistAndRender();
    });
    elements.leagueList.append(button);
  });
}

function renderMetrics(league) {
  const activePlayers = league.players.filter((player) => player.status === "Active").length;
  const openSpots = Math.max(0, league.rosterLimit - activePlayers);
  const totalDue = league.players.reduce((sum, player) => sum + amountDue(league, player), 0);
  const totalPaid = league.players.reduce((sum, player) => sum + Number(player.paid || 0), 0);
  const nextRound = [...league.rounds]
    .filter((round) => round.date)
    .sort((a, b) => a.date.localeCompare(b.date))[0];

  const cards = [
    ["Active roster", `${activePlayers}/${league.rosterLimit}`, `${openSpots} open spots`],
    ["Payments", money(totalPaid), `${money(totalDue)} remaining`],
    ["Rounds", league.rounds.length, nextRound ? `Next: ${formatDate(nextRound.date)}` : "No rounds scheduled"],
    ["Tee time capacity", league.rounds.reduce((sum, round) => sum + Number(round.spots || 0), 0), "Total available round spots"]
  ];

  elements.metrics.replaceChildren();
  cards.forEach(([label, value, detail]) => {
    const card = elements.metricCardTemplate.content.firstElementChild.cloneNode(true);
    card.querySelector("p").textContent = label;
    card.querySelector("strong").textContent = value;
    card.querySelector("span").textContent = detail;
    elements.metrics.append(card);
  });

  elements.rosterStatus.textContent = `${openSpots} spots open`;
  elements.scheduleStatus.textContent = `${league.rounds.length} rounds`;
}

function renderPlayers(league) {
  elements.playerTable.replaceChildren();

  if (!league.players.length) {
    const row = document.createElement("tr");
    row.innerHTML = `<td colspan="5" class="muted">No players yet. Add a player to start building the roster.</td>`;
    elements.playerTable.append(row);
    return;
  }

  league.players.forEach((player) => {
    const due = amountDue(league, player);
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>
        <div class="person-name">${escapeHtml(player.name)}</div>
        <div class="muted">${escapeHtml(player.notes || "No notes")}</div>
      </td>
      <td><span class="status-pill ${player.status.toLowerCase()}">${escapeHtml(player.status)}</span></td>
      <td>
        <div class="${due <= 0 ? "payment-good" : "payment-due"}">${due <= 0 ? "Paid" : `${money(due)} due`}</div>
        <div class="muted">${money(player.paid)} of ${money(league.dues)}</div>
      </td>
      <td>
        <div>${escapeHtml(player.email || "No email")}</div>
        <div class="muted">${escapeHtml(player.phone || "No phone")}</div>
      </td>
      <td></td>
    `;

    const actions = document.createElement("div");
    actions.className = "player-actions";
    actions.append(
      actionButton(due <= 0 ? "Mark unpaid" : "Mark paid", () => {
        player.paid = due <= 0 ? 0 : Number(league.dues || 0);
        persistAndRender();
      }),
      actionButton(nextStatusLabel(player.status), () => {
        player.status = nextStatus(player.status);
        persistAndRender();
      }),
      actionButton("Remove", () => removePlayer(league, player.id), "danger ghost")
    );

    row.lastElementChild.append(actions);
    elements.playerTable.append(row);
  });
}

function amountDue(league, player) {
  return Math.max(0, Number(league.dues || 0) - Number(player.paid || 0));
}

function nextStatusLabel(status) {
  if (status === "Active") {
    return "Move to waitlist";
  }

  if (status === "Waitlist") {
    return "Make sub";
  }

  return "Make active";
}

function nextStatus(status) {
  if (status === "Active") {
    return "Waitlist";
  }

  if (status === "Waitlist") {
    return "Substitute";
  }

  return "Active";
}

function removePlayer(league, playerId) {
  league.players = league.players.filter((player) => player.id !== playerId);
  league.rounds.forEach((round) => {
    round.playerIds = round.playerIds.filter((id) => id !== playerId);
  });
  persistAndRender();
}

function renderRounds(league) {
  elements.roundList.replaceChildren();

  if (!league.rounds.length) {
    const empty = document.createElement("p");
    empty.className = "empty-copy";
    empty.textContent = "No rounds scheduled. Add a course, date, and tee time.";
    elements.roundList.append(empty);
    return;
  }

  [...league.rounds]
    .sort((a, b) => `${a.date}${a.teeTime}`.localeCompare(`${b.date}${b.teeTime}`))
    .forEach((round) => {
      const assignedPlayers = round.playerIds
        .map((id) => league.players.find((player) => player.id === id))
        .filter(Boolean);
      const openSpots = Math.max(0, Number(round.spots || 0) - assignedPlayers.length);
      const card = document.createElement("article");
      card.className = "round-card";
      card.innerHTML = `
        <h3>${escapeHtml(round.course)}</h3>
        <div class="round-meta">
          <span>${formatDate(round.date)}</span>
          <span>${formatTime(round.teeTime)}</span>
          <span>${assignedPlayers.length}/${round.spots} spots filled</span>
        </div>
        <p class="muted">${escapeHtml(round.notes || "No notes")}</p>
      `;

      const chips = document.createElement("div");
      chips.className = "chip-row";

      if (assignedPlayers.length) {
        assignedPlayers.forEach((player) => {
          const chip = document.createElement("span");
          chip.className = "chip";
          chip.textContent = player.name;
          chip.append(actionButton("x", () => {
            round.playerIds = round.playerIds.filter((id) => id !== player.id);
            persistAndRender();
          }));
          chips.append(chip);
        });
      } else {
        const empty = document.createElement("span");
        empty.className = "muted";
        empty.textContent = "No players assigned.";
        chips.append(empty);
      }

      card.append(chips);
      card.append(roundAssignmentControls(league, round, openSpots));
      card.append(actionButton("Remove round", () => {
        league.rounds = league.rounds.filter((item) => item.id !== round.id);
        persistAndRender();
      }, "danger ghost"));
      elements.roundList.append(card);
    });
}

function roundAssignmentControls(league, round, openSpots) {
  const wrapper = document.createElement("div");
  wrapper.className = "assignment-form";

  const label = document.createElement("label");
  label.textContent = "Assign rostered golfer";

  const select = document.createElement("select");
  const availablePlayers = league.players.filter((player) => !round.playerIds.includes(player.id));
  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = availablePlayers.length ? "Choose player" : "No available players";
  select.append(placeholder);

  availablePlayers.forEach((player) => {
    const option = document.createElement("option");
    option.value = player.id;
    option.textContent = `${player.name} (${player.status})`;
    select.append(option);
  });

  label.append(select);
  const assignButton = actionButton(openSpots > 0 ? "Assign" : "Full", () => {
    if (!select.value || openSpots <= 0) {
      return;
    }
    round.playerIds.push(select.value);
    persistAndRender();
  });
  assignButton.disabled = openSpots <= 0 || availablePlayers.length === 0;

  wrapper.append(label, assignButton);
  return wrapper;
}

function actionButton(label, onClick, className = "ghost") {
  const button = document.createElement("button");
  button.type = "button";
  button.className = className;
  button.textContent = label;
  button.addEventListener("click", onClick);
  return button;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
