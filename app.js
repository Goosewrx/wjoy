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
      bio: "Friendly weekly scramble league for golfers who want organized rounds without extra paperwork.",
      bylaws: "Players should confirm availability for each round. If you cannot play, reach out to the sub list to cover your spot.",
      generalInfo: "Rounds are managed in Golf Genius. Use this hub for league roster, team, payment, and availability visibility.",
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
          availability: {
            "player-1": "confirmed",
            "player-2": "out"
          },
          substitutions: [
            {
              outPlayerId: "player-2",
              subPlayerId: "player-3"
            }
          ]
        }
      ],
      teams: [
        {
          id: "team-1",
          name: "Birdie Brigade",
          captainId: "player-1",
          color: "Forest green",
          notes: "Opening foursome",
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
  leagueInfoForm: document.querySelector("#league-info-form"),
  leagueForm: document.querySelector("#league-form"),
  leagueList: document.querySelector("#league-list"),
  leagueWorkspace: document.querySelector("#league-workspace"),
  metricCardTemplate: document.querySelector("#metric-card-template"),
  metrics: document.querySelector("#metrics"),
  playerForm: document.querySelector("#player-form"),
  playerTable: document.querySelector("#player-table"),
  publicRosterList: document.querySelector("#public-roster-list"),
  publicSubList: document.querySelector("#public-sub-list"),
  publicTeamList: document.querySelector("#public-team-list"),
  rosterStatus: document.querySelector("#roster-status"),
  rosterImportForm: document.querySelector("#roster-import-form"),
  rosterImportStatus: document.querySelector("#roster-import-status"),
  roundForm: document.querySelector("#round-form"),
  roundList: document.querySelector("#round-list"),
  scheduleStatus: document.querySelector("#schedule-status"),
  settingsForm: document.querySelector("#settings-form"),
  teamCaptainSelect: document.querySelector("#team-captain-select"),
  teamForm: document.querySelector("#team-form"),
  teamList: document.querySelector("#team-list"),
  teamStatus: document.querySelector("#team-status")
};

elements.leagueForm.addEventListener("submit", createLeague);
elements.settingsForm.addEventListener("input", updateSettings);
elements.leagueInfoForm.addEventListener("input", updateLeagueInfo);
elements.playerForm.addEventListener("submit", addPlayer);
elements.rosterImportForm.addEventListener("submit", importRoster);
elements.roundForm.addEventListener("submit", addRound);
elements.teamForm.addEventListener("submit", addTeam);
elements.deleteLeague.addEventListener("click", deleteActiveLeague);

render();

function loadState() {
  const saved = window.localStorage.getItem(STORAGE_KEY);

  if (!saved) {
    return normalizeState(structuredClone(seedData));
  }

  try {
    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed.leagues)) {
      return normalizeState(structuredClone(seedData));
    }
    return normalizeState(parsed);
  } catch {
    return normalizeState(structuredClone(seedData));
  }
}

function normalizeState(candidate) {
  const leagues = candidate.leagues.map((league) => ({
    ...league,
    bio: league.bio || "",
    bylaws: league.bylaws || "",
    generalInfo: league.generalInfo || "",
    players: Array.isArray(league.players) ? league.players.map((player) => normalizePlayer(league, player)) : [],
    rounds: Array.isArray(league.rounds)
      ? league.rounds.map((round) => ({
          ...round,
          availability: round.availability && typeof round.availability === "object" ? round.availability : {},
          playerIds: Array.isArray(round.playerIds) ? round.playerIds : [],
          substitutions: Array.isArray(round.substitutions)
            ? round.substitutions.filter((substitution) => substitution.outPlayerId && substitution.subPlayerId)
            : []
        }))
      : [],
    teams: Array.isArray(league.teams)
      ? league.teams.map((team) => ({
          ...team,
          captainId: team.captainId || "",
          color: team.color || "",
          notes: team.notes || "",
          playerIds: Array.isArray(team.playerIds) ? team.playerIds : []
        }))
      : []
  }));

  return {
    selectedLeagueId: leagues.some((league) => league.id === candidate.selectedLeagueId)
      ? candidate.selectedLeagueId
      : leagues[0]?.id ?? null,
    leagues
  };
}

