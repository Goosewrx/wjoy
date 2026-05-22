const STORAGE_KEY = "system-caddie-state-v1";

const statLabels = {
  power: "Power",
  precision: "Precision",
  touch: "Touch",
  focus: "Focus",
  strategy: "Strategy",
  tempo: "Tempo"
};

const questTemplates = [
  {
    id: "daily-putting",
    title: "Daily warm-up",
    description: "Log at least 20 putting reps.",
    rewardXP: 45,
    statRewards: { touch: 8, focus: 3 },
    isComplete: log => log.kind === "practice" && log.sessionType === "putting" && log.reps >= 20
  },
  {
    id: "precision-gate",
    title: "Precision gate",
    description: "Log 15 target-shot attempts with at least 8 successes.",
    rewardXP: 80,
    statRewards: { precision: 12, focus: 4 },
    isComplete: log => log.kind === "practice" && log.skillFocus === "precision" && log.reps >= 15 && log.successes >= 8
  },
  {
    id: "short-game-dungeon",
    title: "Short-game dungeon",
    description: "Log 9 or more short-game attempts.",
    rewardXP: 65,
    statRewards: { touch: 12, strategy: 3 },
    isComplete: log => log.kind === "practice" && log.sessionType === "shortGame" && log.reps >= 9
  },
  {
    id: "no-penalty-round",
    title: "Clean card",
    description: "Submit a round with zero penalty shots.",
    rewardXP: 90,
    statRewards: { strategy: 10, focus: 8 },
    isComplete: log => log.kind === "round" && log.penalties === 0
  },
  {
    id: "boss-gate",
    title: "Boss gate",
    description: "Play at least 9 holes at bogey-or-better pace.",
    rewardXP: 140,
    statRewards: { focus: 12, strategy: 10, precision: 6 },
    isComplete: log => log.kind === "round" && log.holesPlayed >= 9 && log.totalScore <= log.holesPlayed * 5
  }
];

const defaultState = () => ({
  profile: {
    name: "Golfer",
    totalXP: 0,
    stats: { power: 0, precision: 0, touch: 0, focus: 0, strategy: 0, tempo: 0 }
  },
  completedQuests: {},
  activities: [],
  system: {
    title: "Quest log ready",
    message: "Choose a drill or round to start earning XP."
  }
});

