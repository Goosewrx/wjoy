const STORAGE_KEY = "golf-scheduler-state-v2";

const ZONES = ["Carts & Range", "Rangers/Starters", "Shop Employees"];

const TIME_OPTIONS = [
  ...Array.from({ length: 37 }, (_, index) => {
    const minutes = 5 * 60 + index * 30;
    return {
      value: `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`,
      label: window.GolfScheduler.formatTime(minutes),
    };
  }),
  { value: "Close", label: "Close" },
];

const defaultState = {
  shifts: [
    {
      zone: "Carts & Range",
      role: "Cart / Range Attendant",
      start: "07:00",
      end: "12:00",
      needed: 1,
      days: "Mon · Wed · Fri · Sat · Sun",
      notes: "Standard week",
    },
    {
      zone: "Carts & Range",
      role: "Cart / Range Attendant",
      start: "10:00",
      end: "15:00",
      needed: 1,
      days: "All Days",
      notes: "Standard week",
    },
    {
      zone: "Carts & Range",
      role: "Range Attendant",
      start: "15:00",
      end: "Close",
      needed: 1,
      days: "All Days",
      notes: "★ Standard week",
    },
    {
      zone: "Carts & Range",
      role: "Cart Attendant",
      start: "15:00",
      end: "Close",
      needed: 1,
      days: "All Days",
      notes: "Standard week",
    },
    {
      zone: "Carts & Range",
      role: "Cart / Range Attendant",
      start: "10:00",
      end: "15:00",
      needed: 1,
      days: "Outing Days",
      notes: "Outing days",
    },
    {
      zone: "Carts & Range",
      role: "Outing Cart Clean",
      start: "13:00",
      end: "16:00",
      needed: 2,
      days: "Outing Days",
      notes: "2 staff needed",
    },
    {
      zone: "Carts & Range",
      role: "Range Attendant",
      start: "16:00",
      end: "Close",
      needed: 1,
      days: "Outing Days",
      notes: "★",
    },
    {
      zone: "Carts & Range",
      role: "Cart Attendant",
      start: "16:00",
      end: "Close",
      needed: 1,
      days: "Outing Days",
      notes: "Outing days",
    },
  ],
  employees: [
    {
      name: "Alex",
      zones: "Carts & Range",
      availability: [{ start: "07:00", end: "15:00" }],
      preferredRoles: "Cart / Range Attendant",
      unavailableRoles: "",
      maxShifts: 2,
    },
    {
      name: "Chris",
      zones: "Carts & Range",
      availability: [{ start: "07:00", end: "Close" }],
      preferredRoles: "Cart / Range Attendant, Cart Attendant",
      unavailableRoles: "",
      maxShifts: 3,
    },
    {
      name: "Devin",
      zones: "Carts & Range",
      availability: [{ start: "12:00", end: "Close" }],
      preferredRoles: "Range Attendant, Outing Cart Clean",
      unavailableRoles: "",
      maxShifts: 3,
    },
    {
      name: "Taylor",
      zones: "Carts & Range",
      availability: [{ start: "13:00", end: "Close" }],
      preferredRoles: "Outing Cart Clean, Cart Attendant",
      unavailableRoles: "",
      maxShifts: 3,
    },
  ],
};

const shiftsBody = document.querySelector("#shifts-body");
const employeesBody = document.querySelector("#employees-body");
const scheduleBody = document.querySelector("#schedule-body");
const unfilledList = document.querySelector("#unfilled-list");
const statsPanel = document.querySelector("#stats-panel");
const resultSummary = document.querySelector("#result-summary");
const errorBox = document.querySelector("#error-box");

function inferZone(role = "") {
  const normalized = role.toLowerCase();
  if (normalized.includes("cart") || normalized.includes("range")) {
    return "Carts & Range";
  }
  if (normalized.includes("shop") || normalized.includes("pro")) {
    return "Shop Employees";
  }
  if (normalized.includes("starter") || normalized.includes("ranger")) {
    return "Rangers/Starters";
  }
  return ZONES[0];
}

function loadState() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : structuredClone(defaultState);
  } catch (error) {
    return structuredClone(defaultState);
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(readFormState()));
}

function createInput(value, type = "text", options = {}) {
  const input = document.createElement("input");
  input.type = type;
  input.value = value ?? "";
  Object.entries(options).forEach(([key, optionValue]) => {
    input[key] = optionValue;
  });
  input.addEventListener("input", saveState);
  return input;
}