function normalizePlayer(league, player) {
  return {
    ...player,
    paid: isPaidValue(player.paid) ? Number(league.dues || 0) : 0
  };
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
    bio: "",
    bylaws: "",
    generalInfo: "",
    players: [],
    rounds: [],
    teams: []
  };

  state.leagues.push(league);
  state.selectedLeagueId = league.id;
  event.currentTarget.reset();
  event.currentTarget.rosterLimit.value = 24;
  event.currentTarget.dues.value = 120;
  persistAndRender();
}

function addTeam(event) {
  event.preventDefault();
  const league = activeLeague();
  const data = Object.fromEntries(new FormData(event.currentTarget));

  if (!league || !data.name.trim()) {
    return;
  }

  league.teams.push({
    id: uid("team"),
    name: data.name.trim(),
    captainId: data.captainId,
    color: data.color.trim(),
    notes: data.notes.trim(),
    playerIds: data.captainId ? [data.captainId] : []
  });

  event.currentTarget.reset();
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

function updateLeagueInfo(event) {
  const league = activeLeague();
  if (!league) {
    return;
  }

  league[event.target.name] = event.target.value;
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
    paid: data.paid === "paid" ? Number(league.dues || 0) : 0,
    notes: data.notes.trim()
  });

  event.currentTarget.reset();
  event.currentTarget.status.value = "Active";
  event.currentTarget.paid.value = "unpaid";
  persistAndRender();
}

async function importRoster(event) {
  event.preventDefault();
  const league = activeLeague();
  const file = event.currentTarget.rosterFile.files[0];

  if (!league || !file) {
    return;
  }

  try {
    const text = await file.text();
    const rows = parseDelimitedRows(text);

    if (rows.length < 2) {
      throw new Error("The import file needs a header row and at least one player row.");
    }

    const headers = rows[0].map(normalizeHeader);
    let importedCount = 0;

    rows.slice(1).forEach((row) => {
      if (!row.some((value) => value.trim())) {
        return;
      }

      const name = columnValue(row, headers, ["name", "player", "playername", "fullname"]);
      if (!name) {
        return;
      }

      const email = columnValue(row, headers, ["email", "emailaddress", "e-mail"]);
      const existing = league.players.find((player) => {
        const sameEmail = email && player.email && player.email.toLowerCase() === email.toLowerCase();
        const sameName = player.name.toLowerCase() === name.toLowerCase();
        return sameEmail || sameName;
      });
      const player = existing ?? {
        id: uid("player"),
        name,
        email: "",
        phone: "",
        status: "Active",
        paid: 0,
        notes: ""
      };

      player.name = name;
      player.email = email;
      player.phone = columnValue(row, headers, ["phone", "cell", "mobile", "phonenumber"]);
      player.status = normalizePlayerStatus(columnValue(row, headers, ["status", "type", "role"]));
      player.paid = isPaidValue(columnValue(row, headers, ["paid", "payment", "paymentstatus", "paidstatus"]))
        ? Number(league.dues || 0)
        : 0;
      player.notes = columnValue(row, headers, ["notes", "note", "comments"]);

      if (!existing) {
        league.players.push(player);
      }

      const teamName = columnValue(row, headers, ["team", "scrambleteam", "scramble"]);
      if (teamName && player.status === "Active") {
        assignPlayerToImportedTeam(league, player.id, teamName);
      }

      importedCount += 1;
    });

    if (!importedCount) {
      throw new Error("No players were imported. Make sure the file has a name or player column.");
    }

    event.currentTarget.reset();
    persistAndRender();
    elements.rosterImportStatus.textContent = `Imported ${importedCount} players. Payments were set as paid or unpaid only.`;
  } catch (error) {
    elements.rosterImportStatus.textContent = error.message;
  }
}

