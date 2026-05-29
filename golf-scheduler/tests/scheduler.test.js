const assert = require("node:assert/strict");
const test = require("node:test");
const { buildSchedule, parseTime, formatTime } = require("../scheduler");

test("parseTime and formatTime round-trip valid HH:MM values", () => {
  assert.equal(parseTime("06:30"), 390);
  assert.equal(formatTime(390), "06:30");
});

test("buildSchedule fills slots with available employees and favors preferences", () => {
  const result = buildSchedule({
    shifts: [
      { role: "Starter", start: "06:00", end: "10:00", needed: 1 },
      { role: "Cart Barn", start: "10:00", end: "14:00", needed: 1 },
    ],
    employees: [
      {
        name: "Alex",
        availability: [{ start: "06:00", end: "14:00" }],
        preferredRoles: "Starter",
        maxShifts: 2,
      },
      {
        name: "Bailey",
        availability: [{ start: "06:00", end: "14:00" }],
        preferredRoles: "Cart Barn",
        maxShifts: 2,
      },
    ],
  });

  assert.equal(result.unfilled.length, 0);
  assert.deepEqual(
    result.assignments.map((assignment) => `${assignment.role}:${assignment.employeeName}`),
    ["Starter:Alex", "Cart Barn:Bailey"]
  );
  assert.equal(result.stats.preferenceMatchRate, 100);
});

test("buildSchedule does not double-book overlapping shifts", () => {
  const result = buildSchedule({
    shifts: [
      { role: "Starter", start: "08:00", end: "12:00", needed: 1 },
      { role: "Ranger", start: "10:00", end: "14:00", needed: 1 },
    ],
    employees: [
      {
        name: "Casey",
        availability: [{ start: "08:00", end: "14:00" }],
        preferredRoles: "Starter, Ranger",
        maxShifts: 2,
      },
      {
        name: "Drew",
        availability: [{ start: "10:00", end: "14:00" }],
        preferredRoles: "Ranger",
        maxShifts: 1,
      },
    ],
  });

  assert.equal(result.unfilled.length, 0);
  assert.deepEqual(
    result.assignments.map((assignment) => `${assignment.role}:${assignment.employeeName}`),
    ["Starter:Casey", "Ranger:Drew"]
  );
});

test("buildSchedule reports coverage gaps when availability is insufficient", () => {
  const result = buildSchedule({
    shifts: [{ role: "Pro Shop", start: "15:00", end: "20:00", needed: 2 }],
    employees: [
      {
        name: "Elliot",
        availability: [{ start: "08:00", end: "16:00" }],
        preferredRoles: "Pro Shop",
        maxShifts: 1,
      },
    ],
  });

  assert.equal(result.assignments.length, 0);
  assert.equal(result.unfilled.length, 2);
  assert.match(result.unfilled[0].message, /No available employee/);
});

test("buildSchedule respects unavailable roles and max shift limits", () => {
  const result = buildSchedule({
    shifts: [
      { role: "Cart Barn", start: "08:00", end: "10:00", needed: 1 },
      { role: "Cart Barn", start: "10:00", end: "12:00", needed: 1 },
      { role: "Ranger", start: "12:00", end: "14:00", needed: 1 },
    ],
    employees: [
      {
        name: "Finley",
        availability: [{ start: "08:00", end: "14:00" }],
        preferredRoles: "Cart Barn",
        maxShifts: 1,
      },
      {
        name: "Gray",
        availability: [{ start: "08:00", end: "14:00" }],
        preferredRoles: "Ranger",
        unavailableRoles: "Cart Barn",
        maxShifts: 2,
      },
    ],
  });

  assert.deepEqual(
    result.assignments.map((assignment) => `${assignment.role}:${assignment.employeeName}`),
    ["Cart Barn:Finley", "Ranger:Gray"]
  );
  assert.equal(result.unfilled.length, 1);
});
