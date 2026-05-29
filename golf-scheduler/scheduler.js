/*
 * Golf course shift scheduler.
 *
 * The algorithm expands each requested shift into one slot per person needed,
 * then greedily chooses the best available employee for each slot. Candidate
 * scoring favors role preferences first and uses assigned minutes as a tie
 * breaker so the output stays reasonably fair for a small course staff.
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.GolfScheduler = factory();
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  const DAY_MINUTES = 24 * 60;
  const CLOSE_MINUTES = 20 * 60;

  function parseTime(value) {
    if (typeof value !== "string") {
      throw new Error("Time must be a string like 6:30 AM or 6:30 PM.");
    }

    const cleaned = value.trim().replace(/\s+/g, " ");
    if (cleaned.toLowerCase() === "close") {
      return CLOSE_MINUTES;
    }

    const meridiemMatch = cleaned.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/i);
    const twentyFourHourMatch = cleaned.match(/^(\d{1,2}):(\d{2})$/);

    if (meridiemMatch) {
      let hours = Number(meridiemMatch[1]);
      const minutes = Number(meridiemMatch[2] || "0");
      const meridiem = meridiemMatch[3].toUpperCase();

      if (hours < 1 || hours > 12 || minutes < 0 || minutes > 59) {
        throw new Error(`Invalid time "${value}". Use a valid 12-hour time.`);
      }

      if (meridiem === "AM" && hours === 12) {
        hours = 0;
      } else if (meridiem === "PM" && hours !== 12) {
        hours += 12;
      }

      return hours * 60 + minutes;
    }

    if (twentyFourHourMatch) {
      const hours = Number(twentyFourHourMatch[1]);
      const minutes = Number(twentyFourHourMatch[2]);
      if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
        throw new Error(`Invalid time "${value}". Use a valid 12-hour time.`);
      }
      return hours * 60 + minutes;
    }

    throw new Error(`Invalid time "${value}". Use a time like 6:30 AM.`);
  }

  function formatTime(minutes) {
    const normalized = ((minutes % DAY_MINUTES) + DAY_MINUTES) % DAY_MINUTES;
    const totalHours = Math.floor(normalized / 60);
    const mins = normalized % 60;
    const meridiem = totalHours >= 12 ? "PM" : "AM";
    const hours = totalHours % 12 || 12;
    return `${hours}:${String(mins).padStart(2, "0")} ${meridiem}`;
  }

  function normalizeZone(value) {
    return String(value || "General").trim();
  }

  function toArray(value) {
    if (Array.isArray(value)) {
      return value
        .map((item) => String(item).trim())
        .filter(Boolean);
    }

    if (typeof value === "string") {
      return value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    }

    return [];
  }

  function formatTimeLabel(value, minutes) {
    return String(value || "").trim().toLowerCase() === "close" ? "Close" : formatTime(minutes);
  }

  function normalizeWindow(window, label) {
    const start = parseTime(window.start);
    const end = parseTime(window.end);
    if (end <= start) {
      throw new Error(`${label} must end after it starts.`);
    }

    return {
      start,
      end,
      startLabel: formatTimeLabel(window.start, start),
      endLabel: formatTimeLabel(window.end, end),
    };
  }

  function normalizeShift(shift, index) {
    const window = normalizeWindow(shift, `Shift ${index + 1}`);
    const role = String(shift.role || "").trim();
    if (!role) {
      throw new Error(`Shift ${index + 1} needs a role.`);
    }

    const needed = Number.parseInt(shift.needed, 10);
    if (!Number.isInteger(needed) || needed < 1) {
      throw new Error(`Shift ${index + 1} needs at least one person.`);
    }

    return {
      id: shift.id || `shift-${index + 1}`,
      role,
      zone: normalizeZone(shift.zone),
      start: window.start,
      end: window.end,
      startLabel: window.startLabel,
      endLabel: window.endLabel,
      needed,
      days: String(shift.days || "").trim(),
      notes: String(shift.notes || "").trim(),
    };
  }

  function normalizeEmployee(employee, index) {
    const name = String(employee.name || "").trim();
    if (!name) {
      throw new Error(`Employee ${index + 1} needs a name.`);
    }

    const availability = (employee.availability || []).map((window, windowIndex) =>
      normalizeWindow(window, `${name} availability ${windowIndex + 1}`)
    );

    const maxShifts = Number.parseInt(employee.maxShifts || "99", 10);
    return {
      id: employee.id || `employee-${index + 1}`,
      name,
      availability,
      zones: toArray(employee.zones).map((zone) => zone.toLowerCase()),
      preferredRoles: toArray(employee.preferredRoles).map((role) => role.toLowerCase()),
      unavailableRoles: toArray(employee.unavailableRoles).map((role) => role.toLowerCase()),
      maxShifts: Number.isInteger(maxShifts) && maxShifts > 0 ? maxShifts : 99,
    };
  }

  function covers(window, shift) {
    return window.start <= shift.start && window.end >= shift.end;
  }

  function overlaps(first, second) {
    return first.start < second.end && second.start < first.end;
  }

  function canWork(employee, shift, state) {
    const role = shift.role.toLowerCase();
    const assignments = state.byEmployee.get(employee.id) || [];
    const reasons = [];

    if (employee.unavailableRoles.includes(role)) {
      reasons.push("not trained for role");
    }

    if (employee.zones.length && !employee.zones.includes(shift.zone.toLowerCase())) {
      reasons.push("different zone");
    }

    if (!employee.availability.some((window) => covers(window, shift))) {
      reasons.push("not available");
    }

    if (assignments.length >= employee.maxShifts) {
      reasons.push("max shifts reached");
    }

    if (assignments.some((assignment) => overlaps(assignment, shift))) {
      reasons.push("already working then");
    }

    return {
      ok: reasons.length === 0,
      reasons,
    };
  }

  function scoreCandidate(employee, shift, state) {
    const assignments = state.byEmployee.get(employee.id) || [];
    const role = shift.role.toLowerCase();
    const assignedMinutes = assignments.reduce(
      (total, assignment) => total + (assignment.end - assignment.start),
      0
    );
    const preferenceScore = employee.preferredRoles.includes(role) ? 1000 : 0;
    const availabilityFit = employee.availability.reduce((best, window) => {
      if (!covers(window, shift)) {
        return best;
      }
      const spareMinutes = shift.start - window.start + window.end - shift.end;
      return Math.max(best, 300 - spareMinutes);
    }, 0);

    return preferenceScore + availabilityFit - assignedMinutes;
  }

  function expandShiftSlots(shifts) {
    return shifts.flatMap((shift) =>
      Array.from({ length: shift.needed }, (_, slotIndex) => ({
        ...shift,
        slotId: `${shift.id}-${slotIndex + 1}`,
        slotNumber: slotIndex + 1,
      }))
    );
  }

  function candidatePool(shift, employees) {
    const role = shift.role.toLowerCase();
    return employees.filter(
      (employee) =>
        !employee.unavailableRoles.includes(role) &&
        (!employee.zones.length || employee.zones.includes(shift.zone.toLowerCase())) &&
        employee.availability.some((window) => covers(window, shift))
    );
  }

  function slotPriority(shift, employees) {
    const pool = candidatePool(shift, employees);
    const role = shift.role.toLowerCase();
    const preferredCount = pool.filter((employee) =>
      employee.preferredRoles.includes(role)
    ).length;

    return {
      preferredCount,
      candidateCount: pool.length,
    };
  }

  function createState(employees) {
    return {
      byEmployee: new Map(employees.map((employee) => [employee.id, []])),
      reasonCounts: new Map(),
    };
  }

  function recordRejections(state, shift, employees) {
    employees.forEach((employee) => {
      const check = canWork(employee, shift, state);
      if (!check.ok) {
        check.reasons.forEach((reason) => {
          state.reasonCounts.set(reason, (state.reasonCounts.get(reason) || 0) + 1);
        });
      }
    });
  }

  function buildSchedule(input) {
    const shifts = (input.shifts || []).map(normalizeShift).sort((a, b) => a.start - b.start);
    const employees = (input.employees || []).map(normalizeEmployee);
    const state = createState(employees);
    const assignments = [];
    const unfilled = [];

    const slots = expandShiftSlots(shifts).sort((a, b) => {
      const aPriority = slotPriority(a, employees);
      const bPriority = slotPriority(b, employees);

      return (
        aPriority.preferredCount - bPriority.preferredCount ||
        aPriority.candidateCount - bPriority.candidateCount ||
        a.start - b.start ||
        a.role.localeCompare(b.role)
      );
    });

    slots.forEach((slot) => {
      const candidates = employees
        .map((employee) => {
          const check = canWork(employee, slot, state);
          return {
            employee,
            check,
            score: check.ok ? scoreCandidate(employee, slot, state) : Number.NEGATIVE_INFINITY,
          };
        })
        .filter((candidate) => candidate.check.ok)
        .sort((a, b) => b.score - a.score || a.employee.name.localeCompare(b.employee.name));

      if (!candidates.length) {
        recordRejections(state, slot, employees);
        unfilled.push({
          zone: slot.zone,
          role: slot.role,
          start: slot.startLabel,
          end: slot.endLabel,
          slotNumber: slot.slotNumber,
          days: slot.days,
          message: `No available employee for ${slot.zone} / ${slot.role} ${slot.startLabel}-${slot.endLabel}.`,
        });
        return;
      }

      const employee = candidates[0].employee;
      const assignment = {
        employeeId: employee.id,
        employeeName: employee.name,
        zone: slot.zone,
        role: slot.role,
        start: slot.startLabel,
        end: slot.endLabel,
        startMinutes: slot.start,
        endMinutes: slot.end,
        slotNumber: slot.slotNumber,
        preferenceMatched: employee.preferredRoles.includes(slot.role.toLowerCase()),
        days: slot.days,
        notes: slot.notes,
      };

      assignments.push(assignment);
      state.byEmployee.get(employee.id).push({
        start: slot.start,
        end: slot.end,
        zone: slot.zone,
        role: slot.role,
      });
    });

    return {
      assignments: assignments.sort(
        (a, b) => a.zone.localeCompare(b.zone) || a.startMinutes - b.startMinutes || a.role.localeCompare(b.role)
      ),
      unfilled,
      stats: buildStats(assignments, employees, state.reasonCounts),
    };
  }

  function buildStats(assignments, employees, reasonCounts) {
    const byEmployee = employees.map((employee) => {
      const employeeAssignments = assignments.filter(
        (assignment) => assignment.employeeId === employee.id
      );
      const minutes = employeeAssignments.reduce(
        (total, assignment) => total + (assignment.endMinutes - assignment.startMinutes),
        0
      );

      return {
        employeeId: employee.id,
        employeeName: employee.name,
        shifts: employeeAssignments.length,
        hours: Math.round((minutes / 60) * 10) / 10,
      };
    });

    const preferenceMatches = assignments.filter((assignment) => assignment.preferenceMatched).length;
    return {
      totalAssignments: assignments.length,
      preferenceMatches,
      preferenceMatchRate: assignments.length
        ? Math.round((preferenceMatches / assignments.length) * 100)
        : 0,
      byZone: buildZoneStats(assignments),
      byEmployee,
      rejectionReasons: Array.from(reasonCounts.entries()).map(([reason, count]) => ({
        reason,
        count,
      })),
    };
  }

  function buildZoneStats(assignments) {
    const zones = new Map();

    assignments.forEach((assignment) => {
      const current = zones.get(assignment.zone) || { zone: assignment.zone, assignments: 0, hours: 0 };
      current.assignments += 1;
      current.hours += (assignment.endMinutes - assignment.startMinutes) / 60;
      zones.set(assignment.zone, current);
    });

    return Array.from(zones.values()).map((zone) => ({
      ...zone,
      hours: Math.round(zone.hours * 10) / 10,
    }));
  }

  return {
    buildSchedule,
    formatTime,
    parseTime,
  };
});