function parseDelimitedRows(text) {
  const firstLine = text.split(/\r?\n/, 1)[0] ?? "";
  const delimiter = firstLine.includes("\t") ? "\t" : ",";
  const rows = [];
  let row = [];
  let value = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    const next = text[index + 1];

    if (character === '"') {
      if (quoted && next === '"') {
        value += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (character === delimiter && !quoted) {
      row.push(value.trim());
      value = "";
    } else if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && next === "\n") {
        index += 1;
      }
      row.push(value.trim());
      rows.push(row);
      row = [];
      value = "";
    } else {
      value += character;
    }
  }

  if (value || row.length) {
    row.push(value.trim());
    rows.push(row);
  }

  return rows.filter((entry) => entry.some((cell) => cell));
}

function normalizeHeader(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9]/g, "");
}

function columnValue(row, headers, aliases) {
  const index = aliases.map(normalizeHeader).map((alias) => headers.indexOf(alias)).find((columnIndex) => columnIndex >= 0);
  return index === undefined ? "" : (row[index] || "").trim();
}

function normalizePlayerStatus(value) {
  const normalized = String(value || "Active").trim().toLowerCase();

  if (["sub", "substitute", "alternate"].includes(normalized)) {
    return "Substitute";
  }

  if (["wait", "waitlist", "waiting"].includes(normalized)) {
    return "Waitlist";
  }

  return "Active";
}

function assignPlayerToImportedTeam(league, playerId, teamName) {
  league.teams.forEach((team) => {
    team.playerIds = team.playerIds.filter((id) => id !== playerId);
  });

  let team = league.teams.find((item) => item.name.toLowerCase() === teamName.toLowerCase());
  if (!team) {
    team = {
      id: uid("team"),
      name: teamName,
      captainId: playerId,
      color: "",
      notes: "Imported from roster spreadsheet",
      playerIds: []
    };
    league.teams.push(team);
  }

  if (!team.playerIds.includes(playerId)) {
    team.playerIds.push(playerId);
  }

  if (!team.captainId) {
    team.captainId = playerId;
  }
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
    availability: {},
    substitutions: []
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
  elements.activeLeagueSubtitle.textContent = `${league.season} - ${league.players.length} players - ${league.teams.length} teams - ${league.rounds.length} scheduled rounds`;

  elements.settingsForm.name.value = league.name;
  elements.settingsForm.season.value = league.season;
  elements.settingsForm.rosterLimit.value = league.rosterLimit;
  elements.settingsForm.dues.value = league.dues;
  elements.leagueInfoForm.bio.value = league.bio;
  elements.leagueInfoForm.bylaws.value = league.bylaws;
  elements.leagueInfoForm.generalInfo.value = league.generalInfo;

  renderMetrics(league);
  renderPublicRosters(league);
  renderPlayers(league);
  renderTeams(league);
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
  const paidPlayers = league.players.filter((player) => amountDue(league, player) <= 0).length;
  const nextRound = [...league.rounds]
    .filter((round) => round.date)
    .sort((a, b) => a.date.localeCompare(b.date))[0];

  const cards = [
    ["Active roster", `${activePlayers}/${league.rosterLimit}`, `${openSpots} open spots`],
    ["Payments", `${paidPlayers}/${league.players.length}`, `${money(totalPaid)} paid - ${money(totalDue)} remaining`],
    ["Teams", league.teams.length, `${teamMemberCount(league)} rostered on teams`],
    ["Rounds", league.rounds.length, nextRound ? `Next: ${formatDate(nextRound.date)}` : "No rounds scheduled"],
    ["Round starters", league.rounds.reduce((sum, round) => sum + roundPlayingPlayers(league, round).length, 0), "Roster players scheduled by default"]
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
  elements.teamStatus.textContent = `${league.teams.length} teams`;
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
    const teamName = teamForPlayer(league, player.id)?.name ?? "No team";
    const paid = due <= 0;
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>
        <div class="person-name">${escapeHtml(player.name)}</div>
        <div class="muted">${escapeHtml(teamName)} - ${escapeHtml(player.notes || "No notes")}</div>
      </td>
      <td><span class="status-pill ${player.status.toLowerCase()}">${escapeHtml(player.status)}</span></td>
      <td>
        <div class="${paid ? "payment-good" : "payment-due"}">${paid ? "Paid in full" : "Unpaid"}</div>
        <div class="muted">${paid ? money(league.dues) : money(0)} of ${money(league.dues)}</div>
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
      actionButton(paid ? "Mark unpaid" : "Mark paid", () => {
        player.paid = paid ? 0 : Number(league.dues || 0);
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
  return isPaidValue(player.paid) ? 0 : Number(league.dues || 0);
}

function isPaidValue(value) {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "number") {
    return value > 0;
  }

  const normalized = String(value ?? "").trim().toLowerCase();
  return ["paid", "yes", "y", "true", "1", "full", "complete", "completed"].includes(normalized);
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
    round.playerIds = Array.isArray(round.playerIds) ? round.playerIds.filter((id) => id !== playerId) : [];
    delete roundAvailability(round)[playerId];
    round.substitutions = roundSubstitutions(round).filter(
      (substitution) => substitution.outPlayerId !== playerId && substitution.subPlayerId !== playerId
    );
  });
  league.teams.forEach((team) => {
    team.playerIds = team.playerIds.filter((id) => id !== playerId);
    if (team.captainId === playerId) {
      team.captainId = team.playerIds[0] ?? "";
    }
  });
  persistAndRender();
}

