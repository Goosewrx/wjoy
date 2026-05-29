const STORAGE_KEY = "golf-scheduler-state-v1";

const defaultState = {
  shifts: [
    {
      role: "Starter",
      start: "06:30",
      end: "10:30",
      needed: 1,
      notes: "First tee and pace-of-play setup",
    },
    {
      role: "Cart Barn",
      start: "06:00",
      end: "12:00",
      needed: 2,
      notes: "Morning carts and range pick",
    },
    {
      role: "Pro Shop",
      start: "08:00",
      end: "14:00",
      needed: 1,
      notes: "Check-ins, phone, tee sheet",
    },
    {
      role: "Ranger",
      start: "11:00",
      end: "16:00",
      needed: 1,
      notes: "Midday course loop",
    },
    {
      role: "Cart Barn",
      start: "12:00",
      end: "18:00",
      needed: 2,
      notes: "Turnover, wash, close prep",
    },
  ],
  employees: [
    {
      name: "Alex",
      availability: [{ start: "06:00", end: "13:00" }],
      preferredRoles: "Starter, Cart Barn",
      unavailableRoles: "",
      maxShifts: 2,
    },
    {
      name: "Brianna",
      availability: [{ start: "08:00", end: "18:00" }],
      preferredRoles: "Pro Shop, Ranger",
      unavailableRoles: "Cart Barn",
      maxShifts: 2,
    },
    {
      name: "Chris",
      availability: [{ start: "06:00", end: "18:00" }],
      preferredRoles: "Cart Barn",
      unavailableRoles: "",
      maxShifts: 3,
    },
    {
      name: "Devin",
      availability: [{ start: "10:00", end: "19:00" }],
      preferredRoles: "Ranger, Cart Barn",
      unavailableRoles: "",
      maxShifts: 2,
    },
    {
      name: "Morgan",
      availability: [{ start: "06:00", end: "12:00" }],
      preferredRoles: "Starter",
      unavailableRoles: "",
      maxShifts: 1,
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
    createCell(createInput(shift.role || "", "text", { placeholder: "Cart Barn" })),
    createCell(createInput(shift.start || "08:00", "time")),
    createCell(createInput(shift.end || "12:00", "time")),
    createCell(createInput(shift.needed || 1, "number", { min: 1 })),
    createCell(createInput(shift.notes || "", "text", { placeholder: "Optional" })),
    createCell(removeRowButton("Remove"))
  );
  shiftsBody.appendChild(row);
}

function renderEmployeeRow(employee = {}) {
  const availability = (employee.availability || [{ start: "08:00", end: "17:00" }])
    .map((window) => `${window.start}-${window.end}`)
    .join(", ");
  const row = document.createElement("tr");
  row.append(
    createCell(createInput(employee.name || "", "text", { placeholder: "Employee" })),
    createCell(createInput(availability, "text", { placeholder: "08:00-17:00, 18:00-20:00" })),
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
      const [start, end] = range.split("-").map((part) => part.trim());
      return { start, end };
    });
}

function readFormState() {
  const shifts = Array.from(shiftsBody.querySelectorAll("tr")).map((row) => {
    const [role, start, end, needed, notes] = row.querySelectorAll("input");
    return {
      role: role.value,
      start: start.value,
      end: end.value,
      needed: needed.value,
      notes: notes.value,
    };
  });

  const employees = Array.from(employeesBody.querySelectorAll("tr")).map((row) => {
    const [name, availability, preferredRoles, unavailableRoles, maxShifts] =
      row.querySelectorAll("input");
    return {
      name: name.value,
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

function renderSchedule(result) {
  scheduleBody.replaceChildren();
  result.assignments.forEach((assignment) => {
    const row = document.createElement("tr");
    const preference = assignment.preferenceMatched ? "Preferred" : "Available";
    const fitCell = document.createElement("td");
    const fit = document.createElement("span");
    fit.className = "pill";
    fit.textContent = preference;
    fitCell.appendChild(fit);

    row.append(
      textCell(`${assignment.start} - ${assignment.end}`),
      textCell(assignment.role),
      textCell(assignment.employeeName),
      fitCell,
      textCell(assignment.notes || "")
    );
    scheduleBody.appendChild(row);
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
