const assert = require("node:assert/strict");
const test = require("node:test");
const { buildSchedule, parseTime, formatTime } = require("../scheduler");

test("parseTime accepts AM/PM values and formatTime returns AM/PM labels", () => {
  assert.equal(parseTime("6:30 AM"), 390);
  assert.equal(parseTime("6:30 PM"), 1110);
  assert.equal(parseTime("Close"), 1200);
  assert.equal(formatTime(390), "6:30 AM");
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

test("buildSchedule prioritizes constrained slots before broad shifts", () => {
  const result = buildSchedule({
    shifts: [
      { role: "Cart Barn", start: "06:00", end: "12:00", needed: 1 },
      { role: "Starter", start: "06:30", end: "10:30", needed: 1 },
    ],
    employees: [
      {
        name: "Alex",
        availability: [{ start: "06:00", end: "13:00" }],
        preferredRoles: "Starter, Cart Barn",
        maxShifts: 2,
      },
      {
        name: "Chris",
        availability: [{ start: "06:00", end: "18:00" }],
        preferredRoles: "Cart Barn",
        maxShifts: 2,
      },
    ],
  });

  assert.equal(result.unfilled.length, 0);
  assert.deepEqual(
    result.assignments.map((assignment) => `${assignment.role}:${assignment.employeeName}`),
    ["Cart Barn:Chris", "Starter:Alex"]
  );
});

test("buildSchedule preserves template days and Close labels", () => {
  const result = buildSchedule({
    shifts: [
      {
        zone: "Carts & Range",
        role: "Range Attendant",
        start: "3:00 PM",
        end: "Close",
        needed: 1,
        days: "All Days",
        notes: "★",
      },
    ],
    employees: [
      {
        name: "Lee",
        zones: "Carts & Range",
        availability: [{ start: "2:00 PM", end: "Close" }],
        preferredRoles: "Range Attendant",
        maxShifts: 1,
      },
    ],
  });

  assert.equal(result.unfilled.length, 0);
  assert.equal(result.assignments[0].end, "Close");
  assert.equal(result.assignments[0].days, "All Days");
  assert.equal(result.assignments[0].notes, "★");
});

test("buildSchedule keeps employees inside their assigned staffing zones", () => {
  const result = buildSchedule({
    shifts: [
      { zone: "Carts & Range", role: "Cart Barn", start: "6:00 AM", end: "10:00 AM", needed: 1 },
      { zone: "Shop Employees", role: "Pro Shop", start: "6:00 AM", end: "10:00 AM", needed: 1 },
    ],
    employees: [
      {
        name: "Harper",
        zones: "Carts & Range",
        availability: [{ start: "5:00 AM", end: "12:00 PM" }],
        preferredRoles: "Cart Barn, Pro Shop",
        maxShifts: 2,
      },
      {
        name: "Indy",
        zones: "Shop Employees",
        availability: [{ start: "5:00 AM", end: "12:00 PM" }],
        preferredRoles: "Pro Shop",
        maxShifts: 1,
      },
    ],
  });

  assert.equal(result.unfilled.length, 0);
  assert.deepEqual(
    result.assignments.map((assignment) => `${assignment.zone}:${assignment.role}:${assignment.employeeName}`),
    ["Carts & Range:Cart Barn:Harper", "Shop Employees:Pro Shop:Indy"]
  );
});

test("buildSchedule lets always-available employees cover any shift time", () => {
  const result = buildSchedule({
    shifts: [
      { zone: "Carts & Range", role: "Cart Attendant", start: "5:00 AM", end: "9:00 AM", needed: 1 },
    ],
    employees: [
      {
        name: "Parker",
        zones: "Carts & Range",
        alwaysAvailable: true,
        availability: [],
        preferredRoles: "Cart Attendant",
        maxShifts: 1,
      },
    ],
  });

  assert.equal(result.unfilled.length, 0);
  assert.equal(result.assignments[0].employeeName, "Parker");
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