function renderPublicRosters(league) {
  renderDirectoryList(elements.publicRosterList, activeRosterPlayers(league), "No roster players yet.");
  renderPublicScrambleTeams(league);
  renderDirectoryList(elements.publicSubList, subRosterPlayers(league), "No subs listed yet.");
}

function renderDirectoryList(container, players, emptyText) {
  container.replaceChildren();

  if (!players.length) {
    const empty = document.createElement("p");
    empty.className = "empty-copy";
    empty.textContent = emptyText;
    container.append(empty);
    return;
  }

  players.forEach((player) => {
    const card = document.createElement("article");
    card.className = "directory-card";

    const details = document.createElement("div");
    details.innerHTML = `
      <strong>${escapeHtml(player.name)}</strong>
      <span>${escapeHtml(player.status)}</span>
      <small>${escapeHtml(player.notes || "No notes")}</small>
    `;

    card.append(details, contactLinks(player));
    container.append(card);
  });
}

function renderPublicScrambleTeams(league) {
  elements.publicTeamList.replaceChildren();

  if (!league.teams.length) {
    const empty = document.createElement("p");
    empty.className = "empty-copy";
    empty.textContent = "No set scramble teams yet.";
    elements.publicTeamList.append(empty);
    return;
  }

  league.teams.forEach((team) => {
    const members = teamMembers(league, team).filter((player) => player.status === "Active");
    const captain = playerById(league, team.captainId);
    const card = document.createElement("article");
    card.className = "directory-card team-directory-card";

    const details = document.createElement("div");
    details.innerHTML = `
      <strong>${escapeHtml(team.name)}</strong>
      <span>${captain ? `Captain: ${escapeHtml(captain.name)}` : "No captain set"}</span>
      <small>${escapeHtml(team.color || "No color")} - ${members.length} roster players</small>
    `;

    const chips = document.createElement("div");
    chips.className = "chip-row";
    if (members.length) {
      members.forEach((player) => {
        const chip = document.createElement("span");
        chip.className = "chip";
        chip.textContent = player.name;
        chips.append(chip);
      });
    } else {
      const empty = document.createElement("span");
      empty.className = "muted";
      empty.textContent = "No active members.";
      chips.append(empty);
    }

    card.append(details, chips);
    elements.publicTeamList.append(card);
  });
}

