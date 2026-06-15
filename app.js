const STORAGE_KEY = "fairway-league-hub";
const AUTH_KEY = "fairway-league-hub-auth";
const MANAGER_PASSCODE_KEY = "fairway-league-hub-manager-passcode";
const PAYMENT_PORTAL_URL = "https://secure.east.prophetservices.com/Oaks_CandiaWoodsWS3/(S(sza4uk4dmpmjyadqdh1bkdlh))/";
const DEFAULT_PAYMENT_LINKS = `Oaks/CandiaWoods Payment Portal | ${PAYMENT_PORTAL_URL}`;

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
      paymentLinks: DEFAULT_PAYMENT_LINKS,
      scheduleCalendar: defaultScheduleCalendarRows(),
      messages: [
        {
          id: "message-1",
          authorName: "League Manager",
          authorEmail: "",
          text: "Welcome to the league portal. Use this message board for league updates and sub coordination.",
          createdAt: "2026-05-28T12:00:00.000Z"
        }
      ],
      directMessages: [],
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
          teeInterval: 10,
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
          ],
          teeSheet: {
            times: {},
            extra: []
          }
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
let auth = loadAuth();
let activeHubPage = "overview";

const elements = {
  activeLeagueSubtitle: document.querySelector("#active-league-subtitle"),
  activeLeagueTitle: document.querySelector("#active-league-title"),
  authMessage: document.querySelector("#auth-message"),
  authPanel: document.querySelector("#auth-panel"),
  authStatus: document.querySelector("#auth-status"),
  deleteLeague: document.querySelector("#delete-league"),
  directMessageForm: document.querySelector("#direct-message-form"),
  directMessageList: document.querySelector("#direct-message-list"),
  directRecipientSelect: document.querySelector("#direct-recipient-select"),
  emptyState: document.querySelector("#empty-state"),
  leagueCount: document.querySelector("#league-count"),
  hubNav: document.querySelector("#hub-nav"),
  leagueInfoDisplay: document.querySelector("#league-info-display"),
  leagueInfoForm: document.querySelector("#league-info-form"),
  leagueForm: document.querySelector("#league-form"),
  leagueList: document.querySelector("#league-list"),
  leagueWorkspace: document.querySelector("#league-workspace"),
  logoutButton: document.querySelector("#logout-button"),
  managerLoginForm: document.querySelector("#manager-login-form"),
  managerLoginHelp: document.querySelector("#manager-login-help"),
  memberLoginForm: document.querySelector("#member-login-form"),
  messageForm: document.querySelector("#message-form"),
  messageList: document.querySelector("#message-list"),
  metricCardTemplate: document.querySelector("#metric-card-template"),
  metrics: document.querySelector("#metrics"),
  paymentLinksDisplay: document.querySelector("#payment-link-list"),
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
  scheduleCalendarTable: document.querySelector("#schedule-calendar-table"),
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
elements.leagueInfoForm.addEventListener("submit", saveLeagueInfo);
elements.playerForm.addEventListener("submit", addPlayer);
elements.rosterImportForm.addEventListener("submit", importRoster);
elements.roundForm?.addEventListener("submit", addRound);
elements.teamForm.addEventListener("submit", addTeam);
document.querySelector("#add-schedule-row").addEventListener("click", addScheduleCalendarRow);
elements.memberLoginForm.addEventListener("submit", loginMember);
elements.managerLoginForm.addEventListener("submit", loginManager);
elements.messageForm.addEventListener("submit", addMessage);
elements.directMessageForm.addEventListener("submit", addDirectMessage);
elements.logoutButton.addEventListener("click", logout);
elements.deleteLeague.addEventListener("click", deleteActiveLeague);
elements.hubNav.addEventListener("click", changeHubPage);

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

function loadAuth() {
  try {
    return JSON.parse(window.localStorage.getItem(AUTH_KEY)) || null;
  } catch {
    return null;
  }
}

function saveAuth() {
  if (auth) {
    window.localStorage.setItem(AUTH_KEY, JSON.stringify(auth));
  } else {
    window.localStorage.removeItem(AUTH_KEY);
  }
}

function normalizeState(candidate) {
  const leagues = candidate.leagues.map((league) => ({
    ...league,
    bio: league.bio || "",
    bylaws: league.bylaws || "",
    generalInfo: league.generalInfo || "",
    paymentLinks: normalizePaymentLinksForLeague(league.paymentLinks),
    scheduleCalendar: normalizeScheduleCalendar(league.scheduleCalendar),
    messages: Array.isArray(league.messages) ? league.messages : [],
    directMessages: Array.isArray(league.directMessages) ? league.directMessages : [],
    players: Array.isArray(league.players) ? league.players.map((player) => normalizePlayer(league, player)) : [],
    rounds: Array.isArray(league.rounds)
      ? league.rounds.map((round) => ({
          ...round,
          teeInterval: Number(round.teeInterval || 10),
          teeSheet: normalizeTeeSheet(round.teeSheet),
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

  const normalized = {
    selectedLeagueId: leagues.some((league) => league.id === candidate.selectedLeagueId)
      ? candidate.selectedLeagueId
      : leagues[0]?.id ?? null,
    leagues
  };

  normalized.leagues.forEach((league) => syncCalendarRounds(league));
  return normalized;
}

function normalizePlayer(league, player) {
  return {
    ...player,
    paid: isPaidValue(player.paid) ? Number(league.dues || 0) : 0
  };
}

function normalizeTeeSheet(teeSheet) {
  return {
    times: teeSheet && typeof teeSheet.times === "object" ? teeSheet.times : {},
    extra: Array.isArray(teeSheet?.extra)
      ? teeSheet.extra.map((row) => ({
          id: row.id || uid("tee-extra"),
          time: row.time || "",
          label: row.label || "Open tee time"
        }))
      : []
  };
}

function normalizeScheduleCalendar(rows) {
  return (Array.isArray(rows) ? rows : defaultScheduleCalendarRows()).map((row) => ({
    id: row.id || uid("schedule-row"),
    date: row.date || "",
    week: row.week || "",
    notes: row.notes || "",
    teeTime: row.teeTime || (isPlayableScheduleRow(row) ? "17:00" : ""),
    spots: row.spots === "" ? "" : Number(row.spots ?? (isPlayableScheduleRow(row) ? 5 : 0)),
    teeInterval: row.teeInterval === "" ? "" : Number(row.teeInterval || 10)
  }));
}

function defaultScheduleCalendarRows() {
  return [
    ["2026-05-13", "1st Half - Week 1", "6 holes", "17:00", 5, 10],
    ["2026-05-20", "1st Half - Week 2", "6 holes", "17:00", 5, 10],
    ["2026-05-27", "1st Half - Week 3", "", "17:00", 5, 10],
    ["2026-06-03", "1st Half - Week 4", "", "17:00", 5, 10],
    ["2026-06-10", "1st Half - Week 5", "", "17:00", 5, 10],
    ["2026-06-17", "1st Half - Rain Date", "", "17:00", 5, 10],
    ["2026-06-24", "2nd Half - Week 1", "", "17:00", 5, 10],
    ["2026-07-01", "OFF - Holiday 4th of July Week", "Holiday", "", 0, 10],
    ["2026-07-08", "2nd Half - Week 2", "", "17:00", 5, 10],
    ["2026-07-15", "2nd Half - Week 3", "", "17:00", 5, 10],
    ["2026-07-22", "2nd Half - Week 4", "6 holes", "17:00", 5, 10],
    ["2026-07-29", "2nd Half - Week 5", "6 holes", "17:00", 5, 10],
    ["2026-08-05", "2nd Half - Rain Date", "", "17:00", 5, 10]
  ].map(([date, week, notes, teeTime, spots, teeInterval]) => ({
    id: uid("schedule-row"),
    date,
    week,
    notes,
    teeTime,
    spots,
    teeInterval
  }));
}

function normalizePaymentLinksForLeague(value) {
  const paymentLinks = String(value || "").trim();
  const legacyDefaults = [
    "League Venmo | https://venmo.com/\nPayPal | https://paypal.com/",
    "Venmo League Dues | https://venmo.com/\nPayPal League Dues | paypal.com"
  ];

  if (!paymentLinks || legacyDefaults.includes(paymentLinks)) {
    return DEFAULT_PAYMENT_LINKS;
  }

  return paymentLinks;
}

function saveState() {
  state.leagues.forEach((league) => syncCalendarRounds(league));
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

function formatMessageDate(value) {
  if (!value) {
    return "";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}

function createLeague(event) {
  event.preventDefault();
  if (!isManager()) {
    return;
  }
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
    paymentLinks: DEFAULT_PAYMENT_LINKS,
    scheduleCalendar: defaultScheduleCalendarRows(),
    messages: [],
    directMessages: [],
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
  if (!isManager()) {
    return;
  }
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
  if (!league || !isManager()) {
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
  if (!league || !isManager()) {
    return;
  }

  league[event.target.name] = event.target.value;
  persistAndRender();
}

function saveLeagueInfo(event) {
  event.preventDefault();
  const league = activeLeague();
  if (!league || !isManager()) {
    return;
  }

  const data = Object.fromEntries(new FormData(event.currentTarget));
  league.bio = data.bio || "";
  league.bylaws = data.bylaws || "";
  league.generalInfo = data.generalInfo || "";
  league.paymentLinks = data.paymentLinks || "";
  persistAndRender();
}

function loginMember(event) {
  event.preventDefault();
  const league = activeLeague();
  const email = event.currentTarget.email.value.trim().toLowerCase();
  const player = league?.players.find((item) => item.email.toLowerCase() === email);

  if (!league || !player) {
    elements.authMessage.textContent = "That email is not on this league roster.";
    return;
  }

  auth = {
    mode: "member",
    leagueId: league.id,
    playerId: player.id,
    email: player.email
  };
  saveAuth();
  event.currentTarget.reset();
  elements.authMessage.textContent = "";
  render();
}

function loginManager(event) {
  event.preventDefault();
  const passcode = event.currentTarget.passcode.value;
  const savedPasscode = window.localStorage.getItem(MANAGER_PASSCODE_KEY);

  if (!savedPasscode) {
    window.localStorage.setItem(MANAGER_PASSCODE_KEY, passcode);
  } else if (passcode !== savedPasscode) {
    elements.authMessage.textContent = "Manager passcode is incorrect.";
    return;
  }

  auth = {
    mode: "manager"
  };
  saveAuth();
  event.currentTarget.reset();
  elements.authMessage.textContent = "";
  render();
}

function logout() {
  auth = null;
  saveAuth();
  activeHubPage = "overview";
  render();
}

function changeHubPage(event) {
  const button = event.target.closest("[data-hub-page]");
  if (!button || button.hidden) {
    return;
  }

  activeHubPage = button.dataset.hubPage;
  renderHubPages();
}

function isManager() {
  return auth?.mode === "manager";
}

function currentMember(league = activeLeague()) {
  if (auth?.mode !== "member" || !league || auth.leagueId !== league.id) {
    return null;
  }

  return league.players.find((player) => player.id === auth.playerId && player.email === auth.email) ?? null;
}

function hasLeagueAccess(league = activeLeague()) {
  return Boolean(league && (isManager() || currentMember(league)));
}

function addPlayer(event) {
  event.preventDefault();
  if (!isManager()) {
    return;
  }
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
  if (!isManager()) {
    return;
  }
  const form = event.currentTarget;
  const league = activeLeague();
  const file = form.rosterFile.files[0];

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

    form.reset();
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

function syncCalendarRounds(league) {
  if (!league) {
    return;
  }

  const playableRows = league.scheduleCalendar.filter(isPlayableScheduleRow);
  const playableIds = new Set(playableRows.map((row) => row.id));
  league.rounds = league.rounds.filter((round) => !round.generatedFromCalendar || playableIds.has(round.calendarRowId));

  playableRows.forEach((row) => {
    let round = league.rounds.find((item) => item.generatedFromCalendar && item.calendarRowId === row.id);
    if (!round) {
      round = {
        id: uid("round"),
        generatedFromCalendar: true,
        calendarRowId: row.id,
        availability: {},
        substitutions: [],
        teeSheet: {
          times: {},
          extra: []
        }
      };
      league.rounds.push(round);
    }

    round.generatedFromCalendar = true;
    round.calendarRowId = row.id;
    round.course = row.week || "League Round";
    round.date = row.date;
    round.teeTime = row.teeTime || "17:00";
    round.spots = Number(row.spots || 5);
    round.teeInterval = Number(row.teeInterval || 10);
    round.notes = row.notes || "";
    round.availability = round.availability && typeof round.availability === "object" ? round.availability : {};
    round.substitutions = Array.isArray(round.substitutions) ? round.substitutions : [];
    round.teeSheet = normalizeTeeSheet(round.teeSheet);
  });
}

function isPlayableScheduleRow(row) {
  const text = `${row?.week || ""} ${row?.notes || ""}`.toLowerCase();
  return Boolean(row?.date) && !text.includes("off") && !text.includes("holiday");
}

function addRound(event) {
  event.preventDefault();
  if (!isManager()) {
    return;
  }
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
    teeInterval: Number(data.teeInterval) || 10,
    notes: data.notes.trim(),
    availability: {},
    substitutions: [],
    teeSheet: {
      times: {},
      extra: []
    }
  });

  event.currentTarget.reset();
  event.currentTarget.spots.value = 5;
  event.currentTarget.teeInterval.value = 10;
  persistAndRender();
}

function addMessage(event) {
  event.preventDefault();
  const league = activeLeague();
  const member = currentMember(league);

  if (!league || (!member && !isManager())) {
    return;
  }

  const data = Object.fromEntries(new FormData(event.currentTarget));
  const text = data.message.trim();
  if (!text) {
    return;
  }

  league.messages.unshift({
    id: uid("message"),
    authorName: member?.name ?? "League Manager",
    authorEmail: member?.email ?? "",
    text,
    createdAt: new Date().toISOString()
  });

  event.currentTarget.reset();
  persistAndRender();
}

function addDirectMessage(event) {
  event.preventDefault();
  const league = activeLeague();
  const member = currentMember(league);

  if (!league || (!member && !isManager())) {
    return;
  }

  const data = Object.fromEntries(new FormData(event.currentTarget));
  const recipient = playerById(league, data.recipientId);
  const text = data.message.trim();

  if (!recipient || !text) {
    return;
  }

  league.directMessages.unshift({
    id: uid("dm"),
    fromPlayerId: member?.id ?? "",
    fromName: member?.name ?? "League Manager",
    toPlayerId: recipient.id,
    toName: recipient.name,
    text,
    createdAt: new Date().toISOString()
  });

  event.currentTarget.reset();
  persistAndRender();
}

function deleteActiveLeague() {
  const league = activeLeague();
  if (!league || !isManager()) {
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
  renderAccessControls(league);

  if (!league) {
    elements.emptyState.hidden = false;
    elements.leagueWorkspace.hidden = true;
    elements.authPanel.hidden = isManager();
    elements.deleteLeague.hidden = true;
    elements.activeLeagueTitle.textContent = "Create a league to get started";
    elements.activeLeagueSubtitle.textContent = isManager()
      ? "Track rosters, dues, schedule, tee times, and available spots in one place."
      : "Unlock manager mode to create the first league.";
    return;
  }

  if (!hasLeagueAccess(league)) {
    elements.emptyState.hidden = true;
    elements.authPanel.hidden = false;
    elements.leagueWorkspace.hidden = true;
    elements.deleteLeague.hidden = true;
    elements.activeLeagueTitle.textContent = league.name;
    elements.activeLeagueSubtitle.textContent = "Sign in with a roster email to view the portal, or unlock manager mode to edit league data.";
    return;
  }

  elements.emptyState.hidden = true;
  elements.authPanel.hidden = true;
  elements.leagueWorkspace.hidden = false;
  elements.deleteLeague.hidden = !isManager();
  elements.activeLeagueTitle.textContent = league.name;
  elements.activeLeagueSubtitle.textContent = `${league.season} - ${league.players.length} players - ${league.teams.length} teams - ${league.rounds.length} scheduled rounds`;

  elements.settingsForm.name.value = league.name;
  elements.settingsForm.season.value = league.season;
  elements.settingsForm.rosterLimit.value = league.rosterLimit;
  elements.settingsForm.dues.value = league.dues;
  elements.leagueInfoForm.bio.value = league.bio;
  elements.leagueInfoForm.bylaws.value = league.bylaws;
  elements.leagueInfoForm.generalInfo.value = league.generalInfo;
  elements.leagueInfoForm.paymentLinks.value = league.paymentLinks;

  syncCalendarRounds(league);
  renderMetrics(league);
  renderLeagueInfoDisplay(league);
  renderPaymentLinks(league);
  renderPublicRosters(league);
  renderMessages(league);
  renderDirectMessages(league);
  renderPlayers(league);
  renderTeams(league);
  renderScheduleCalendar(league);
  renderRounds(league);
  renderHubPages();
}

function renderAccessControls(league) {
  const manager = isManager();
  const member = currentMember(league);
  const hasAccess = Boolean(manager || member);

  document.querySelectorAll(".manager-only").forEach((element) => {
    element.hidden = !manager;
  });

  elements.authStatus.hidden = !hasAccess;
  elements.logoutButton.hidden = !hasAccess;
  elements.managerLoginHelp.textContent = window.localStorage.getItem(MANAGER_PASSCODE_KEY)
    ? "Enter the manager passcode for full editing access."
    : "Set a manager passcode for full editing access on this browser.";

  if (manager) {
    elements.authStatus.textContent = "Signed in as League Manager";
  } else if (member) {
    elements.authStatus.textContent = `Signed in as ${member.name}`;
  }
}

function renderHubPages() {
  if (!isManager() && activeHubPage === "admin") {
    activeHubPage = "overview";
  }

  elements.hubNav.querySelectorAll("[data-hub-page]").forEach((button) => {
    const page = button.dataset.hubPage;
    button.hidden = page === "admin" && !isManager();
    button.classList.toggle("active", page === activeHubPage);
  });

  document.querySelectorAll(".hub-page").forEach((section) => {
    const page = section.dataset.hubPage;
    section.hidden = page !== activeHubPage || (page === "admin" && !isManager());
  });
}

function renderLeagueInfoDisplay(league) {
  const items = [
    ["League bio", league.bio],
    ["By-laws", league.bylaws],
    ["General information", league.generalInfo]
  ];

  elements.leagueInfoDisplay.replaceChildren();
  items.forEach(([label, value]) => {
    const article = document.createElement("article");
    article.className = "info-card";
    article.innerHTML = `<h3>${escapeHtml(label)}</h3><p>${escapeHtml(value || "No information posted yet.")}</p>`;
    elements.leagueInfoDisplay.append(article);
  });
}

function renderPaymentLinks(league) {
  const links = parsePaymentLinks(league.paymentLinks);
  const member = currentMember(league);
  const paid = member ? amountDue(league, member) <= 0 : false;

  elements.paymentLinksDisplay.replaceChildren();

  const summary = document.createElement("article");
  summary.className = "payment-card";
  summary.innerHTML = `
    <div>
      <h3>${member ? `${escapeHtml(member.name)} payment status` : "League payment status"}</h3>
      <p>${member ? (paid ? "You are marked paid in full." : `You are marked unpaid for ${money(league.dues)} league dues.`) : "Use the links below to pay league dues online."}</p>
    </div>
  `;
  elements.paymentLinksDisplay.append(summary);

  if (!links.length) {
    const empty = document.createElement("p");
    empty.className = "empty-copy";
    empty.textContent = "No online payment links have been posted yet.";
    elements.paymentLinksDisplay.append(empty);
    return;
  }

  const linkWrap = document.createElement("div");
  linkWrap.className = "payment-links";
  links.forEach((link) => {
    const anchor = document.createElement("a");
    anchor.href = link.url;
    anchor.target = "_blank";
    anchor.rel = "noopener noreferrer";
    anchor.textContent = link.label;
    linkWrap.append(anchor);
  });
  elements.paymentLinksDisplay.append(linkWrap);
}

function parsePaymentLinks(value) {
  return String(value || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [labelPart, urlPart] = line.includes("|") ? line.split("|").map((part) => part.trim()) : ["Pay online", line];
      const url = normalizePaymentUrl(urlPart || labelPart);
      return url ? { label: labelPart || "Pay online", url } : null;
    })
    .filter(Boolean);
}

function normalizePaymentUrl(value) {
  const raw = String(value || "").trim();
  if (!raw) {
    return "";
  }

  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    const url = new URL(withProtocol);
    return url.href;
  } catch {
    return "";
  }
}

function renderMessages(league) {
  elements.messageList.replaceChildren();

  if (!league.messages.length) {
    const empty = document.createElement("p");
    empty.className = "empty-copy";
    empty.textContent = "No messages yet.";
    elements.messageList.append(empty);
    return;
  }

  league.messages.forEach((message) => {
    const article = document.createElement("article");
    article.className = "message-card";
    article.innerHTML = `
      <div>
        <strong>${escapeHtml(message.authorName)}</strong>
        <span class="muted">${formatMessageDate(message.createdAt)}</span>
      </div>
      <p>${escapeHtml(message.text)}</p>
    `;
    elements.messageList.append(article);
  });
}

function renderScheduleCalendar(league) {
  elements.scheduleCalendarTable.replaceChildren();

  const heading = document.createElement("div");
  heading.className = "schedule-calendar-row schedule-calendar-heading";
  heading.innerHTML = "<span>Date</span><span>Week #</span><span>Start</span><span>Groups</span><span>Interval</span><span>Notes</span><span>Actions</span>";
  elements.scheduleCalendarTable.append(heading);

  league.scheduleCalendar.forEach((row) => {
    const rowElement = document.createElement("div");
    rowElement.className = `schedule-calendar-row${scheduleRowClass(row)}`;

    const dateCell = document.createElement("div");
    const weekCell = document.createElement("div");
    const startCell = document.createElement("div");
    const groupsCell = document.createElement("div");
    const intervalCell = document.createElement("div");
    const notesCell = document.createElement("div");
    const actionCell = document.createElement("div");

    if (isManager()) {
      dateCell.append(calendarInput("date", row.date, (value) => updateScheduleCalendarRow(row.id, "date", value)));
      weekCell.append(calendarInput("text", row.week, (value) => updateScheduleCalendarRow(row.id, "week", value)));
      startCell.append(calendarInput("time", row.teeTime, (value) => updateScheduleCalendarRow(row.id, "teeTime", value)));
      groupsCell.append(calendarInput("number", row.spots, (value) => updateScheduleCalendarRow(row.id, "spots", value)));
      intervalCell.append(calendarInput("number", row.teeInterval, (value) => updateScheduleCalendarRow(row.id, "teeInterval", value)));
      notesCell.append(calendarInput("text", row.notes, (value) => updateScheduleCalendarRow(row.id, "notes", value)));
      actionCell.append(actionButton("Remove", () => removeScheduleCalendarRow(row.id), "danger ghost"));
    } else {
      dateCell.textContent = formatDate(row.date);
      weekCell.textContent = row.week;
      startCell.textContent = isPlayableScheduleRow(row) ? formatTime(row.teeTime) : "";
      groupsCell.textContent = isPlayableScheduleRow(row) ? row.spots : "";
      intervalCell.textContent = isPlayableScheduleRow(row) ? `${row.teeInterval} min` : "";
      notesCell.textContent = row.notes || "";
      actionCell.textContent = "";
    }

    rowElement.append(dateCell, weekCell, startCell, groupsCell, intervalCell, notesCell, actionCell);
    elements.scheduleCalendarTable.append(rowElement);
  });
}

function calendarInput(type, value, onChange) {
  const input = document.createElement("input");
  input.type = type;
  input.value = value || "";
  if (type === "number") {
    input.min = "0";
  }
  input.addEventListener("focus", () => input.select());
  input.addEventListener("click", () => input.select());
  input.addEventListener("change", () => onChange(input.value));
  return input;
}

function scheduleRowClass(row) {
  const text = `${row.week} ${row.notes}`.toLowerCase();
  if (text.includes("holiday") || text.includes("off")) {
    return " holiday";
  }
  if (text.includes("rain")) {
    return " rain";
  }
  if (text.includes("2nd half")) {
    return " second-half";
  }
  if (text.includes("6 holes")) {
    return " short-round";
  }
  return " first-half";
}

function addScheduleCalendarRow() {
  const league = activeLeague();
  if (!league || !isManager()) {
    return;
  }

  const nextDate = nextScheduleDate(league.scheduleCalendar);
  league.scheduleCalendar.push({
    id: uid("schedule-row"),
    date: nextDate,
    week: "New schedule row",
    teeTime: "17:00",
    spots: 5,
    teeInterval: 10,
    notes: ""
  });
  persistAndRender();
}

function nextScheduleDate(rows) {
  const dates = rows
    .map((row) => row.date)
    .filter(Boolean)
    .sort();
  const lastDate = dates.at(-1);
  const date = lastDate ? new Date(`${lastDate}T12:00:00`) : new Date();
  date.setDate(date.getDate() + 7);
  return date.toISOString().slice(0, 10);
}

function updateScheduleCalendarRow(rowId, field, value) {
  const league = activeLeague();
  const row = league?.scheduleCalendar.find((item) => item.id === rowId);
  if (!row || !isManager()) {
    return;
  }

  row[field] = field === "spots" || field === "teeInterval" ? Number(value || 0) : value;
  syncCalendarRounds(league);
  persistAndRender();
}

function removeScheduleCalendarRow(rowId) {
  const league = activeLeague();
  if (!league || !isManager()) {
    return;
  }

  league.scheduleCalendar = league.scheduleCalendar.filter((row) => row.id !== rowId);
  syncCalendarRounds(league);
  persistAndRender();
}

function renderDirectMessages(league) {
  const member = currentMember(league);
  const visibleMessages = isManager()
    ? league.directMessages
    : league.directMessages.filter((message) => message.fromPlayerId === member?.id || message.toPlayerId === member?.id);

  renderDirectRecipientOptions(league, member);
  elements.directMessageList.replaceChildren();

  if (!visibleMessages.length) {
    const empty = document.createElement("p");
    empty.className = "empty-copy";
    empty.textContent = isManager() ? "No direct messages yet." : "No direct messages for you yet.";
    elements.directMessageList.append(empty);
    return;
  }

  visibleMessages.forEach((message) => {
    const article = document.createElement("article");
    article.className = "message-card";
    article.innerHTML = `
      <div>
        <strong>${escapeHtml(message.fromName)} to ${escapeHtml(message.toName)}</strong>
        <span class="muted">${formatMessageDate(message.createdAt)}</span>
      </div>
      <p>${escapeHtml(message.text)}</p>
    `;
    elements.directMessageList.append(article);
  });
}

function renderDirectRecipientOptions(league, member) {
  elements.directRecipientSelect.replaceChildren();

  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = "Choose league member";
  elements.directRecipientSelect.append(placeholder);

  league.players
    .filter((player) => isManager() || player.id !== member?.id)
    .forEach((player) => {
      const option = document.createElement("option");
      option.value = player.id;
      option.textContent = `${player.name} (${player.status})`;
      elements.directRecipientSelect.append(option);
    });
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
        <div>Use portal messages</div>
        <div class="muted">Email and phone hidden</div>
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
  syncCalendarRounds(league);
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
          <span>${round.spots} tee groups</span>
          <span>${round.teeInterval} minute intervals</span>
          <span>${confirmedCount} confirmed</span>
          <span>${outPlayers.length} need subs</span>
          <span>${playingPlayers.length} expected players</span>
          <span>${substitutions.length} substitutions</span>
        </div>
        <p class="muted">Roster default: everyone is playing. Use "Can't play this week" only when a player is out for this round.</p>
        <p class="muted">${escapeHtml(round.notes || "No notes")}</p>
      `;

      const teeSheet = roundTeeSheetTable(league, round);

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
        empty.textContent = "Add active roster players so they are automatically included in this round.";
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
        empty.textContent = "No one has marked themselves out for this date.";
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
          if (isManager()) {
            row.append(actionButton("Remove", () => removeRoundSubstitution(round, substitution.outPlayerId), "danger ghost"));
          }
          substitutionList.append(row);
        });
      } else {
        const empty = document.createElement("p");
        empty.className = "empty-copy";
        empty.textContent = "Everyone on the active roster is expected to play.";
        substitutionList.append(empty);
      }

      card.append(teeSheet);
      card.append(availabilityBoard);
      card.append(openRequests);
      card.append(substitutionList);
      if (isManager()) {
        card.append(roundSubstitutionControls(league, round));
        if (round.generatedFromCalendar) {
          card.append(actionButton("Remove calendar row", () => removeScheduleCalendarRow(round.calendarRowId), "danger ghost"));
        } else {
          card.append(actionButton("Remove round", () => {
            league.rounds = league.rounds.filter((item) => item.id !== round.id);
            persistAndRender();
          }, "danger ghost"));
        }
      }
      elements.roundList.append(card);
    });
}

function roundAvailabilityRow(round, player, canEdit) {
  const row = document.createElement("div");
  row.className = "availability-row";
  const status = availabilityForPlayer(round, player.id);
  const statusText = status === "confirmed" ? "Playing" : status === "out" ? "Cannot play this week" : "Playing by default";

  const details = document.createElement("div");
  details.innerHTML = `<strong>${escapeHtml(player.name)}</strong><span class="status-pill ${status}">${statusText}</span>`;

  const actions = document.createElement("div");
  actions.className = "availability-actions";
  if (canEdit) {
    const confirmButton = actionButton("Playing", () => setRoundAvailability(round, player.id, "confirmed"));
    const outButton = actionButton("Can't play this week", () => setRoundAvailability(round, player.id, "out"), "danger ghost");
    confirmButton.disabled = status === "confirmed";
    outButton.disabled = status === "out";
    actions.append(confirmButton, outButton);
  } else {
    const locked = document.createElement("span");
    locked.className = "muted";
    locked.textContent = "Roster-only update";
    actions.append(locked);
  }

  row.append(details, actions);
  return row;
}

function renderRoundAvailabilityGroups(league, round) {
  const member = currentMember(league);
  return scrambleTeamGroups(league).map((group) => {
    const section = document.createElement("section");
    section.className = "team-availability-group";

    const title = document.createElement("h5");
    title.textContent = group.name;
    section.append(title);

    group.players.forEach((player) => {
      section.append(roundAvailabilityRow(round, player, isManager() || member?.id === player.id));
    });

    return section;
  });
}

function roundTeeSheetTable(league, round) {
  const wrapper = document.createElement("div");
  wrapper.className = "tee-sheet";

  const header = document.createElement("div");
  header.className = "tee-sheet-header";
  header.innerHTML = `
    <div>
      <h4>Tee sheet</h4>
      <p class="muted">Times start at ${formatTime(round.teeTime)} and advance every ${round.teeInterval} minutes unless a manager edits them.</p>
    </div>
  `;
  wrapper.append(header);

  const rows = teeSheetRows(league, round);
  const table = document.createElement("div");
  table.className = "tee-sheet-table";

  const heading = document.createElement("div");
  heading.className = "tee-sheet-row tee-sheet-row-heading";
  heading.innerHTML = "<span>Time</span><span>Group</span><span>Players</span><span>Actions</span>";
  table.append(heading);

  rows.forEach((row) => {
    const rowElement = document.createElement("div");
    rowElement.className = "tee-sheet-row";

    const timeCell = document.createElement("div");
    if (isManager()) {
      const input = document.createElement("input");
      input.type = "time";
      input.value = row.time;
      input.addEventListener("change", () => setTeeSheetTime(round, row.id, input.value));
      timeCell.append(input);
    } else {
      timeCell.innerHTML = `<strong>${formatTime(row.time)}</strong>`;
    }

    const groupCell = document.createElement("div");
    if (isManager() && row.extra) {
      const input = document.createElement("input");
      input.type = "text";
      input.value = row.label;
      input.addEventListener("change", () => setExtraTeeSheetLabel(round, row.id, input.value));
      groupCell.append(input);
    } else {
      groupCell.innerHTML = `<strong>${escapeHtml(row.label)}</strong>`;
    }

    const playerCell = document.createElement("div");
    playerCell.className = "chip-row";
    if (row.players.length) {
      row.players.forEach((player) => {
        const chip = document.createElement("span");
        chip.className = "chip";
        chip.textContent = player.name;
        playerCell.append(chip);
      });
    } else {
      const empty = document.createElement("span");
      empty.className = "muted";
      empty.textContent = row.extra ? "Open starting time." : "No players assigned.";
      playerCell.append(empty);
    }

    const actionCell = document.createElement("div");
    if (isManager() && row.extra) {
      actionCell.append(actionButton("Remove", () => removeExtraTeeTime(round, row.id), "danger ghost"));
    } else {
      actionCell.append(document.createTextNode(row.extra ? "" : "Set from roster"));
    }

    rowElement.append(timeCell, groupCell, playerCell, actionCell);
    table.append(rowElement);
  });

  wrapper.append(table);

  if (isManager()) {
    const controls = document.createElement("div");
    controls.className = "tee-sheet-controls";
    controls.append(actionButton("Add tee time", () => addExtraTeeTime(league, round)));
    wrapper.append(controls);
  }

  return wrapper;
}

function teeSheetRows(league, round) {
  const sheet = roundTeeSheet(round);
  const interval = Number(round.teeInterval || 10);
  const generatedRows = roundTeeSheetGroups(league, round).map((group, index) => ({
    id: group.id,
    label: group.name,
    players: group.players,
    time: sheet.times[group.id] || addMinutesToTime(round.teeTime, index * interval),
    extra: false
  }));

  const extraRows = sheet.extra.map((row, index) => ({
    id: row.id,
    label: row.label || "Open tee time",
    players: [],
    time: row.time || addMinutesToTime(round.teeTime, (generatedRows.length + index) * interval),
    extra: true
  }));

  return [...generatedRows, ...extraRows];
}

function roundTeeSheetGroups(league, round) {
  const substitutions = roundSubstitutions(round);
  const outIds = new Set(roundOutPlayers(league, round).map((player) => player.id));
  const subByOut = new Map(substitutions.map((substitution) => [substitution.outPlayerId, playerById(league, substitution.subPlayerId)]));

  return scrambleTeamGroups(league).map((group) => {
    const players = [];
    group.players.forEach((player) => {
      if (outIds.has(player.id)) {
        const sub = subByOut.get(player.id);
        if (sub) {
          players.push(sub);
        }
        return;
      }
      players.push(player);
    });
    return {
      id: group.id,
      name: group.name,
      players
    };
  });
}

function roundTeeSheet(round) {
  if (!round.teeSheet || typeof round.teeSheet !== "object") {
    round.teeSheet = normalizeTeeSheet();
  }
  round.teeSheet.times = round.teeSheet.times && typeof round.teeSheet.times === "object" ? round.teeSheet.times : {};
  round.teeSheet.extra = Array.isArray(round.teeSheet.extra) ? round.teeSheet.extra : [];
  return round.teeSheet;
}

function setTeeSheetTime(round, rowId, time) {
  roundTeeSheet(round).times[rowId] = time;
  persistAndRender();
}

function setExtraTeeSheetLabel(round, rowId, label) {
  const row = roundTeeSheet(round).extra.find((item) => item.id === rowId);
  if (row) {
    row.label = label.trim() || "Open tee time";
    persistAndRender();
  }
}

function addExtraTeeTime(league, round) {
  const rows = teeSheetRows(league, round);
  const lastRow = rows[rows.length - 1];
  const time = addMinutesToTime(lastRow?.time || round.teeTime, Number(round.teeInterval || 10));
  roundTeeSheet(round).extra.push({
    id: uid("tee-extra"),
    time,
    label: "Open tee time"
  });
  persistAndRender();
}

function removeExtraTeeTime(round, rowId) {
  const sheet = roundTeeSheet(round);
  sheet.extra = sheet.extra.filter((row) => row.id !== rowId);
  delete sheet.times[rowId];
  persistAndRender();
}

function addMinutesToTime(value, minutes) {
  const [hour = "0", minute = "0"] = String(value || "08:00").split(":");
  const date = new Date();
  date.setHours(Number(hour), Number(minute) + minutes, 0, 0);
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
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
  const member = currentMember();

  if (member?.id === player.id) {
    const current = document.createElement("span");
    current.className = "muted";
    current.textContent = "You";
    links.append(current);
    return links;
  }

  const button = document.createElement("button");
  button.type = "button";
  button.className = "ghost";
  button.textContent = "Message";
  button.addEventListener("click", () => startDirectMessage(player.id));
  links.append(button);

  return links;
}

function startDirectMessage(playerId) {
  activeHubPage = "messages";
  renderHubPages();
  elements.directRecipientSelect.value = playerId;
  elements.directMessageForm.message.focus();
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