function createZoneSelect(value) {
  const select = document.createElement("select");
  ZONES.forEach((zone) => {
    const option = document.createElement("option");
    option.value = zone;
    option.textContent = zone;
    select.appendChild(option);
  });
  select.value = ZONES.includes(value) ? value : inferZone(value);
  select.addEventListener("change", saveState);
  return select;
}

function createTimeSelect(value) {
  const select = document.createElement("select");
  TIME_OPTIONS.forEach((time) => {
    const option = document.createElement("option");
    option.value = time.value;
    option.textContent = time.label;
    select.appendChild(option);
  });
  select.value = value || "08:00";
  if (!select.value) {
    select.value = "08:00";
  }
  select.addEventListener("change", saveState);
  return select;
}

function createCell(child) {
  const cell = document.createElement("td");
  cell.appendChild(child);
  return cell;
}

function removeRowButton(label) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "link-button";
  button.textContent = label;
  button.addEventListener("click", () => {
    button.closest("tr").remove();
    saveState();
  });
  return button;
}

function renderShiftRow(shift = {}) {
  const row = document.createElement("tr");
  row.append(
    createCell(createZoneSelect(shift.zone || inferZone(shift.role))),
    createCell(createInput(shift.role || "", "text", { placeholder: "Cart / Range Attendant" })),
    createCell(createTimeSelect(shift.start || "08:00")),
    createCell(createTimeSelect(shift.end || "12:00")),
    createCell(createInput(shift.needed || 1, "number", { min: 1 })),
    createCell(createInput(shift.days || "", "text", { placeholder: "All Days" })),
    createCell(createInput(shift.notes || "", "text", { placeholder: "Optional" })),
    createCell(removeRowButton("Remove"))
  );
  shiftsBody.appendChild(row);
}

function formatAvailability(availability) {
  return (availability || [{ start: "08:00", end: "17:00" }])
    .map(
      (window) =>
        `${GolfScheduler.formatTime(GolfScheduler.parseTime(window.start))}-${GolfScheduler.formatTime(
          GolfScheduler.parseTime(window.end)
        )}`
    )
    .join(", ");
}

function renderEmployeeRow(employee = {}) {
  const row = document.createElement("tr");
  row.append(
    createCell(createInput(employee.name || "", "text", { placeholder: "Employee" })),
    createCell(createInput(employee.zones || inferZone(employee.preferredRoles), "text", { placeholder: ZONES.join(", ") })),
    createCell(createInput(formatAvailability(employee.availability), "text", { placeholder: "6:00 AM-1:00 PM, 2:00 PM-6:00 PM" })),
    createCell(createInput(employee.preferredRoles || "", "text", { placeholder: "Starter, Ranger" })),
    createCell(createInput(employee.unavailableRoles || "", "text", { placeholder: "Cart Barn" })),
    createCell(createInput(employee.maxShifts || 2, "number", { min: 1 })),
    createCell(removeRowButton("Remove"))
  );
  employeesBody.appendChild(row);
}

function renderForm(state) {
  shiftsBody.replaceChildren();
  employeesBody.replaceChildren();
  state.shifts.forEach(renderShiftRow);
  state.employees.forEach(renderEmployeeRow);
}

function parseAvailability(value) {
  return value
    .split(",")
    .map((range) => range.trim())
    .filter(Boolean)
    .map((range) => {
      const [start, end] = range.split(/\s*-\s*/).map((part) => part.trim());
      return { start, end };
    });
}

function readFormState() {
  const shifts = Array.from(shiftsBody.querySelectorAll("tr")).map((row) => {
    const [zone, role, start, end, needed, days, notes] = row.querySelectorAll("select, input");
    return {
      zone: zone.value,
      role: role.value,
      start: start.value,
      end: end.value,
      needed: needed.value,
      days: days.value,
      notes: notes.value,
    };
  });

  const employees = Array.from(employeesBody.querySelectorAll("tr")).map((row) => {
    const [name, zones, availability, preferredRoles, unavailableRoles, maxShifts] =
      row.querySelectorAll("input");
    return {
      name: name.value,
      zones: zones.value,
      availability: parseAvailability(availability.value),
      preferredRoles: preferredRoles.value,
      unavailableRoles: unavailableRoles.value,
      maxShifts: maxShifts.value,
    };
  });

  return { shifts, employees };
}

function clearResults() {
  scheduleBody.replaceChildren();
  unfilledList.replaceChildren();
  statsPanel.replaceChildren();
  resultSummary.textContent = "";
  errorBox.hidden = true;
}