function renderTeams(league) {
  renderTeamCaptainOptions(league);
  elements.teamList.replaceChildren();

  if (!league.teams.length) {
    const empty = document.createElement("p");
    empty.className = "empty-copy";
    empty.textContent = "No teams yet. Create a team for leagues that play in groups or matches.";
    elements.teamList.append(empty);
    return;
  }

  league.teams.forEach((team) => {
    const members = team.playerIds
      .map((id) => league.players.find((player) => player.id === id))
      .filter(Boolean);
    const captain = league.players.find((player) => player.id === team.captainId);
    const card = document.createElement("article");
    card.className = "team-card";
    card.innerHTML = `
      <div class="team-card-header">
        <div>
          <h3>${escapeHtml(team.name)}</h3>
          <p class="muted">${escapeHtml(team.color || "No color")} - ${members.length} members</p>
        </div>
        <span class="pill">${captain ? `Captain: ${escapeHtml(captain.name)}` : "No captain"}</span>
      </div>
      <p class="muted">${escapeHtml(team.notes || "No notes")}</p>
    `;

    const chips = document.createElement("div");
    chips.className = "chip-row";

    if (members.length) {
      members.forEach((player) => {
        const chip = document.createElement("span");
        chip.className = "chip";
        chip.textContent = player.name;
        chip.append(actionButton("x", () => removePlayerFromTeam(team, player.id)));
        chips.append(chip);
      });
    } else {
      const empty = document.createElement("span");
      empty.className = "muted";
      empty.textContent = "No team members assigned.";
      chips.append(empty);
    }

    card.append(chips);
    card.append(teamAssignmentControls(league, team));
    card.append(actionButton("Remove team", () => removeTeam(league, team.id), "danger ghost"));
    elements.teamList.append(card);
  });
}

function renderTeamCaptainOptions(league) {
  elements.teamCaptainSelect.replaceChildren();

  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = league.players.length ? "No captain yet" : "Add players first";
  elements.teamCaptainSelect.append(placeholder);

  league.players.forEach((player) => {
    const option = document.createElement("option");
    option.value = player.id;
    option.textContent = player.name;
    elements.teamCaptainSelect.append(option);
  });
}

function teamAssignmentControls(league, team) {
  const wrapper = document.createElement("div");
  wrapper.className = "assignment-form";

  const label = document.createElement("label");
  label.textContent = "Add rostered player";

  const select = document.createElement("select");
  const availablePlayers = league.players.filter((player) => !team.playerIds.includes(player.id));
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
  const assignButton = actionButton("Add to team", () => {
    if (!select.value) {
      return;
    }
    team.playerIds.push(select.value);
    if (!team.captainId) {
      team.captainId = select.value;
    }
    persistAndRender();
  });
  assignButton.disabled = availablePlayers.length === 0;

  wrapper.append(label, assignButton);
  return wrapper;
}

function removePlayerFromTeam(team, playerId) {
  team.playerIds = team.playerIds.filter((id) => id !== playerId);
  if (team.captainId === playerId) {
    team.captainId = team.playerIds[0] ?? "";
  }
  persistAndRender();
}

function removeTeam(league, teamId) {
  league.teams = league.teams.filter((team) => team.id !== teamId);
  persistAndRender();
}

function teamForPlayer(league, playerId) {
  return league.teams.find((team) => team.playerIds.includes(playerId));
}

function teamMembers(league, team) {
  return team.playerIds.map((id) => playerById(league, id)).filter(Boolean);
}

function teamNameForPlayer(league, playerId) {
  return teamForPlayer(league, playerId)?.name ?? "Unassigned scramble team";
}

function scrambleTeamGroups(league) {
  const assignedIds = new Set(league.teams.flatMap((team) => team.playerIds));
  const groups = league.teams.map((team) => ({
    id: team.id,
    name: team.name,
    players: teamMembers(league, team).filter((player) => player.status === "Active")
  }));
  const unassignedPlayers = activeRosterPlayers(league).filter((player) => !assignedIds.has(player.id));

  if (unassignedPlayers.length) {
    groups.push({
      id: "unassigned",
      name: "Unassigned roster players",
      players: unassignedPlayers
    });
  }

  return groups.filter((group) => group.players.length);
}