let state = loadState();

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : defaultState();
  } catch (error) {
    return defaultState();
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function levelFromXP(totalXP) {
  return Math.floor(totalXP / 100) + 1;
}

function xpIntoLevel(totalXP) {
  return totalXP % 100;
}

function rankFromState() {
  const { totalXP, stats } = state.profile;
  const completedCount = Object.keys(state.completedQuests).length;
  const rounds = state.activities.filter(activity => activity.kind === "round").length;

  if (totalXP >= 1500 && completedCount >= 5 && rounds >= 5 && lowestStat(stats) >= 50) return "S";
  if (totalXP >= 1000 && completedCount >= 4 && rounds >= 3 && lowestStat(stats) >= 35) return "A";
  if (totalXP >= 650 && completedCount >= 3 && rounds >= 2) return "B";
  if (totalXP >= 350 && completedCount >= 2) return "C";
  if (totalXP >= 150 && completedCount >= 1) return "D";
  return "E";
}

function lowestStat(stats) {
  return Math.min(...Object.values(stats));
}

function clampStat(value) {
  return Math.max(0, Math.min(100, value));
}

function addXP(amount) {
  state.profile.totalXP += amount;
}

function addStats(rewards) {
  Object.entries(rewards).forEach(([stat, amount]) => {
    state.profile.stats[stat] = clampStat((state.profile.stats[stat] || 0) + amount);
  });
}

function completeMatchingQuests(log) {
  const newlyCompleted = [];

  questTemplates.forEach(quest => {
    if (!state.completedQuests[quest.id] && quest.isComplete(log)) {
      state.completedQuests[quest.id] = new Date().toISOString();
      addXP(quest.rewardXP);
      addStats(quest.statRewards);
      newlyCompleted.push(quest);
    }
  });

  return newlyCompleted;
}

function handlePracticeSubmit(event) {
  event.preventDefault();
  const data = new FormData(event.currentTarget);
  const reps = Number(data.get("reps"));
  const successes = Number(data.get("successes"));
  const skillFocus = data.get("skillFocus");
  const successRate = reps > 0 ? successes / reps : 0;

  const log = {
    kind: "practice",
    sessionType: data.get("sessionType"),
    skillFocus,
    reps,
    successes,
    notes: data.get("notes"),
    createdAt: new Date().toISOString()
  };

  const baseXP = 20 + Math.round(reps * 1.4) + Math.round(successRate * 30);
  addXP(baseXP);
  addStats({ [skillFocus]: Math.max(3, Math.round(successRate * 10)), tempo: 2 });

  const completed = completeMatchingQuests(log);
  state.activities.unshift({ ...log, xp: baseXP, completedQuestIds: completed.map(quest => quest.id) });
  state.activities = state.activities.slice(0, 12);
  setSystemMessage("Practice logged", systemSummary(baseXP, completed));
  saveState();
  render();
}

function handleRoundSubmit(event) {
  event.preventDefault();
  const data = new FormData(event.currentTarget);
  const log = {
    kind: "round",
    courseName: data.get("courseName"),
    holesPlayed: Number(data.get("holesPlayed")),
    totalScore: Number(data.get("totalScore")),
    fairwaysHit: Number(data.get("fairwaysHit")),
    greensInRegulation: Number(data.get("greensInRegulation")),
    putts: Number(data.get("putts")),
    penalties: Number(data.get("penalties")),
    createdAt: new Date().toISOString()
  };

  const bogeyPace = log.holesPlayed * 5;
  const scoreBonus = Math.max(0, bogeyPace - log.totalScore) * 6;
  const cleanCardBonus = log.penalties === 0 ? 25 : 0;
  const baseXP = (log.holesPlayed * 8) + scoreBonus + cleanCardBonus;

  addXP(baseXP);
  addStats({
    precision: Math.round((log.fairwaysHit + log.greensInRegulation) * 1.5),
    touch: Math.max(0, Math.round((log.holesPlayed * 2 - log.putts) * 1.2)),
    strategy: Math.max(2, 10 - log.penalties * 2),
    focus: log.totalScore <= bogeyPace ? 8 : 3
  });

  const completed = completeMatchingQuests(log);
  state.activities.unshift({ ...log, xp: baseXP, completedQuestIds: completed.map(quest => quest.id) });
  state.activities = state.activities.slice(0, 12);
  setSystemMessage("Round report accepted", systemSummary(baseXP, completed));
  saveState();
  render();
}

function systemSummary(baseXP, completed) {
  if (completed.length === 0) {
    return `You gained ${baseXP} XP. Keep clearing objectives to unlock higher gates.`;
  }

  const questXP = completed.reduce((sum, quest) => sum + quest.rewardXP, 0);
  return `You gained ${baseXP + questXP} XP and cleared ${completed.length} quest${completed.length > 1 ? "s" : ""}: ${completed.map(quest => quest.title).join(", ")}.`;
}

function setSystemMessage(title, message) {
  state.system = { title, message };
}

function render() {
  const level = levelFromXP(state.profile.totalXP);
  const xpProgress = xpIntoLevel(state.profile.totalXP);

  document.getElementById("player-name").textContent = state.profile.name;
  document.getElementById("rank-badge").textContent = `Rank ${rankFromState()}`;
  document.getElementById("level-label").textContent = `Level ${level}`;
  document.getElementById("xp-label").textContent = `${xpProgress} / 100 XP`;
  document.getElementById("level-progress").style.width = `${xpProgress}%`;
  document.getElementById("system-title").textContent = state.system.title;
  document.getElementById("system-message").textContent = state.system.message;

  renderStats();
  renderQuests();
  renderActivities();
}

function renderStats() {
  const statsList = document.getElementById("stats-list");
  statsList.innerHTML = Object.entries(state.profile.stats).map(([key, value]) => `
    <div class="stat-row">
      <strong>${statLabels[key]}</strong>
      <span class="stat-meter"><span style="width: ${value}%"></span></span>
      <span>${value}</span>
    </div>
  `).join("");
}

function renderQuests() {
  const questList = document.getElementById("quest-list");
  questList.innerHTML = questTemplates.map(quest => {
    const complete = Boolean(state.completedQuests[quest.id]);
    return `
      <div class="quest ${complete ? "complete" : ""}">
        <div class="quest-title">
          <strong>${quest.title}</strong>
          <span>${complete ? "Cleared" : `+${quest.rewardXP} XP`}</span>
        </div>
        <small>${quest.description}</small>
      </div>
    `;
  }).join("");
}

function renderActivities() {
  const activityList = document.getElementById("activity-list");
  if (state.activities.length === 0) {
    activityList.innerHTML = "<li>No logs yet. Submit a practice session or round.</li>";
    return;
  }

  activityList.innerHTML = state.activities.map(activity => `
    <li>
      <strong>${activity.kind === "practice" ? practiceTitle(activity) : roundTitle(activity)}</strong>
      <br>
      <small>${new Date(activity.createdAt).toLocaleString()} - Base XP ${activity.xp}${activity.completedQuestIds.length ? " - Quest cleared" : ""}</small>
    </li>
  `).join("");
}

function practiceTitle(activity) {
  return `${titleCase(activity.sessionType)} session: ${activity.successes}/${activity.reps} ${statLabels[activity.skillFocus]} reps`;
}

function roundTitle(activity) {
  return `${activity.courseName}: ${activity.totalScore} over ${activity.holesPlayed} holes`;
}

function titleCase(value) {
  return value.replace(/([A-Z])/g, " $1").replace(/^./, char => char.toUpperCase());
}

document.getElementById("practice-form").addEventListener("submit", handlePracticeSubmit);
document.getElementById("round-form").addEventListener("submit", handleRoundSubmit);
document.getElementById("reset-data").addEventListener("click", () => {
  if (!confirm("Reset all demo progress?")) return;
  state = defaultState();
  saveState();
  render();
});

render();
