const TaskList = require('../models/TaskList');
const Task = require('../models/Task');
const User = require('../models/User');

async function resetScheduledTaskLists() {
  const now = new Date();

  const allLists = await TaskList.find({
    'resetSchedule.number': { $ne: null },
    'resetSchedule.cadence': { $ne: null },
    'resetSchedule.startDate': { $ne: null },
  });

  let resetCount = 0;
  const affectedUserIds = new Set();

  function getNthWeekdayOfMonth(year, month, weekday, nth) {
  const firstDay = new Date(Date.UTC(year, month, 1));
  let day = 1 + ((7 + weekday - firstDay.getUTCDay()) % 7) + (nth - 1) * 7;
  const date = new Date(Date.UTC(year, month, day));
  return date.getUTCMonth() === month ? date : null;
}


  for (const list of allLists) {
    const { number, cadence, startDate, lastReset } = list.resetSchedule;
    const user = await User.findById(list.userId);
    if (!user || !user.isPro) continue;

    const start = new Date(startDate); // UTC

    const now = new Date();
let cycles = 0;
let nextReset;

const weekday = start.getUTCDay(); // 0 = Sunday, 6 = Saturday

switch (cadence) {
  case 'days': {
    const msPerCycle = 1000 * 60 * 60 * 24 * number;
    const elapsed = now.getTime() - start.getTime();
    cycles = Math.floor(elapsed / msPerCycle);
    nextReset = new Date(start.getTime() + cycles * msPerCycle);
    break;
  }

  case 'weeks': {
    const startWeek = new Date(start);
    startWeek.setUTCDate(start.getUTCDate() + number * 7 * Math.floor((now - start) / (1000 * 60 * 60 * 24 * 7 * number)));
    startWeek.setUTCHours(start.getUTCHours(), start.getUTCMinutes(), 0, 0);
    nextReset = startWeek;
    break;
  }

  case 'months': {
    const nth = Math.floor((start.getUTCDate() - 1) / 7) + 1;
    const totalMonths = (now.getUTCFullYear() - start.getUTCFullYear()) * 12 + (now.getUTCMonth() - start.getUTCMonth());
    cycles = Math.floor(totalMonths / number);

    const targetMonth = start.getUTCMonth() + number * cycles;
    nextReset = getNthWeekdayOfMonth(
      start.getUTCFullYear() + Math.floor(targetMonth / 12),
      targetMonth % 12,
      weekday,
      nth
    );
    if (!nextReset || now < nextReset) continue;
    break;
  }

  case 'years': {
    const nth = Math.floor((start.getUTCDate() - 1) / 7) + 1;
    const thisYear = now.getUTCFullYear();
    const startMonth = start.getUTCMonth();
    const yearsPassed = thisYear - start.getUTCFullYear();
    cycles = Math.floor(yearsPassed / number);

    const resetYear = start.getUTCFullYear() + number * cycles;

    nextReset = getNthWeekdayOfMonth(resetYear, startMonth, weekday, nth);
    if (!nextReset || now < nextReset) continue;
    break;
  }
}


if (cycles === 0) continue;

// Generate nextReset based on cycles * cadence from the original startDate
nextReset = new Date(start); // reset baseline
switch (cadence) {
  case 'days':
    nextReset.setUTCDate(start.getUTCDate() + number * cycles);
    break;
  case 'weeks':
    nextReset.setUTCDate(start.getUTCDate() + 7 * number * cycles);
    break;
  case 'months':
    nextReset.setUTCMonth(start.getUTCMonth() + number * cycles);
    break;
  case 'years':
    nextReset.setUTCFullYear(start.getUTCFullYear() + number * cycles);
    break;
}


    if (now >= nextReset && (!lastReset || lastReset < nextReset)) {
      await Task.updateMany({ tasklistId: list._id }, { isComplete: false });

      list.resetSchedule.lastReset = now;
      await list.save();
      resetCount++;

    affectedUserIds.add(list.userId.toString());
    }
  }

  console.log(`✅ Reset ${resetCount} task list${resetCount === 1 ? '' : 's'}`);
  return Array.from(affectedUserIds);
}

module.exports = resetScheduledTaskLists;