function teamMemberCount(league) {
  return new Set(league.teams.flatMap((team) => team.playerIds)).size;
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
      const activePlayers = activeRosterPlayers(league);
      const playingPlayers = roundPlayingPlayers(league, round);
      const substitutions = roundSubstitutions(round);
      const outPlayers = roundOutPlayers(league, round);
      const confirmedCount = activePlayers.filter((player) => availabilityForPlayer(round, player.id) === "confirmed").length;
      const card = document.createElement("article");
      card.className = "round-card";
      card.innerHTML = `
        <h3>${escapeHtml(round.course)}</h3>
        <div class="round-meta">
          <span>${formatDate(round.date)}</span>
          <span>${formatTime(round.teeTime)}</span>
          <span>${round.spots} tee slots</span>
          <span>${confirmedCount} confirmed</span>
          <span>${outPlayers.length} need subs</span>
          <span>${playingPlayers.length} expected players</span>
          <span>${substitutions.length} substitutions</span>
        </div>
        <p class="muted">${escapeHtml(round.notes || "No notes")}</p>
      `;

      const lineups = roundTeamLineups(league, playingPlayers);

      const availabilityBoard = document.createElement("div");
      availabilityBoard.className = "availability-board";
      const availabilityTitle = document.createElement("h4");
      availabilityTitle.textContent = "Player availability by scramble team";
      availabilityBoard.append(availabilityTitle);

      if (activePlayers.length) {
        renderRoundAvailabilityGroups(league, round).forEach((group) => availabilityBoard.append(group));
      } else {
        const empty = document.createElement("p");
        empty.className = "empty-copy";
        empty.textContent = "Add active roster players so they can confirm or decline this date.";
        availabilityBoard.append(empty);
      }

      const openRequests = document.createElement("div");
      openRequests.className = "open-request-list";
      const requestTitle = document.createElement("h4");
      requestTitle.textContent = "Open sub requests";
      openRequests.append(requestTitle);

      const outWithoutRecordedSub = outPlayers.filter(
        (player) => !substitutions.some((substitution) => substitution.outPlayerId === player.id)
      );
      if (outWithoutRecordedSub.length) {
        outWithoutRecordedSub.forEach((player) => {
          const row = document.createElement("div");
          row.className = "substitution-row attention";
          const message = document.createElement("span");
          const teamName = teamNameForPlayer(league, player.id);
          message.innerHTML = `<strong>${escapeHtml(player.name)}</strong> cannot play for ${escapeHtml(teamName)}. Subs can see this opening; ${escapeHtml(player.name)} can reach out from the sub list.`;
          row.append(message);
          openRequests.append(row);
        });
        openRequests.append(roundSubContactList(league));
      } else {
        const empty = document.createElement("p");
        empty.className = "empty-copy";
        empty.textContent = "No open sub requests for this date.";
        openRequests.append(empty);
      }

      const substitutionList = document.createElement("div");
      substitutionList.className = "substitution-list";
      if (substitutions.length) {
        substitutions.forEach((substitution) => {
          const outPlayer = playerById(league, substitution.outPlayerId);
          const subPlayer = playerById(league, substitution.subPlayerId);
          if (!outPlayer || !subPlayer) {
            return;
          }

          const row = document.createElement("div");
          row.className = "substitution-row";
          row.innerHTML = `<span><strong>${escapeHtml(subPlayer.name)}</strong> subs for ${escapeHtml(outPlayer.name)} on ${escapeHtml(teamNameForPlayer(league, outPlayer.id))}</span>`;
          row.append(actionButton("Remove", () => removeRoundSubstitution(round, substitution.outPlayerId), "danger ghost"));
          substitutionList.append(row);
        });
      } else {
        const empty = document.createElement("p");
        empty.className = "empty-copy";
        empty.textContent = "Everyone on the active roster is expected to play.";
        substitutionList.append(empty);
      }

      card.append(lineups);
      card.append(availabilityBoard);
      card.append(openRequests);
      card.append(substitutionList);
      card.append(roundSubstitutionControls(league, round));
      card.append(actionButton("Remove round", () => {
        league.rounds = league.rounds.filter((item) => item.id !== round.id);
        persistAndRender();
      }, "danger ghost"));
      elements.roundList.append(card);
    });
}