function textCell(value) {
  const cell = document.createElement("td");
  cell.textContent = value;
  return cell;
}

function zoneBadge(zone) {
  const badge = document.createElement("span");
  badge.className = "zone-badge";
  badge.textContent = zone;
  return badge;
}

function renderSchedule(result) {
  scheduleBody.replaceChildren();
  ZONES.forEach((zone) => {
    const zoneAssignments = result.assignments.filter((assignment) => assignment.zone === zone);
    if (!zoneAssignments.length) {
      return;
    }

    const headerRow = document.createElement("tr");
    const headerCell = document.createElement("td");
    headerCell.colSpan = 7;
    headerCell.className = "zone-row";
    headerCell.appendChild(zoneBadge(zone));
    headerRow.appendChild(headerCell);
    scheduleBody.appendChild(headerRow);

    zoneAssignments.forEach((assignment) => {
      const row = document.createElement("tr");
      const preference = assignment.preferenceMatched ? "Preferred" : "Available";
      const fitCell = document.createElement("td");
      const fit = document.createElement("span");
      fit.className = "pill";
      fit.textContent = preference;
      fitCell.appendChild(fit);

      row.append(
        textCell(assignment.zone),
        textCell(`${assignment.start} - ${assignment.end}`),
        textCell(assignment.role),
        textCell(assignment.days || ""),
        textCell(assignment.employeeName),
        fitCell,
        textCell(assignment.notes || "")
      );
      scheduleBody.appendChild(row);
    });
  });
}

function renderUnfilled(result) {
  unfilledList.replaceChildren();
  if (!result.unfilled.length) {
    const item = document.createElement("li");
    item.textContent = "All requested coverage is filled.";
    item.className = "success";
    unfilledList.appendChild(item);
    return;
  }

  result.unfilled.forEach((gap) => {
    const item = document.createElement("li");
    item.textContent = gap.message;
    unfilledList.appendChild(item);
  });
}

function renderStats(result) {
  statsPanel.replaceChildren();
  const cards = [
    ["Assignments", result.stats.totalAssignments],
    ["Preference match", `${result.stats.preferenceMatchRate}%`],
    ["Open slots", result.unfilled.length],
  ];

  ZONES.forEach((zone) => {
    const zoneStats = result.stats.byZone.find((item) => item.zone === zone);
    cards.push([zone, zoneStats ? `${zoneStats.assignments} shift(s)` : "0 shift(s)"]);
  });

  cards.forEach(([label, value]) => {
    const card = document.createElement("div");
    card.className = "stat-card";
    const labelEl = document.createElement("span");
    labelEl.textContent = label;
    const valueEl = document.createElement("strong");
    valueEl.textContent = value;
    card.append(labelEl, valueEl);
    statsPanel.appendChild(card);
  });

  result.stats.byEmployee.forEach((employee) => {
    const card = document.createElement("div");
    card.className = "stat-card compact";
    const name = document.createElement("span");
    name.textContent = employee.employeeName;
    const hours = document.createElement("strong");
    hours.textContent = `${employee.hours} hrs`;
    const shifts = document.createElement("small");
    shifts.textContent = `${employee.shifts} shift(s)`;
    card.append(name, hours, shifts);
    statsPanel.appendChild(card);
  });
}

function generateSchedule() {
  clearResults();
  try {
    const state = readFormState();
    const result = window.GolfScheduler.buildSchedule(state);
    saveState();
    renderSchedule(result);
    renderUnfilled(result);
    renderStats(result);
    resultSummary.textContent = result.unfilled.length
      ? `${result.assignments.length} assignment(s) made with ${result.unfilled.length} open slot(s).`
      : `${result.assignments.length} assignment(s) made and every slot is covered.`;
  } catch (error) {
    errorBox.textContent = error.message;
    errorBox.hidden = false;
  }
}

document.querySelector("#add-shift").addEventListener("click", () => {
  renderShiftRow();
  saveState();
});

document.querySelector("#add-employee").addEventListener("click", () => {
  renderEmployeeRow();
  saveState();
});

document.querySelector("#generate").addEventListener("click", generateSchedule);

document.querySelector("#reset-sample").addEventListener("click", () => {
  localStorage.removeItem(STORAGE_KEY);
  renderForm(structuredClone(defaultState));
  clearResults();
});

renderForm(loadState());
generateSchedule();