function roundAvailabilityRow(round, player) {
  const row = document.createElement("div");
  row.className = "availability-row";
  const status = availabilityForPlayer(round, player.id);
  const statusText = status === "confirmed" ? "Confirmed" : status === "out" ? "Cannot play" : "Assumed in";

  const details = document.createElement("div");
  details.innerHTML = `<strong>${escapeHtml(player.name)}</strong><span class="status-pill ${status}">${statusText}</span>`;

  const actions = document.createElement("div");
  actions.className = "availability-actions";
  const confirmButton = actionButton("Can play", () => setRoundAvailability(round, player.id, "confirmed"));
  const outButton = actionButton("Cannot play", () => setRoundAvailability(round, player.id, "out"), "danger ghost");
  confirmButton.disabled = status === "confirmed";
  outButton.disabled = status === "out";
  actions.append(confirmButton, outButton);

  row.append(details, actions);
  return row;
}

function renderRoundAvailabilityGroups(league, round) {
  return scrambleTeamGroups(league).map((group) => {
    const section = document.createElement("section");
    section.className = "team-availability-group";

    const title = document.createElement("h5");
    title.textContent = group.name;
    section.append(title);

    group.players.forEach((player) => {
      section.append(roundAvailabilityRow(round, player));
    });

    return section;
  });
}

function roundTeamLineups(league, playingPlayers) {
  const wrapper = document.createElement("div");
  wrapper.className = "round-team-lineups";

  if (!playingPlayers.length) {
    const empty = document.createElement("p");
    empty.className = "muted";
    empty.textContent = "No active roster players yet.";
    wrapper.append(empty);
    return wrapper;
  }

  const playingIds = new Set(playingPlayers.map((player) => player.id));
  scrambleTeamGroups(league).forEach((group) => {
    const card = document.createElement("article");
    card.className = "team-lineup-card";

    const title = document.createElement("h4");
    title.textContent = group.name;
    card.append(title);

    const chips = document.createElement("div");
    chips.className = "chip-row";
    const playingMembers = group.players.filter((player) => playingIds.has(player.id));

    if (playingMembers.length) {
      playingMembers.forEach((player) => {
        const chip = document.createElement("span");
        chip.className = "chip";
        chip.textContent = player.name;
        chips.append(chip);
      });
    } else {
      const empty = document.createElement("span");
      empty.className = "muted";
      empty.textContent = "No players available.";
      chips.append(empty);
    }

    card.append(chips);
    wrapper.append(card);
  });

  const subOnlyPlayers = playingPlayers.filter((player) => !teamForPlayer(league, player.id));
  if (subOnlyPlayers.length) {
    const card = document.createElement("article");
    card.className = "team-lineup-card";
    const title = document.createElement("h4");
    title.textContent = "Subs filling in";
    const chips = document.createElement("div");
    chips.className = "chip-row";
    subOnlyPlayers.forEach((player) => {
      const chip = document.createElement("span");
      chip.className = "chip";
      chip.textContent = player.name;
      chips.append(chip);
    });
    card.append(title, chips);
    wrapper.append(card);
  }

  return wrapper;
}

function roundSubContactList(league) {
  const wrapper = document.createElement("div");
  wrapper.className = "sub-contact-list";
  const players = subRosterPlayers(league);

  if (!players.length) {
    const empty = document.createElement("p");
    empty.className = "empty-copy";
    empty.textContent = "No subs are listed yet.";
    wrapper.append(empty);
    return wrapper;
  }

  players.forEach((player) => {
    const card = document.createElement("article");
    card.className = "directory-card compact";
    const details = document.createElement("div");
    details.innerHTML = `<strong>${escapeHtml(player.name)}</strong><span>${escapeHtml(player.status)}</span>`;
    card.append(details, contactLinks(player));
    wrapper.append(card);
  });

  return wrapper;
}

function roundSubstitutionControls(league, round) {
  const wrapper = document.createElement("div");
  wrapper.className = "assignment-form";

  const outLabel = document.createElement("label");
  outLabel.textContent = "Player who cannot make it";
  const outSelect = document.createElement("select");
  const outPlayers = roundOutPlayers(league, round);
  const playersWithoutSub = outPlayers.filter(
    (player) => !roundSubstitutions(round).some((substitution) => substitution.outPlayerId === player.id)
  );
  const outPlaceholder = document.createElement("option");
  outPlaceholder.value = "";
  outPlaceholder.textContent = playersWithoutSub.length ? "Choose open request" : "No open requests";
  outSelect.append(outPlaceholder);

  playersWithoutSub.forEach((player) => {
    const option = document.createElement("option");
    option.value = player.id;
    option.textContent = `${player.name} (${teamNameForPlayer(league, player.id)})`;
    outSelect.append(option);
  });

  const subLabel = document.createElement("label");
  subLabel.textContent = "Substitute";
  const subSelect = document.createElement("select");
  const substitutes = substitutePlayers(league, round);
  const subPlaceholder = document.createElement("option");
  subPlaceholder.value = "";
  subPlaceholder.textContent = substitutes.length ? "Choose sub" : "No substitutes available";
  subSelect.append(subPlaceholder);

  substitutes.forEach((player) => {
    const option = document.createElement("option");
    option.value = player.id;
    option.textContent = `${player.name} (${player.status})`;
    subSelect.append(option);
  });

  outLabel.append(outSelect);
  subLabel.append(subSelect);
  const assignButton = actionButton("Add sub", () => {
    if (!outSelect.value || !subSelect.value) {
      return;
    }
    round.substitutions.push({
      outPlayerId: outSelect.value,
      subPlayerId: subSelect.value
    });
    persistAndRender();
  });
  assignButton.disabled = playersWithoutSub.length === 0 || substitutes.length === 0;

  wrapper.append(outLabel, subLabel, assignButton);
  return wrapper;
}

function activeRosterPlayers(league) {
  return league.players.filter((player) => player.status === "Active");
}

function subRosterPlayers(league) {
  return league.players.filter((player) => player.status !== "Active");
}

function substitutePlayers(league, round) {
  const usedSubIds = new Set(roundSubstitutions(round).map((substitution) => substitution.subPlayerId));
  return subRosterPlayers(league).filter((player) => !usedSubIds.has(player.id));
}

function roundAvailability(round) {
  if (!round.availability || typeof round.availability !== "object") {
    round.availability = {};
  }
  return round.availability;
}

function availabilityForPlayer(round, playerId) {
  return roundAvailability(round)[playerId] ?? "assumed";
}

function setRoundAvailability(round, playerId, status) {
  roundAvailability(round)[playerId] = status;
  if (status === "confirmed") {
    removeRoundSubstitution(round, playerId, false);
  }
  persistAndRender();
}

function roundOutPlayers(league, round) {
  return activeRosterPlayers(league).filter((player) => availabilityForPlayer(round, player.id) === "out");
}

function roundSubstitutions(round) {
  if (!Array.isArray(round.substitutions)) {
    round.substitutions = [];
  }
  return round.substitutions;
}

function roundPlayingPlayers(league, round) {
  const substitutions = roundSubstitutions(round);
  const outIds = new Set([
    ...roundOutPlayers(league, round).map((player) => player.id),
    ...substitutions.map((substitution) => substitution.outPlayerId)
  ]);
  const subIds = new Set(substitutions.map((substitution) => substitution.subPlayerId));
  const players = activeRosterPlayers(league).filter((player) => !outIds.has(player.id));

  subIds.forEach((id) => {
    const player = playerById(league, id);
    if (player && !players.some((existing) => existing.id === id)) {
      players.push(player);
    }
  });

  return players;
}

function removeRoundSubstitution(round, outPlayerId, shouldRender = true) {
  round.substitutions = roundSubstitutions(round).filter((substitution) => substitution.outPlayerId !== outPlayerId);
  if (shouldRender) {
    persistAndRender();
  }
}

function playerById(league, playerId) {
  return league.players.find((player) => player.id === playerId);
}

function contactLinks(player) {
  const links = document.createElement("div");
  links.className = "contact-links";

  if (player.email) {
    const email = document.createElement("a");
    email.href = `mailto:${player.email}`;
    email.textContent = "Email";
    links.append(email);
  }

  if (player.phone) {
    const phone = document.createElement("a");
    phone.href = `tel:${player.phone}`;
    phone.textContent = "Call";
    links.append(phone);
  }

  if (!links.children.length) {
    const empty = document.createElement("span");
    empty.className = "muted";
    empty.textContent = "No contact";
    links.append(empty);
  }

  return links;
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
